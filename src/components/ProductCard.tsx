import { Link } from 'react-router-dom'
import type { Product } from '../data/mockProducts'
import { getCategoryById } from '../data/mockProducts'
import './ProductCard.css'

type Props = {
  product: Product
}

export function ProductCard({ product }: Props) {
  const cat = getCategoryById(product.categoryId)

  return (
    <article className="product-card">
      <Link to={`/products/${product.id}`} className="product-card__media">
        <div
          className="product-card__img"
          style={{ background: product.imageGradient }}
          role="img"
          aria-label={product.name}
        />
      </Link>
      <div className="product-card__body">
        {cat && (
          <span className="product-card__cat">{cat.name}</span>
        )}
        <h3 className="product-card__title">
          <Link to={`/products/${product.id}`}>{product.name}</Link>
        </h3>
        <p className="product-card__desc">{product.shortDescription}</p>
        <div className="product-card__footer">
          <span className="product-card__price">
            {product.currency} {product.price.toFixed(2)}
          </span>
          <Link to={`/products/${product.id}`} className="product-card__cta">
            View
          </Link>
        </div>
      </div>
    </article>
  )
}
