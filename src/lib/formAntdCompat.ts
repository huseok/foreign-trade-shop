/**
 * antd 5 部分版本的 `FormInstance` 类型与 `rc-field-form` 解析不一致，运行时 API 仍可用。
 * 需要调用 `getFieldValue` / `validateFields` 等时经此断言收窄。
 */
import type { FormInstance as AntdFormInstance } from 'antd/es/form/Form'
import type { FormInstance as RcFormInstance } from 'rc-field-form/es/interface'

export function asRcFormInstance<T = unknown>(form: AntdFormInstance<T>): RcFormInstance<T> {
  return form as unknown as RcFormInstance<T>
}
