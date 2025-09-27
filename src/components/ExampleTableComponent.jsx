import React, { useState, useMemo } from 'react'
import {
  Box,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Typography,
  Chip,
  IconButton,
  Checkbox,
  TableSortLabel,
  Tooltip,
  Paper
} from '@mui/material'
import MoreVertIcon from '@mui/icons-material/MoreVert'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import { useTableColumns, useTableFilters, useTableSorting } from '../hooks/useTableSettings'
import TableSettingsButton from './TableSettingsButton'

// Contoh implementasi tabel dengan sistem pengaturan global
function ExampleTableComponent({ 
  tableId = 'example',
  data = [],
  loading = false,
  onEdit,
  onDelete 
}) {
  // Gunakan hooks untuk pengaturan global
  const { visibleColumns, columnVisibility } = useTableColumns(tableId)
  const { 
    filters, 
    setFilter 
  } = useTableFilters(tableId, {
    status: '',
    category: '',
    date_from: '',
    date_to: ''
  })
  const { 
    sortConfig, 
    handleSort 
  } = useTableSorting(tableId)

  // State lokal untuk interaksi
  const [selectedIds, setSelectedIds] = useState(new Set())

  // Sortable table header component
  const SortableTableCell = ({ children, sortKey, align = 'left', ...props }) => {
    const isActive = sortConfig.key === sortKey
    const direction = isActive ? sortConfig.direction : 'asc'
    
    return (
      <TableCell 
        align={align} 
        {...props}
        sx={{
          backgroundColor: isActive ? 'action.hover' : 'inherit',
          ...props.sx
        }}
      >
        <Tooltip title={`Sort by ${children}`}>
          <TableSortLabel
            active={isActive}
            direction={direction}
            onClick={() => handleSort(sortKey)}
          >
            {children}
          </TableSortLabel>
        </Tooltip>
      </TableCell>
    )
  }

  // Helper function untuk render cell berdasarkan column type
  const renderTableCell = (columnKey, row, align = 'left') => {
    // Special handling for products table to map API fields
    if (tableId === 'products') {
      // API returns fields like nama_produk, kategori, harga_per_m2, harga_per_pcs, stock, ukuran_standar, unit_area
      switch (columnKey) {
        case 'id':
          return <TableCell key={columnKey} align={align}>{row.id || row.id_produk}</TableCell>
        case 'name':
          return <TableCell key={columnKey} align={align}>{row.name || row.nama_produk}</TableCell>
        case 'category':
          return <TableCell key={columnKey} align={align}>{row.category || row.kategori}</TableCell>
        case 'price':
          // prefer per pcs if unit is pcs otherwise show per m2
          const price = row.price != null ? row.price : row.harga_per_pcs || row.harga_per_m2
          return <TableCell key={columnKey} align={align}>{price != null && price !== '' ? price : '-'}</TableCell>
        case 'bahan':
          return <TableCell key={columnKey} align={align}>{row.bahan || row.material || '-'}</TableCell>
        case 'finishing':
          return <TableCell key={columnKey} align={align}>{row.finishing || '-'}</TableCell>
        case 'harga_per_m2':
          return <TableCell key={columnKey} align={align}>{row.harga_per_m2 != null ? row.harga_per_m2 : '-'}</TableCell>
        case 'harga_per_pcs':
          return <TableCell key={columnKey} align={align}>{row.harga_per_pcs != null ? row.harga_per_pcs : '-'}</TableCell>
        case 'waktu_proses':
          return <TableCell key={columnKey} align={align}>{row.waktu_proses || '-'}</TableCell>
        
        case 'stock':
          return <TableCell key={columnKey} align={align}>{row.stock != null ? row.stock : row.stok}</TableCell>
        case 'unit':
          return <TableCell key={columnKey} align={align}>{row.unit || row.ukuran_standar || row.satuan}</TableCell>
        case 'description':
          // combine bahan + finishing for product description if available
          const desc = row.description || [row.bahan, row.finishing].filter(Boolean).join(' - ')
          return <TableCell key={columnKey} align={align}>{desc || '-'}</TableCell>
        
        case 'actions':
          return (
            <TableCell key={columnKey} align={align}>
              <Box sx={{ display: 'flex', gap: 0.5 }}>
                {onEdit && (
                  <IconButton 
                    size="small" 
                    onClick={(e) => { 
                      e.stopPropagation() 
                      onEdit(row) 
                    }}
                  >
                    <EditIcon />
                  </IconButton>
                )}
                {onDelete && (
                  <IconButton 
                    size="small" 
                    color="error"
                    onClick={(e) => { 
                      e.stopPropagation() 
                      onDelete(row) 
                    }}
                  >
                    <DeleteIcon />
                  </IconButton>
                )}
              </Box>
            </TableCell>
          )
        default:
          return <TableCell key={columnKey} align={align}>-</TableCell>
      }
    }

    // Generic fallback for other tables
    switch (columnKey) {
      case 'customerPhone':
        return <TableCell key={columnKey} align={align}>{row.customerPhone || row.no_hp || row.Customer?.no_hp || '-'}</TableCell>

      case 'orderId':
        return <TableCell key={columnKey} align={align}>{row.id_order || row.orderId || row.order_id || '-'}</TableCell>

      case 'no_transaksi':
        return <TableCell key={columnKey} align={align}>{row.no_transaksi || row.no_tx || row.transaksi || row.no || '-'}</TableCell>

      case 'customerId':
        return <TableCell key={columnKey} align={align}>{row.customerId || row.Customer?.id_customer || row.id_customer || '-'}</TableCell>

      case 'customerName':
        return <TableCell key={columnKey} align={align}>{row.customerName || row.pelanggan_nama || row.Customer?.nama || '-'}</TableCell>

      case 'amount':
        // piutangs use jumlah_piutang as string sometimes
        return <TableCell key={columnKey} align={align}>{row.amount ?? row.jumlah_piutang ?? '-'}</TableCell>

      case 'dueDate':
        return <TableCell key={columnKey} align={align}>{row.dueDate || row.tanggal_piutang || row.date ? (row.dueDate || row.tanggal_piutang || row.date) : '-'}</TableCell>

      case 'keterangan':
        return <TableCell key={columnKey} align={align}>{row.keterangan || row.description || row.notes || '-'}</TableCell>

      case 'id':
        return <TableCell key={columnKey} align={align}>{row.id}</TableCell>
      
      case 'name':
        return <TableCell key={columnKey} align={align}>{row.name}</TableCell>
      
      case 'email':
        return <TableCell key={columnKey} align={align}>{row.email}</TableCell>
      
      case 'phone':
        return <TableCell key={columnKey} align={align}>{row.phone}</TableCell>

      case 'type':
        return <TableCell key={columnKey} align={align}>{row.type || row.tipe_customer || '-'}</TableCell>

      case 'ordersCount':
        return <TableCell key={columnKey} align={align}>{typeof row.ordersCount === 'number' ? row.ordersCount : (Array.isArray(row.Orders) ? row.Orders.length : '-')}</TableCell>

      case 'batas_piutang':
        return (
          <TableCell key={columnKey} align={align}>
            {row.batas_piutang || row.batasPiutang || row.batas || '-'}
          </TableCell>
        )

      case 'catatan':
        return <TableCell key={columnKey} align={align}>{row.catatan || row.notes || '-'}</TableCell>
      
      case 'status':
        return (
          <TableCell key={columnKey} align={align}>
            <Chip 
              label={row.status || 'Unknown'} 
              size="small" 
              color={row.status === 'active' ? 'success' : 'default'}
            />
          </TableCell>
        )
      
      case 'createdAt':
        return (
          <TableCell key={columnKey} align={align}>
            {row.createdAt ? new Date(row.createdAt).toLocaleDateString() : '-'}
          </TableCell>
        )
      
      case 'actions':
        return (
          <TableCell key={columnKey} align={align}>
            <Box sx={{ display: 'flex', gap: 0.5 }}>
              {onEdit && (
                <IconButton 
                  size="small" 
                  onClick={(e) => { 
                    e.stopPropagation() 
                    onEdit(row) 
                  }}
                >
                  <EditIcon />
                </IconButton>
              )}
              {onDelete && (
                <IconButton 
                  size="small" 
                  color="error"
                  onClick={(e) => { 
                    e.stopPropagation() 
                    onDelete(row) 
                  }}
                >
                  <DeleteIcon />
                </IconButton>
              )}
            </Box>
          </TableCell>
        )
      
      default:
        return <TableCell key={columnKey} align={align}>-</TableCell>
    }
  }

  // Filter dan sort data
  const processedData = useMemo(() => {
    let result = [...data]

    // Apply filters
    if (filters.status) {
      result = result.filter(row => row.status === filters.status)
    }
    if (filters.category) {
      result = result.filter(row => row.category === filters.category)
    }
    // Add more filter logic as needed

    // Apply sorting
    if (sortConfig.key) {
      result.sort((a, b) => {
        const aVal = a[sortConfig.key]
        const bVal = b[sortConfig.key]
        
        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1
        return 0
      })
    }

    return result
  }, [data, filters, sortConfig])

  // Selection handlers
  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedIds(new Set(processedData.map(row => row.id)))
    } else {
      setSelectedIds(new Set())
    }
  }

  const handleSelectRow = (id) => {
    const newSelected = new Set(selectedIds)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedIds(newSelected)
  }

  const allSelected = processedData.length > 0 && selectedIds.size === processedData.length
  const someSelected = selectedIds.size > 0 && selectedIds.size < processedData.length

  if (loading) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography>Loading...</Typography>
      </Box>
    )
  }

  return (
    <Paper>
      <TableContainer
        className="table-responsive"
        sx={{
          /* Responsive max height: prefer available viewport space but clamp between 40vh and 75vh */
          maxHeight: 'clamp(40vh, calc(100vh - var(--header-height) - 160px), 75vh)',
          overflow: 'auto',
          overflowX: 'auto',
          background: 'transparent'
        }}
      >
        <Table
          stickyHeader
          size="small"
          sx={{
            minWidth: 'max-content',
            tableLayout: 'auto',
            // defensive: ensure sticky header styles are applied even if global CSS overrides exist
            '& .MuiTableCell-stickyHeader': {
              position: 'sticky',
              top: 0,
              zIndex: 3,
              backgroundColor: 'background.paper',
            }
          }}
        >
          <TableHead>
            <TableRow>
              {/* Checkbox column */}
              <TableCell padding="checkbox">
                <Checkbox
                  size="small"
                  checked={allSelected}
                  indeterminate={someSelected}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                />
              </TableCell>

              {/* Dynamic columns based on visibility settings */}
              {visibleColumns.map((column) => {
                if (column.sortable) {
                  return (
                    <SortableTableCell 
                      key={column.key} 
                      sortKey={column.key} 
                      align={column.align}
                    >
                      {column.label}
                    </SortableTableCell>
                  )
                } else {
                  return (
                    <TableCell key={column.key} align={column.align}>
                      {column.label}
                    </TableCell>
                  )
                }
              })}

              {/* Settings button in header */}
              <TableCell>
                <TableSettingsButton 
                  tableId={tableId} 
                  variant="icon" 
                  showLabel={false}
                />
              </TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {processedData.length === 0 ? (
              <TableRow>
                <TableCell 
                  colSpan={visibleColumns.length + 2} 
                  sx={{ textAlign: 'center', p: 3 }}
                >
                  <Typography color="textSecondary">
                    Tidak ada data
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              processedData.map((row, index) => (
                <TableRow 
                  key={row.id} 
                  hover 
                  selected={selectedIds.has(row.id)}
                  sx={{ cursor: 'pointer' }}
                >
                  {/* Checkbox */}
                  <TableCell padding="checkbox">
                    <Checkbox 
                      size="small" 
                      checked={selectedIds.has(row.id)} 
                      onChange={() => handleSelectRow(row.id)} 
                    />
                  </TableCell>

                  {/* Dynamic columns */}
                  {visibleColumns.map((column) => 
                    renderTableCell(column.key, row, column.align)
                  )}

                  {/* Empty cell for settings button alignment */}
                  <TableCell />
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Summary info */}
      {selectedIds.size > 0 && (
        <Box sx={{ p: 2, bgcolor: 'action.selected' }}>
          <Typography variant="body2">
            {selectedIds.size} dari {processedData.length} item dipilih
          </Typography>
        </Box>
      )}
    </Paper>
  )
}

export default ExampleTableComponent