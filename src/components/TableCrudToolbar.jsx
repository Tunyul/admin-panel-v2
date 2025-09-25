import React from 'react'
import { Box } from '@mui/material'
import { useLocation } from 'react-router-dom'

export default function TableCrudToolbar() {
  const location = useLocation()
  const isOrders = location.pathname === '/orders' || location.pathname.startsWith('/orders')

  const isPayments = location.pathname === '/payments' || location.pathname.startsWith('/payments')

  // For orders and payments pages the toolbar is handled elsewhere or not needed
  // Avoid rendering an empty toolbar on those pages
  if (isOrders || isPayments) return null

  return (
    <Box
      className="app-crud-toolbar"
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 2,
        py: 1,
        px: 2,
        borderBottom: '1px solid rgba(var(--border-rgb), 0.04)',
        background: 'transparent',
      }}
    >
      {/* This can be extended for other pages */}
    </Box>
  )
}
