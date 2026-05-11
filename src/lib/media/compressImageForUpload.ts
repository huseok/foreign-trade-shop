/**
 * 上架商品图上传前压缩（浏览器端）：
 * - ≤约 200KB：认为已足够小，原样上传
 * - 更大：按体积分段缩放最长边、JPEG 质量，服务器收到的即为压缩后文件
 * - GIF / 非 raster：不处理，避免破坏动画或异常格式
 */
const BYTES_200K = 200 * 1024
const BYTES_800K = 800 * 1024
const BYTES_3M = 3 * 1024 * 1024

export async function compressImageForUpload(file: File): Promise<File> {
  if (!file.type.startsWith('image/')) return file
  if (file.type === 'image/gif') return file
  if (file.size <= BYTES_200K) return file

  let bmp: ImageBitmap | null = null
  try {
    bmp = await createImageBitmap(file)
  } catch {
    return file
  }

  const { width, height } = bmp
  let maxSide = 1920
  let quality = 0.82
  if (file.size <= BYTES_800K) {
    maxSide = 2200
    quality = 0.88
  } else if (file.size > BYTES_3M) {
    maxSide = 1280
    quality = 0.76
  }

  const scale = Math.min(1, maxSide / Math.max(width, height))
  const w = Math.max(1, Math.round(width * scale))
  const h = Math.max(1, Math.round(height * scale))

  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    bmp.close()
    return file
  }
  ctx.drawImage(bmp, 0, 0, w, h)
  bmp.close()

  const blob: Blob | null = await new Promise((resolve) => {
    canvas.toBlob((b) => resolve(b), 'image/jpeg', quality)
  })
  if (!blob || blob.size === 0) return file
  // 压完反而更大时不替换（例如极小 PNG）
  if (blob.size >= file.size * 0.98) return file

  const baseName = file.name.replace(/\.[^.]+$/, '') || 'image'
  return new File([blob], `${baseName}.jpg`, {
    type: 'image/jpeg',
    lastModified: Date.now(),
  })
}
