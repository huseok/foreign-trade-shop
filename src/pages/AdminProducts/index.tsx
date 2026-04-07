import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { useCreateAdminProduct, useMe, useProducts } from '../../hooks/apiHooks'
import { toErrorMessage } from '../../lib/http/error'
import './AdminProducts.scss'

/**
 * 后台商品管理页：
 * 提供管理员新增商品（含 SKU）与商品列表查看能力。
 */
export function AdminProducts() {
  const { data: me, isLoading: meLoading } = useMe(true)
  const { data: products = [], isLoading: productsLoading } = useProducts()
  const createMutation = useCreateAdminProduct()
  const [msg, setMsg] = useState<string | null>(null)

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = e.currentTarget
    const fd = new FormData(form)
    const payload = {
      title: String(fd.get('title') ?? '').trim(),
      price: Number(fd.get('price') ?? 0),
      currency: String(fd.get('currency') ?? 'USD').trim().toUpperCase(),
      moq: Number(fd.get('moq') ?? 1),
      description: String(fd.get('description') ?? '').trim() || undefined,
      skuCode: String(fd.get('skuCode') ?? '').trim() || undefined,
      hsCode: String(fd.get('hsCode') ?? '').trim() || undefined,
      unit: String(fd.get('unit') ?? '').trim() || undefined,
      incoterm: String(fd.get('incoterm') ?? '').trim().toUpperCase() || undefined,
      originCountry: String(fd.get('originCountry') ?? '').trim() || undefined,
      leadTimeDays: Number(fd.get('leadTimeDays') ?? 0) || undefined,
      isActive: Boolean(fd.get('isActive')),
    }

    try {
      setMsg(null)
      const resp = await createMutation.mutateAsync(payload)
      setMsg(`Product created successfully. ID=${resp.id}`)
      form.reset()
    } catch (err) {
      setMsg(toErrorMessage(err, 'Create product failed'))
    }
  }

  if (meLoading) {
    return <div className="page-pad"><div className="container"><p>Loading...</p></div></div>
  }

  if (me?.role !== 'ADMIN') {
    return (
      <div className="admin-products page-pad">
        <div className="container">
          <header className="page-header">
            <p className="admin-products__eyebrow">Admin</p>
            <h1 className="page-header__title">Product Management</h1>
            <p className="page-header__desc">You do not have ADMIN permission.</p>
          </header>
          <Link to="/" className="btn btn--primary">Back home</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="admin-products page-pad">
      <div className="container">
        <header className="page-header">
          <p className="admin-products__eyebrow">Admin</p>
          <h1 className="page-header__title">Product Management</h1>
          <p className="page-header__desc">
            Add new products with SKU and trade fields. Data is saved to backend.
          </p>
        </header>

        <section className="admin-products__card">
          <h2 className="admin-products__title">Create Product</h2>
          <form className="admin-products__form" onSubmit={onSubmit}>
            <label className="field">
              <span className="field__label">Title</span>
              <input className="input" name="title" required />
            </label>
            <div className="field-row field-row--3">
              <label className="field">
                <span className="field__label">Price</span>
                <input className="input" name="price" type="number" min="0.01" step="0.01" required />
              </label>
              <label className="field">
                <span className="field__label">Currency</span>
                <input className="input" name="currency" defaultValue="USD" required />
              </label>
              <label className="field">
                <span className="field__label">MOQ</span>
                <input className="input" name="moq" type="number" min="1" defaultValue="1" required />
              </label>
            </div>
            <div className="field-row field-row--3">
              <label className="field">
                <span className="field__label">SKU Code</span>
                <input className="input" name="skuCode" />
              </label>
              <label className="field">
                <span className="field__label">HS Code</span>
                <input className="input" name="hsCode" />
              </label>
              <label className="field">
                <span className="field__label">Unit</span>
                <input className="input" name="unit" placeholder="pcs" />
              </label>
            </div>
            <div className="field-row field-row--3">
              <label className="field">
                <span className="field__label">Incoterm</span>
                <input className="input" name="incoterm" placeholder="FOB" />
              </label>
              <label className="field">
                <span className="field__label">Origin Country</span>
                <input className="input" name="originCountry" placeholder="CN" />
              </label>
              <label className="field">
                <span className="field__label">Lead Time (days)</span>
                <input className="input" name="leadTimeDays" type="number" min="0" />
              </label>
            </div>
            <label className="field">
              <span className="field__label">Description</span>
              <textarea className="input input--textarea" name="description" rows={3} />
            </label>
            <label className="field field--checkbox">
              <input type="checkbox" name="isActive" defaultChecked />
              <span>Active</span>
            </label>
            <button type="submit" className="btn btn--primary">
              {createMutation.isPending ? 'Creating...' : 'Create Product'}
            </button>
            {msg && <p className="admin-products__msg">{msg}</p>}
          </form>
        </section>

        <section className="admin-products__card">
          <h2 className="admin-products__title">Current Products</h2>
          {productsLoading ? (
            <p>Loading products...</p>
          ) : (
            <div className="admin-products__table-wrap">
              <table className="admin-products__table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Title</th>
                    <th>SKU</th>
                    <th>Price</th>
                    <th>MOQ</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((p) => (
                    <tr key={p.id}>
                      <td>{p.id}</td>
                      <td>{p.title}</td>
                      <td>{p.skuCode ?? '-'}</td>
                      <td>{p.price === null ? '-' : `${p.currency} ${Number(p.price).toFixed(2)}`}</td>
                      <td>{p.moq}</td>
                      <td>{p.isActive ? 'ACTIVE' : 'INACTIVE'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
