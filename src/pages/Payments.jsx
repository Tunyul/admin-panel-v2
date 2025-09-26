import React from 'react'
import { Box, Button } from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import RefreshIcon from '@mui/icons-material/Refresh'
import { useSearchParams } from 'react-router-dom'
import ContentPayments from '../components/ContentPayments'
import TableToolbar from '../components/TableToolbar'
import TableSettingsButton from '../components/TableSettingsButton'

function Payments() {
  const [searchParams, setSearchParams] = useSearchParams()

  const openAdd = () => {
    window.dispatchEvent(new CustomEvent('app:open:add-payment'))
  }

  return (
    <Box>
      {/* Header with actions */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flex: 1 }}>
          <TableToolbar
            value={searchParams.get('q') || ''}
            onChange={(value) => {
              const params = new URLSearchParams(searchParams.toString())
              if (value === '' || value == null) params.delete('q')
              else params.set('q', value)
              setSearchParams(params)
            }}
            placeholder="Search payments"
          />
        </Box>

        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <TableSettingsButton tableId="payments" variant="button" showLabel={true} />
          <Button startIcon={<RefreshIcon />} variant="outlined" size="small" onClick={() => window.dispatchEvent(new CustomEvent('app:refresh:payments'))}>Refresh</Button>
          <Button startIcon={<AddIcon />} variant="contained" size="small" onClick={openAdd}>Add Payment</Button>
        </Box>
      </Box>

      <ContentPayments />
    </Box>
  )
}

export default Payments