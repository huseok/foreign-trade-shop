import { Space, Typography } from 'antd'

type Props = {
  title: string
  description: string
}

/**
 * 后台页面统一头部：
 * - 统一标题层级和文案样式
 * - 减少每个页面重复样板代码
 */
export function AdminPageHeader({ title, description }: Props) {
  return (
    <Space direction="vertical" size={4} style={{ width: '100%' }}>
      <Typography.Title level={4} style={{ margin: 0 }}>
        {title}
      </Typography.Title>
      <Typography.Text type="secondary">{description}</Typography.Text>
    </Space>
  )
}
