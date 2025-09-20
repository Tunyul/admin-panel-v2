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
const Invoice = React.lazy(() => import('./pages/Invoice'))
const PublicInvoice = React.lazy(() => import('./pages/PublicInvoice'))
const Piutangs = React.lazy(() => import('./pages/Piutangs'))
const SetupWizard = React.lazy(() => import('./pages/SetupWizard'))
import Notification from './components/Notification'
import Login from './pages/Login'
import LogoutButton from './components/LogoutButton'
import PageTransition from './components/PageTransition'
import useLoadingStore from './store/loadingStore'
import SocketProvider from './components/SocketProvider'

function PrivateRoute({ children }) {
  const token = localStorage.getItem('token')
  return token ? children : <Navigate to="/login" />
}

function App() {
  const location = useLocation();
  // navigation loader removed — render routes immediately
  const [displayLocation, setDisplayLocation] = useState(location);
  const _busy = useLoadingStore((s) => s.busy);
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
                <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
                  <Header />
                  <div style={{ display: 'flex', flex: '0 1 auto', alignItems: 'stretch', minHeight: 0 }}>
                    <Sidebar />
                    <div
                      style={{
                        // main content area — fixed height and scrollable
                        marginTop: 72,
                        marginLeft: 230,
                        height: 'calc(100vh - 72px)',
                        display: 'block',
                        padding: window.innerWidth < 600 ? '8px' : '24px 20px',
                        width: 'calc(100% - 230px)',
                        overflowY: 'auto',
                        overflowX: 'hidden',
                      }}
                    >
                      {/* route-aware transitions */}
                      <PageTransition pathname={displayLocation.pathname}>
                        <Suspense fallback={<div /> }>
                          <Routes location={displayLocation} key={displayLocation.pathname}>
                            <Route path="/" element={<Dashboard />} />
                            <Route path="/orders" element={<Orders />} />
                            <Route path="/products" element={<Products />} />
                            <Route path="/customers" element={<Customers />} />
                            <Route path="/payments" element={<Payments />} />
                            <Route path="/invoices" element={<Invoice />} />
                            <Route path="/piutangs" element={<Piutangs />} />
                            <Route path="/setup" element={<SetupWizard />} />
                          </Routes>
                        </Suspense>
                      </PageTransition>
                      {/* navigation loader removed */}
                    </div>
                  </div>
                </div>
              </SocketProvider>
            </PrivateRoute>
          }
        />
      </Routes>
      <Notification />
    </>
  )
}

export default App
