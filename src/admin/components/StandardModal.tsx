/**
 * 统一 Modal 壳层：与设计稿「白底、圆角 8、脚栏右对齐」一致；具体 footer 仍由页面传入。
 */
import { Modal, type ModalProps } from 'antd'

export function StandardModal(props: ModalProps) {
  const { rootClassName, classNames, ...rest } = props
  return (
    <Modal
      {...rest}
      rootClassName={['std-modal', rootClassName].filter(Boolean).join(' ')}
      classNames={{
        ...classNames,
      }}
    />
  )
}
