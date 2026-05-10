import { Link } from 'react-router-dom'
import type { ProductDto } from '../../types/api'
import { useI18n } from '../../i18n/I18nProvider'
import { productThumbUrl } from '../../lib/media/resolveMediaUrl'
import './ProductCard.scss'

type Props = {
  product: ProductDto
}

export function ProductCard({ product }: Props) {
  const { t } = useI18n()
  const thumb = productThumbUrl(product)
  return (
    <article className="product-card">
      <Link to={`/products/${product.id}`} className="product-card__media">
        {thumb ? (
          <img className="product-card__img product-card__img--photo" src={thumb} alt="" loading="lazy" />
        ) : (
          <div
            className="product-card__img"
            style={{ background: 'linear-gradient(135deg, #1e3a5f 0%, var(--primary, #2563eb) 100%)' }}
            role="img"
            aria-label={product.title}
          />
        )}
      </Link>
      <div className="product-card__body">
        <span className="product-card__cat">{product.originCountry ?? 'Global'}</span>
        <h3 className="product-card__title">
          <Link to={`/products/${product.id}`}>{product.title}</Link>
        </h3>
        {product.tags && product.tags.length > 0 && (
          <div className="product-card__tags">
            {product.tags.map((tg) => (
              <span key={tg.id} className="product-card__tag">
                {tg.name}
              </span>
            ))}
          </div>
        )}
        <p className="product-card__desc">{product.description ?? t('product.noDesc')}</p>
        <div className="product-card__footer">
          <span className="product-card__price">
            {product.price == null ? '—' : `${product.currency ?? 'USD'} ${Number(product.price).toFixed(2)}`}
          </span>
          <Link to={`/products/${product.id}`} className="product-card__cta">
            {t('product.view')}
          </Link>
        </div>
      </div>
    </article>
  )
}
