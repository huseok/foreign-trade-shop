/**
 * 联系人页面：
 * 展示站点商务联系人信息，满足“姓名/WA/微信”需求。
 */
export function ContactPage() {
  return (
    <section className="page-pad">
      <div className="container">
        <h1 className="page-header__title">联系我们</h1>
        <p className="page-header__desc">商务合作或采购支持，请通过以下方式联系。</p>
        <div style={{ marginTop: 24, display: 'grid', gap: 12 }}>
          <div>姓名：CHZfobkey Team</div>
          <div>WA：+86 188-0000-0000</div>
          <div>微信：CHZfobkey_Biz</div>
        </div>
      </div>
    </section>
  )
}
