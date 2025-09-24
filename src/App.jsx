import React, { useEffect, useState, Suspense } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import './App.css'
// import MainLayout from './layouts/MainLayout'
import Sidebar from './components/Sidebar'
import Header from './components/Header'
const Dashboard = React.lazy(() => import('./pages/Dashboard'))
const Orders = React.lazy(() => import('./pages/Orders'))
const Products = React.lazy(() => import('./pages/Products'))
const Customers = React.lazy(() => import('./pages/Customers'))
const Payments = React.lazy(() => import('./pages/Payments'))
const PublicInvoice = React.lazy(() => import('./pages/PublicInvoice'))
const Piutangs = React.lazy(() => import('./pages/Piutangs'))
import Notification from './components/Notification'
import Login from './pages/Login'
import LogoutButton from './components/LogoutButton'
import PageTransition from './components/PageTransition'
import AppMainToolbar from './components/AppMainToolbar'
import TableCrudToolbar from './components/TableCrudToolbar'
// loading store removed; no longer used in App
import SocketProvider from './components/SocketProvider'

function PrivateRoute({ children }) {
  const token = localStorage.getItem('token')
  return token ? children : <Navigate to="/login" />
}

function App() {
  const location = useLocation();
  // navigation loader removed — render routes immediately
  const [displayLocation, setDisplayLocation] = useState(location);
  useEffect(() => {
    // Immediately reflect location changes — no loader overlay
    if (location.pathname !== displayLocation.pathname) setDisplayLocation(location);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);
  return (
    <>
      <Routes>
        <Route path="/login" element={<Login />} />
  <Route path="/invoice/:no_transaksi" element={<PublicInvoice />} />
  <Route path="/invoice/token/:token" element={<PublicInvoice />} />
  <Route path="/invoice/static/:payload" element={<PublicInvoice />} />
        <Route
          path="/*"
          element={
            <PrivateRoute>
              <SocketProvider>
                <Header />
                <div className="app-frame">
                  <Sidebar className="app-sidebar" />
                  <div className={`app-main ${displayLocation.pathname === '/' ? 'dashboard-page' : ''}`}>
                    <AppMainToolbar />
                    <TableCrudToolbar />
                    <PageTransition pathname={displayLocation.pathname}>
                      <Suspense fallback={<div /> }>
                        <Routes location={displayLocation} key={displayLocation.pathname}>
                          <Route path="/" element={<Dashboard />} />
                          <Route path="/orders" element={<Orders />} />
                          <Route path="/products" element={<Products />} />
                          <Route path="/customers" element={<Customers />} />
                          <Route path="/payments" element={<Payments />} />
                          <Route path="/piutangs" element={<Piutangs />} />
                        </Routes>
                      </Suspense>
                    </PageTransition>
                  </div>
                </div>
              </SocketProvider>
            </PrivateRoute>
          }
        />
      </Routes>
      <Notification />
  {/* dev demo removed: DevSocketTester no longer rendered */}
    </>
  )
}

export default App
