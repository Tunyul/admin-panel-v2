import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import './App.css'
import MainLayout from './layouts/MainLayout'
import Dashboard from './pages/Dashboard'
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
              <MainLayout>
                <Dashboard />
              </MainLayout>
            </PrivateRoute>
          }
        />
      </Routes>
      <Notification />
    </>
  )
}

export default App
