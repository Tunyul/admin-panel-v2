import React, { useState } from 'react'
import { Box, Button } from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import RefreshIcon from '@mui/icons-material/Refresh'
import { useSearchParams } from 'react-router-dom'
import ContentOrders from '../components/ContentOrders'
import TableToolbar from '../components/TableToolbar'
import AddOrderModal from '../components/AddOrderModal'
import TableSettingsButton from '../components/TableSettingsButton'

function Orders() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [showAddOrderModal, setShowAddOrderModal] = useState(false)

  const updateParam = (key, value) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value === '' || value == null) {
      params.delete(key)
    } else {
      params.set(key, value)
    }
    setSearchParams(params)
  }

  const statusUrgensiOptions = [
    { value: 'urgent', label: 'Urgent' },
    { value: 'normal', label: 'Normal' },
    { value: 'low', label: 'Low' }
  ]

  const statusOrderOptions = [
    { value: 'pending', label: 'Pending' },
    { value: 'processing', label: 'Processing' },
    { value: 'completed', label: 'Completed' },
    { value: 'cancelled', label: 'Cancelled' }
  ]

  const statusBayarOptions = [
    { value: 'pending', label: 'Pending' },
    { value: 'partial', label: 'Partial' },
    { value: 'paid', label: 'Paid' },
    { value: 'overdue', label: 'Overdue' }
  ]

  return (
    <Box>
      {/* Header with actions */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flex: 1 }}>
          <TableToolbar
            value={searchParams.get('q') || ''}
            onChange={(value) => updateParam('q', value)}
            placeholder="Search orders (No Transaksi, Customer, etc.)"
            hideFilters
          />
        </Box>
        
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <TableSettingsButton 
            tableId="orders" 
            variant="button" 
            showLabel={true}
          />
          <Button 
            startIcon={<RefreshIcon />} 
            variant="outlined" 
            size="small" 
            onClick={() => window.dispatchEvent(new CustomEvent('app:refresh:orders'))}
          >
            Refresh
          </Button>
          <Button 
            startIcon={<AddIcon />} 
            variant="contained" 
            size="small" 
            onClick={() => setShowAddOrderModal(true)}
          >
            Add Order
          </Button>
        </Box>
      </Box>

      {/* Orders Table */}
      <ContentOrders />

      {/* Add Order Modal */}
      <AddOrderModal 
        open={showAddOrderModal} 
        onClose={() => setShowAddOrderModal(false)}
        onOrderCreated={() => {
          setShowAddOrderModal(false)
          window.dispatchEvent(new CustomEvent('app:refresh:orders'))
        }}
      />
    </Box>
  )
}

export default Orders
