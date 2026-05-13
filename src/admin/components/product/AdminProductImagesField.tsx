/**
 * 商品图编排列表：上传走 `POST /api/v1/admin/media/upload`，表单值为 ProductImageRef[]。
 * 大图在上传前于浏览器端压缩；小图跳过。支持拖拽与点击。
 */
import { InboxOutlined, PlusOutlined } from '@ant-design/icons'
import { App, Button, Form, Image, Input, Space, Tag, Typography, Upload } from 'antd'
import type { UploadProps } from 'antd'
import { useState } from 'react'
import { asRcFormInstance } from '../../../lib/formAntdCompat'
import type { AdminProductUpsertRequest } from '../../../types/api'
import { compressImageForUpload } from '../../../lib/media/compressImageForUpload'
import { resolveMediaUrl } from '../../../lib/media/resolveMediaUrl'
import { voyage } from '../../../openapi/voyageSdk'
import { useI18n } from '../../../i18n/useI18n'

type Img = NonNullable<AdminProductUpsertRequest['images']>[number]

export function AdminProductImagesField() {
  const { message } = App.useApp()
  const { t } = useI18n()
  const form = asRcFormInstance(Form.useFormInstance())
  const [uploading, setUploading] = useState(false)

  const customRequest: UploadProps['customRequest'] = async (options) => {
    const raw = options.file as File
    setUploading(true)
    try {
      const file = await compressImageForUpload(raw)
      const r = await voyage.media.upload(file)
      const cur = (form.getFieldValue('images') as Img[] | undefined) ?? []
      form.setFieldsValue({ images: [...cur, { thumbUrl: r.thumbUrl, fullUrl: r.fullUrl }] })
      message.success('上传成功')
      options.onSuccess?.(r)
    } catch (e) {
      message.error('上传失败')
      options.onError?.(e as Error)
    } finally {
      setUploading(false)
    }
  }

  return (
    <Form.Item
      label={t('admin.products.images')}
      extra={
        <Typography.Paragraph type="secondary" style={{ marginBottom: 0 }}>
          {t('admin.products.uploadTip')} {t('admin.products.coverHint')}
        </Typography.Paragraph>
      }
    >
      <Form.List name="images">
        {(fields, { remove, move }) => (
          <Space direction="vertical" style={{ width: '100%' }} size="middle">
            <Space wrap align="start">
              {fields.map((field) => {
                const idx = field.name
                const isCover = idx === 0
                const last = idx === fields.length - 1
                return (
                  <Space
                    key={field.key}
                    align="center"
                    wrap
                    style={{ border: '1px solid #f0f0f0', padding: 8, borderRadius: 8 }}
                  >
                    <Form.Item {...field} name={[field.name, 'thumbUrl']} hidden>
                      <Input />
                    </Form.Item>
                    <Form.Item {...field} name={[field.name, 'fullUrl']} hidden>
                      <Input />
                    </Form.Item>
                    <Form.Item noStyle shouldUpdate>
                      {() => {
                        const thumb = form.getFieldValue(['images', field.name, 'thumbUrl']) as string | undefined
                        return (
                          <Image
                            src={resolveMediaUrl(thumb)}
                            alt=""
                            width={72}
                            height={72}
                            style={{ objectFit: 'cover', borderRadius: 4 }}
                          />
                        )
                      }}
                    </Form.Item>
                    <Space direction="vertical" size={4}>
                      {isCover ? (
                        <Tag color="blue">{t('admin.products.imageCover')}</Tag>
                      ) : (
                        <Button type="link" size="small" style={{ padding: 0, height: 'auto' }} onClick={() => move(idx, 0)}>
                          {t('admin.products.setAsCover')}
                        </Button>
                      )}
                      <Space size={0} wrap>
                        <Button
                          type="link"
                          size="small"
                          disabled={idx <= 0}
                          style={{ padding: '0 4px', height: 'auto' }}
                          onClick={() => move(idx, idx - 1)}
                        >
                          {t('admin.products.imageMoveUp')}
                        </Button>
                        <Button
                          type="link"
                          size="small"
                          disabled={last}
                          style={{ padding: '0 4px', height: 'auto' }}
                          onClick={() => move(idx, idx + 1)}
                        >
                          {t('admin.products.imageMoveDown')}
                        </Button>
                      </Space>
                      <Button type="link" danger size="small" style={{ padding: 0, height: 'auto' }} onClick={() => remove(field.name)}>
                        {t('admin.products.imageRemove')}
                      </Button>
                    </Space>
                  </Space>
                )
              })}
            </Space>
            <Upload.Dragger
              multiple
              accept="image/*"
              showUploadList={false}
              customRequest={customRequest}
              disabled={uploading}
              style={{ padding: '16px 12px' }}
            >
              <p className="ant-upload-drag-icon">
                <InboxOutlined />
              </p>
              <p className="ant-upload-text">{t('admin.products.dragHint')}</p>
              <p className="ant-upload-hint">{t('admin.products.compressHint')}</p>
            </Upload.Dragger>
            <Upload multiple accept="image/*" showUploadList={false} customRequest={customRequest} disabled={uploading}>
              <Button icon={<PlusOutlined />} loading={uploading}>
                {t('admin.products.uploadImages')}
              </Button>
            </Upload>
          </Space>
        )}
      </Form.List>
    </Form.Item>
  )
}
