import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import './App.css'
// import MainLayout from './layouts/MainLayout'
import Sidebar from './components/Sidebar'
import Header from './components/Header'
import Dashboard from './pages/Dashboard'
import Orders from './pages/Orders'
import Products from './pages/Products'
import Customers from './pages/Customers'
import Payments from './pages/Payments'
import Piutangs from './pages/Piutangs'
import SetupWizard from './pages/SetupWizard'
import Notification from './components/Notification'
import Login from './pages/Login'
import LogoutButton from './components/LogoutButton'

function PrivateRoute({ children }) {
  const token = localStorage.getItem('token')
  return token ? children : <Navigate to="/login" />
}

function App() {
  return (
    <>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/*"
          element={
            <PrivateRoute>
              <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
                <Header />
                <div style={{ display: 'flex', flex: 1, alignItems: 'stretch', minHeight: 0 }}>
                  <Sidebar />
                  <div
                    style={{
                      flex: 1,
                      display: 'flex',
                      flexDirection: 'column',
                      padding: window.innerWidth < 600 ? '8px 8px 24px 8px' : '24px 52px 32px 24px',
                      maxWidth: 'clamp(100%, 96vw, 1200px)',
                      overflowY: 'auto',
                      overflowX: 'hidden',
                      minHeight: 0,
                    }}
                  >
                    <Routes>
                      <Route path="/" element={<Dashboard />} />
                      <Route path="/orders" element={<Orders />} />
                      <Route path="/products" element={<Products />} />
                      <Route path="/customers" element={<Customers />} />
                      <Route path="/payments" element={<Payments />} />
                      <Route path="/piutangs" element={<Piutangs />} />
                    </Routes>
                  </div>
                </div>
              </div>
            </PrivateRoute>
          }
        />
      </Routes>
      <Notification />
    </>
  )
}

export default App
