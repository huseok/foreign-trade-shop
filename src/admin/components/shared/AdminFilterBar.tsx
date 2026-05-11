import { Space } from 'antd'
import type { ReactNode } from 'react'

type Props = {
  children: ReactNode
}

/**
 * 后台筛选栏容器：
 * 统一筛选区间距和换行行为，避免每页重复样式。
 */
export function AdminFilterBar({ children }: Props) {
  return (
    <Space wrap style={{ width: '100%', rowGap: 8 }}>
      {children}
    </Space>
  )
}
