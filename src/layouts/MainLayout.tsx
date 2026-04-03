import { Outlet } from 'react-router-dom'
import { Footer } from '../components/Footer'
import { Header } from '../components/Header'
import './MainLayout.css'

export function MainLayout() {
  return (
    <div className="main-layout">
      <Header />
      <main className="main-layout__main">
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}
