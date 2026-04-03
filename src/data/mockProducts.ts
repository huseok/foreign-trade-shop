/**
 * 演示用商品与分类数据；接入后端后改为 API 请求，可保留类型定义。
 */
export type Category = {
  id: string
  name: string
  slug: string
}

export type Product = {
  id: string
  name: string
  shortDescription: string
  description: string
  price: number
  currency: string
  categoryId: string
  /** CSS gradient for placeholder "image" */
  imageGradient: string
  sku: string
  moq: number
}

export const categories: Category[] = [
  { id: 'cat-electronics', name: 'Electronics', slug: 'electronics' },
  { id: 'cat-textiles', name: 'Textiles', slug: 'textiles' },
  { id: 'cat-hardware', name: 'Hardware', slug: 'hardware' },
]

export const products: Product[] = [
  {
    id: 'p1',
    name: 'Industrial USB-C Hub 7-in-1',
    shortDescription: 'Aluminum shell, 4K HDMI, PD 100W pass-through.',
    description:
      'Built for procurement teams sourcing reliable peripherals. CE/FCC-ready documentation available on request. MOQ applies for custom logo.',
    price: 24.9,
    currency: 'USD',
    categoryId: 'cat-electronics',
    imageGradient: 'linear-gradient(135deg, #1e3a5f 0%, #0d9488 100%)',
    sku: 'EL-USB-7IN1',
    moq: 100,
  },
  {
    id: 'p2',
    name: 'Bluetooth 5.3 Module (bulk)',
    shortDescription: 'UART/I2C, FCC module ID reference for integration.',
    description:
      'Suitable for IoT and consumer goods factories. Long-term availability roadmap and sample packs for qualified buyers.',
    price: 3.45,
    currency: 'USD',
    categoryId: 'cat-electronics',
    imageGradient: 'linear-gradient(135deg, #312e81 0%, #6366f1 100%)',
    sku: 'EL-BT53-M',
    moq: 500,
  },
  {
    id: 'p3',
    name: 'Organic Cotton Tee (blank)',
    shortDescription: '200gsm, GOTS-friendly supply chain options.',
    description:
      'Cut-and-sew friendly blanks for private label programs. Color cards and strike-offs available after NDA.',
    price: 6.2,
    currency: 'USD',
    categoryId: 'cat-textiles',
    imageGradient: 'linear-gradient(135deg, #9f1239 0%, #f97316 100%)',
    sku: 'TX-TEE-ORG',
    moq: 300,
  },
  {
    id: 'p4',
    name: 'Recycled Polyester Fabric Roll',
    shortDescription: '150cm width, suitable for outerwear lining.',
    description:
      'Mill-direct pricing for volume orders. Test reports per batch; HS codes provided for export paperwork.',
    price: 4.85,
    currency: 'USD',
    categoryId: 'cat-textiles',
    imageGradient: 'linear-gradient(135deg, #14532d 0%, #22c55e 100%)',
    sku: 'TX-PES-R150',
    moq: 1000,
  },
  {
    id: 'p5',
    name: 'Stainless M6 Hex Bolt (DIN933)',
    shortDescription: 'A2-70, bulk cartons, mill certificate on request.',
    description:
      'Standard fastener line for machinery and construction exports. Zinc and hot-dip variants available as separate SKUs.',
    price: 0.08,
    currency: 'USD',
    categoryId: 'cat-hardware',
    imageGradient: 'linear-gradient(135deg, #334155 0%, #94a3b8 100%)',
    sku: 'HW-BOLT-M6-A2',
    moq: 5000,
  },
  {
    id: 'p6',
    name: 'Ball Bearing 6202-2RS',
    shortDescription: 'Sealed, -20°C to 120°C operating range.',
    description:
      'OEM packaging available. Lot traceability and RoHS statements for EU-bound shipments.',
    price: 0.42,
    currency: 'USD',
    categoryId: 'cat-hardware',
    imageGradient: 'linear-gradient(135deg, #1c1917 0%, #78716c 100%)',
    sku: 'HW-BRG-6202',
    moq: 2000,
  },
  {
    id: 'p7',
    name: 'LED Panel Light 40W (CE)',
    shortDescription: '4000K neutral white, flicker-free driver.',
    description:
      'Project lighting for commercial fit-outs. Photometric files and installation guides in English.',
    price: 18.5,
    currency: 'USD',
    categoryId: 'cat-electronics',
    imageGradient: 'linear-gradient(135deg, #713f12 0%, #eab308 100%)',
    sku: 'EL-LED-P40',
    moq: 200,
  },
  {
    id: 'p8',
    name: 'Canvas Tote Bag (custom print)',
    shortDescription: '12oz canvas, reinforced handles, MOQ for branding.',
    description:
      'Retail-ready packaging optional. Artwork templates and proofing workflow for repeat buyers.',
    price: 2.95,
    currency: 'USD',
    categoryId: 'cat-textiles',
    imageGradient: 'linear-gradient(135deg, #78350f 0%, #d97706 100%)',
    sku: 'TX-TOTE-12OZ',
    moq: 500,
  },
]

export function getProductById(id: string): Product | undefined {
  return products.find((p) => p.id === id)
}

export function getCategoryById(id: string): Category | undefined {
  return categories.find((c) => c.id === id)
}
