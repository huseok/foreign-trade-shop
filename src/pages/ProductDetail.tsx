import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import {
  getCategoryById,
  getProductById,
} from '../data/mockProducts'
import './ProductDetail.css'

export function ProductDetail() {
  const { id } = useParams<{ id: string }>()
  const product = id ? getProductById(id) : undefined
  const category = product ? getCategoryById(product.categoryId) : undefined
  const { addItem } = useCart()
  const [qty, setQty] = useState(1)
  const [added, setAdded] = useState(false)

  if (!product) {
    return (
      <div className="page-pad">
        <div className="container narrow">
          <h1 className="page-header__title">Product not found</h1>
          <p className="page-header__desc">
            This SKU does not exist in our demo catalog.
          </p>
          <Link to="/catalog" className="btn btn--primary">
            Back to catalog
          </Link>
        </div>
      </div>
    )
  }

  const handleAdd = () => {
    addItem(product.id, qty)
    setAdded(true)
  }

  return (
    <div className="product-detail page-pad">
      <div className="container">
        <nav className="breadcrumb" aria-label="Breadcrumb">
          <Link to="/">Home</Link>
          <span aria-hidden> / </span>
          <Link to="/catalog">Catalog</Link>
          <span aria-hidden> / </span>
          <span className="breadcrumb__current">{product.name}</span>
        </nav>

        <div className="product-detail__grid">
          <div
            className="product-detail__media"
            style={{ background: product.imageGradient }}
            role="img"
            aria-label={product.name}
          />

          <div className="product-detail__info">
            {category && (
              <span className="product-detail__cat">{category.name}</span>
            )}
            <h1 className="product-detail__title">{product.name}</h1>
            <p className="product-detail__sku">
              SKU: {product.sku} · MOQ: {product.moq} units
            </p>
            <p className="product-detail__price">
              <span className="product-detail__amount">
                {product.currency} {product.price.toFixed(2)}
              </span>
              <span className="product-detail__unit"> / unit (sample tier)</span>
            </p>
            <p className="product-detail__desc">{product.description}</p>

            <div className="product-detail__specs">
              <h2 className="product-detail__specs-title">Specifications</h2>
              <ul className="product-detail__specs-list">
                <li>Export-friendly HS documentation on request</li>
                <li>Batch certificates available for qualified orders</li>
                <li>Lead time: indicative — confirm at checkout</li>
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
                {added && (
                  <p className="product-detail__added" role="status">
                    Added — view{' '}
                    <Link to="/cart">cart</Link>.
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
