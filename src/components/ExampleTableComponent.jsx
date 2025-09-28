import React, { useState, useMemo } from 'react'
import { currency } from '../utils/format'
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
import { List } from 'react-window'
import MoreVertIcon from '@mui/icons-material/MoreVert'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import CloseIcon from '@mui/icons-material/Close'
import { useTableColumns, useTableFilters, useTableSorting } from '../hooks/useTableSettings'
import TableSettingsButton from './TableSettingsButton'

// Contoh implementasi tabel dengan sistem pengaturan global
function ExampleTableComponent({ 
  tableId = 'example',
  data = [],
  loading = false,
  onEdit,
  onDelete,
  onRowClick
  ,
  expandedRowId,
  renderExpandedRow
}) {
  // Gunakan hooks untuk pengaturan global
  const { visibleColumns } = useTableColumns(tableId)
  const { 
    filters
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

  const VIRTUALIZE_THRESHOLD = 300
  const rowHeight = 56

  // Lightweight cell content renderer for virtual rows (avoid TableCell wrappers)
  const renderVirtualCellContent = React.useCallback((columnKey, row) => {
    if (tableId === 'products') {
      switch (columnKey) {
        case 'id': return row.id || row.id_produk
        case 'name': return row.name || row.nama_produk
        case 'category': return row.category || row.kategori
        case 'price': return row.price != null ? row.price : row.harga_per_pcs || row.harga_per_m2 || '-'
        case 'stock': return row.stock != null ? row.stock : row.stok
        case 'unit': return row.unit || row.ukuran_standar || row.satuan
        case 'description': return row.description || [row.bahan, row.finishing].filter(Boolean).join(' - ')
        default: return row[columnKey] ?? '-'
      }
    }

    switch (columnKey) {
      case 'customerPhone': return row.customerPhone || row.no_hp || row.Customer?.no_hp || '-'
      case 'orderId': return row.id_order || row.orderId || row.order_id || '-'
      case 'no_transaksi': return row.no_transaksi || row.no_tx || row.transaksi || row.no || '-'
      case 'customerId': return row.customerId || row.Customer?.id_customer || row.id_customer || '-'
      case 'customerName': return row.customerName || row.pelanggan_nama || row.Customer?.nama || '-'
      case 'amount': return (row.amount != null ? `Rp ${Number(row.amount).toLocaleString('id-ID')}` : (row.jumlah_piutang != null ? `Rp ${Number(row.jumlah_piutang).toLocaleString('id-ID')}` : '-'))
      case 'paid': return row.paid != null ? `Rp ${Number(row.paid).toLocaleString('id-ID')}` : '-'
      case 'sisa': return row.sisa != null ? `Rp ${Number(row.sisa).toLocaleString('id-ID')}` : '-'
      case 'totalPiutangOrder': return row.totalPiutangOrder != null ? `Rp ${Number(row.totalPiutangOrder).toLocaleString('id-ID')}` : '-'
      case 'orderNo': return row.orderNo || row.Order?.no_transaksi || '-'
      case 'orderTotal': return row.orderTotal != null ? `Rp ${Number(row.orderTotal).toLocaleString('id-ID')}` : (row.Order?.total_bayar != null ? `Rp ${Number(row.Order.total_bayar).toLocaleString('id-ID')}` : '-')
      case 'dueDate': return row.dueDate || row.tanggal_piutang || row.date || '-'
      case 'keterangan': return row.keterangan || row.description || row.notes || '-'
      case 'id': return row.id
      case 'name': return row.name
      case 'email': return row.email
      case 'phone': return row.phone
      case 'type': return row.type || row.tipe_customer || '-'
      case 'ordersCount': return typeof row.ordersCount === 'number' ? row.ordersCount : (Array.isArray(row.Orders) ? row.Orders.length : '-')
      case 'batas_piutang': return row.batas_piutang || row.batasPiutang || row.batas || '-'
      case 'catatan': return row.catatan || row.notes || '-'
      case 'status': return row.status || '-'
      case 'createdAt': return row.createdAt ? new Date(row.createdAt).toLocaleDateString() : '-'
      case 'actions': return null // actions will be rendered separately in virtual row
      default: return row[columnKey] ?? '-'
    }
  }, [tableId])

  const VirtualRow = React.useCallback(({ index, style, data }) => {
    const row = data && data[index]
    const key = row?.id ?? index
    return (
      <div key={key} onClick={() => onRowClick && onRowClick(row)} style={{ ...style, display: 'flex', width: '100%', boxSizing: 'border-box', alignItems: 'center', cursor: 'pointer' }}>
        {/* Checkbox column */}
        <div style={{ flex: '0 0 48px', padding: '12px' }}>
          <Checkbox size="small" onClick={(e) => e.stopPropagation()} />
        </div>
        {visibleColumns.map((column) => (
          <div key={`${key}-${column.key}`} style={{ flex: column.width ? `0 0 ${column.width}` : 1, padding: '12px 16px', display: 'flex', alignItems: 'center' }}>
            {column.key === 'actions' ? (
              <Box sx={{ display: 'flex', gap: 0.5 }}>
                {onEdit && (
                  <IconButton size="small" onClick={(e) => { e.stopPropagation(); onEdit(row) }}><EditIcon /></IconButton>
                )}
                {onDelete && (
                  <IconButton size="small" color="error" onClick={(e) => { e.stopPropagation(); onDelete(row) }}><DeleteIcon /></IconButton>
                )}
              </Box>
            ) : (
              renderVirtualCellContent(column.key, row)
            )}
          </div>
        ))}
        {/* Settings button placeholder column width */}
        <div style={{ flex: '0 0 72px', padding: '12px' }} />
      </div>
    )
  }, [visibleColumns, onEdit, onDelete, onRowClick, renderVirtualCellContent])

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
        case 'price': {
          // prefer per pcs if unit is pcs otherwise show per m2
          const price = row.price != null ? row.price : row.harga_per_pcs || row.harga_per_m2
          return <TableCell key={columnKey} align={align}>{price != null && price !== '' ? price : '-'}</TableCell>
        }
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
        case 'description': {
          // combine bahan + finishing for product description if available
          const desc = row.description || [row.bahan, row.finishing].filter(Boolean).join(' - ')
          return <TableCell key={columnKey} align={align}>{desc || '-'}</TableCell>
        }
        
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

      case 'orderNo':
        return <TableCell key={columnKey} align={align}>{row.orderNo || row.Order?.no_transaksi || '-'}</TableCell>

      case 'orderTotal': {
        const val = row.orderTotal != null ? row.orderTotal : (row.Order?.total_bayar != null ? Number(row.Order.total_bayar) : null)
        return <TableCell key={columnKey} align={align}>{val != null ? `Rp ${Number(val).toLocaleString('id-ID')}` : '-'}</TableCell>
      }

      case 'customerId':
        return <TableCell key={columnKey} align={align}>{row.customerId || row.Customer?.id_customer || row.id_customer || '-'}</TableCell>

      case 'customerName':
        return <TableCell key={columnKey} align={align}>{row.customerName || row.pelanggan_nama || row.Customer?.nama || '-'}</TableCell>

      case 'amount': {
        // piutangs use jumlah_piutang as string sometimes — format as Rupiah
        const amtVal = row.amount ?? row.jumlah_piutang ?? null
        return <TableCell key={columnKey} align={align}>{amtVal != null ? currency(amtVal) : '-'}</TableCell>
      }

      case 'paid': {
        const paidVal = row.paid ?? null
        return <TableCell key={columnKey} align={align}>{paidVal != null ? currency(paidVal) : '-'}</TableCell>
      }

      case 'sisa': {
        const sisaVal = row.sisa ?? ((row.amount != null ? Number(row.amount) : 0) - (row.paid != null ? Number(row.paid) : 0))
        return <TableCell key={columnKey} align={align}>{sisaVal != null ? currency(sisaVal) : '-'}</TableCell>
      }

      case 'totalPiutangOrder': {
        const totalVal = row.totalPiutangOrder ?? row.orderTotal ?? null
        return <TableCell key={columnKey} align={align}>{totalVal != null ? currency(totalVal) : '-'}</TableCell>
      }

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
    <TableContainer component={Paper} className="table-responsive" sx={{ maxHeight: 'clamp(40vh, calc(100vh - var(--header-height) - 160px), 75vh)', overflow: 'auto' }}>
      <Table
        stickyHeader
        size="small"
        sx={{
          minWidth: 'max-content',
          tableLayout: 'auto',
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

        {/* Body: empty state, virtualized list, or normal rendering */}
        {processedData.length === 0 ? (
          <TableBody>
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
          </TableBody>
        ) : processedData.length >= VIRTUALIZE_THRESHOLD ? (
          <TableBody>
            <tr>
              <td colSpan={visibleColumns.length + 2} style={{ padding: 0 }}>
                <div style={{ width: '100%', height: Math.min(600, processedData.length * rowHeight) }}>
                  <List
                    height={Math.min(600, processedData.length * rowHeight)}
                    itemCount={processedData.length}
                    itemSize={rowHeight}
                    width={'100%'}
                    itemData={processedData}
                  >
                    {VirtualRow}
                  </List>
                </div>
              </td>
            </tr>
          </TableBody>
        ) : (
          <TableBody>
            {processedData.map((row) => (
              <React.Fragment key={row.id}>
              <TableRow 
                key={`r-${row.id}`} 
                hover 
                selected={selectedIds.has(row.id)}
                onClick={() => onRowClick && onRowClick(row)}
                sx={{ cursor: onRowClick ? 'pointer' : 'default' }}
              >
                {/* Checkbox */}
                <TableCell padding="checkbox">
                  <Checkbox 
                    size="small" 
                    checked={selectedIds.has(row.id)} 
                    onChange={(e) => { e.stopPropagation(); handleSelectRow(row.id) }} 
                    onClick={(e) => e.stopPropagation()}
                  />
                </TableCell>

                {/* Dynamic columns */}
                {visibleColumns.map((column) => 
                  renderTableCell(column.key, row, column.align)
                )}

                {/* Empty cell for settings button alignment */}
                <TableCell />
              </TableRow>
              {expandedRowId === row.id && (
                <TableRow>
                  <TableCell colSpan={visibleColumns.length + 2} sx={{ backgroundColor: 'background.paper' }}>
                    {renderExpandedRow ? renderExpandedRow(row) : null}
                  </TableCell>
                </TableRow>
              )}
              </React.Fragment>
            ))}
          </TableBody>
        )}
      </Table>
    </TableContainer>
  )
}

export default ExampleTableComponent