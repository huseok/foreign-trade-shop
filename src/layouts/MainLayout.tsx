import { useEffect, useRef } from 'react'
import { Outlet } from 'react-router-dom'
import { Footer } from '../components/Footer'
import { Header } from '../components/Header'
import { authStore } from '../lib/auth/authStore'
import { syncLocalCartToServer } from '../lib/cart/localCart'
import { voyage } from '../openapi/voyageSdk'
import '../styles/marketplace.css'
import './MainLayout.css'

export function MainLayout() {
  const syncedRef = useRef(false)
  useEffect(() => {
    if (!authStore.isLoggedIn() || syncedRef.current) return
    syncedRef.current = true
    // 兜底同步：用户已登录且本地还有遗留购物车时，进入站点自动补同步一次。
    void syncLocalCartToServer(voyage.cart.addItem)
  }, [])

  return (
    <div className="main-layout sf-market-root" data-sf-theme="marketplace">
      <Header />
      <main className="main-layout__main">
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}
