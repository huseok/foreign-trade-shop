/** 替换文案中的 `{{key}}` 占位符（JSON 内不便拼接时使用）。 */
export function i18nTpl(str: string, vars: Record<string, string | number>): string {
  return Object.entries(vars).reduce(
    (acc, [k, v]) => acc.replaceAll(`{{${k}}}`, String(v)),
    str,
  )
}
