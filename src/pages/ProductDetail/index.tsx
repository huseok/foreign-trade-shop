import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useAddCartItem, useProductDetail } from '../../hooks/apiHooks'
import { toErrorMessage } from '../../lib/http/error'
import './ProductDetail.scss'

export function ProductDetail() {
  const { id: rawId } = useParams<{ id: string }>()
  const id = rawId ? Number(rawId) : undefined
  const { data: product, isLoading } = useProductDetail(id)
  const addItemMutation = useAddCartItem()
  const [qty, setQty] = useState(1)
  const [msg, setMsg] = useState<string | null>(null)

  if (isLoading) {
    return <div className="page-pad"><div className="container narrow"><p>Loading...</p></div></div>
  }

  if (!product) {
    return (
      <div className="page-pad">
        <div className="container narrow">
          <h1 className="page-header__title">Product not found</h1>
          <p className="page-header__desc">
            This SKU does not exist in backend catalog.
          </p>
          <Link to="/catalog" className="btn btn--primary">
            Back to catalog
          </Link>
        </div>
      </div>
    )
  }

  const handleAdd = async () => {
    try {
      await addItemMutation.mutateAsync({ productId: product.id, quantity: qty })
      setMsg('Added — view cart.')
    } catch (err) {
      setMsg(toErrorMessage(err, 'Add to cart failed'))
    }
  }

  return (
    <div className="product-detail page-pad">
      <div className="container">
        <nav className="breadcrumb" aria-label="Breadcrumb">
          <Link to="/">Home</Link>
          <span aria-hidden> / </span>
          <Link to="/catalog">Catalog</Link>
          <span aria-hidden> / </span>
          <span className="breadcrumb__current">{product.title}</span>
        </nav>

        <div className="product-detail__grid">
          <div className="product-detail__media" style={{ background: 'linear-gradient(135deg, #1e3a5f 0%, #0d9488 100%)' }} role="img" aria-label={product.title} />

          <div className="product-detail__info">
            <span className="product-detail__cat">{product.originCountry ?? 'Global'}</span>
            <h1 className="product-detail__title">{product.title}</h1>
            <p className="product-detail__sku">
              SKU: {product.skuCode ?? '-'} · MOQ: {product.moq} units
            </p>
            <p className="product-detail__price">
              <span className="product-detail__amount">
                {product.price === null ? 'Login to view price' : `${product.currency} ${Number(product.price).toFixed(2)}`}
              </span>
              <span className="product-detail__unit"> / unit</span>
            </p>
            <p className="product-detail__desc">{product.description ?? 'No description'}</p>

            <div className="product-detail__specs">
              <h2 className="product-detail__specs-title">Specifications</h2>
              <ul className="product-detail__specs-list">
                <li>HS code: {product.hsCode ?? 'N/A'}</li>
                <li>Batch certificates available for qualified orders</li>
                <li>Lead time: {product.leadTimeDays ?? '-'} days</li>
              </ul>
            </div>

            <div className="product-detail__buy">
              <label htmlFor="qty" className="product-detail__qty-label">
                Quantity
              </label>
              <div className="product-detail__qty-row">
                <input
                  id="qty"
                  type="number"
                  min={1}
                  value={qty}
                  onChange={(e) =>
                    setQty(Math.max(1, parseInt(e.target.value, 10) || 1))
                  }
                  className="input input--narrow"
                />
                <button
                  type="button"
                  className="btn btn--primary btn--lg"
                  onClick={handleAdd}
                >
                  Add to cart
                </button>
                {msg && (
                  <p className="product-detail__added" role="status">
                    {msg} <Link to="/cart">cart</Link>.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
