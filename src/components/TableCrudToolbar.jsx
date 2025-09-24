import React from 'react'
import { Box } from '@mui/material'
import { useLocation } from 'react-router-dom'

export default function TableCrudToolbar() {
  const location = useLocation()
  const isOrders = location.pathname === '/orders' || location.pathname.startsWith('/orders')

  // For orders page, the toolbar is now handled in Orders.jsx
  // This component can be used for other pages or removed entirely
  if (isOrders) return null

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
