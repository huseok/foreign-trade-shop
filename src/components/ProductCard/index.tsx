import { Link } from 'react-router-dom'
import type { ProductDto } from '../../types/api'
import './ProductCard.scss'

type Props = {
  product: ProductDto
}

export function ProductCard({ product }: Props) {
  return (
    <article className="product-card">
      <Link to={`/products/${product.id}`} className="product-card__media">
        <div
          className="product-card__img"
          style={{ background: 'linear-gradient(135deg, #1e3a5f 0%, #0d9488 100%)' }}
          role="img"
          aria-label={product.title}
        />
      </Link>
      <div className="product-card__body">
        <span className="product-card__cat">{product.originCountry ?? 'Global'}</span>
        <h3 className="product-card__title">
          <Link to={`/products/${product.id}`}>{product.title}</Link>
        </h3>
        <p className="product-card__desc">{product.description ?? 'No description'}</p>
        <div className="product-card__footer">
          <span className="product-card__price">
            {product.price === null ? 'Login to view price' : `${product.currency} ${Number(product.price).toFixed(2)}`}
          </span>
          <Link to={`/products/${product.id}`} className="product-card__cta">
            View
          </Link>
        </div>
      </div>
    </article>
  )
}
