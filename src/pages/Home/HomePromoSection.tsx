import { Carousel } from 'antd'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useSitePromos } from '../../hooks/apiHooks'
import { useI18n } from '../../i18n/I18nProvider'
import { resolveMediaUrl } from '../../lib/media/resolveMediaUrl'
import { voyage } from '../../openapi/voyageSdk'

type SitePromoSlide = Awaited<ReturnType<typeof voyage.site.listPromos>>[number]

type Props = {
  sampleProductId: number
}

function PromoCta({ href }: { href?: string | null }) {
  const { t } = useI18n()
  const raw = href?.trim()
  if (!raw) return null
  const label = t('home.promoCta')
  if (raw.startsWith('/') && !raw.startsWith('//')) {
    return (
      <Link to={raw} className="btn btn--primary">
        {label}
      </Link>
    )
  }
  return (
    <a href={raw} className="btn btn--primary" target="_blank" rel="noreferrer">
      {label}
    </a>
  )
}

function HomePromoCarouselTrack({ slides }: { slides: SitePromoSlide[] }) {
  const [activeIdx, setActiveIdx] = useState(0)
  const total = slides.length

  return (
    <div className="home-carousel-block">
      <Carousel
        autoplay
        autoplaySpeed={5500}
        dots={{ className: 'home-carousel-block__dots' }}
        className="home-promo__carousel"
        adaptiveHeight
        afterChange={setActiveIdx}
      >
        {slides.map((slide) => {
          const img = resolveMediaUrl(slide.imageUrl)
          return (
            <div key={slide.id}>
              <div className="home-promo__slide">
                <div className="home-promo__copy">
                  {slide.title ? <h3 className="home-promo__title">{slide.title}</h3> : null}
                  {slide.subtitle ? <p className="home-promo__subtitle">{slide.subtitle}</p> : null}
                  {slide.body ? <p className="home-promo__body">{slide.body}</p> : null}
                  <div className="home-promo__actions">
                    <PromoCta href={slide.actionUrl} />
                  </div>
                </div>
                <div className="home-promo__visual" aria-hidden={!img}>
                  {img ? (
                    <img src={img} alt="" loading="lazy" />
                  ) : (
                    <div className="home-promo__visual-placeholder" />
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </Carousel>
      {total > 0 ? (
        <p className="home-carousel-block__index" aria-live="polite">
          {activeIdx + 1} / {total}
        </p>
      ) : null}
    </div>
  )
}

export function HomePromoSection({ sampleProductId }: Props) {
  const { t } = useI18n()
  const { data, isLoading } = useSitePromos()
  const slides = data ?? []
  const carouselKey = useMemo(() => data?.map((s) => s.id).join('-') ?? '', [data])

  if (isLoading) {
    return <div className="home-promo home-promo--loading" aria-busy="true" aria-label={t('home.promoSectionTitle')} />
  }

  if (slides.length === 0) {
    return (
      <div className="home-newsletter__box">
        <div>
          <h2 className="home-newsletter__title">{t('home.bannerTitle')}</h2>
          <p className="home-newsletter__text">{t('home.bannerText')}</p>
        </div>
        <Link to={`/products/${sampleProductId}`} className="btn btn--primary">
          {t('home.bannerCta')}
        </Link>
      </div>
    )
  }

  return (
    <div className="home-promo">
      <h2 className="section-title home-promo__heading">{t('home.promoSectionTitle')}</h2>
      <HomePromoCarouselTrack key={carouselKey} slides={slides} />
    </div>
  )
}
