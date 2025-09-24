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
    switch (columnKey) {
      case 'id':
        return <TableCell key={columnKey} align={align}>{row.id}</TableCell>
      
      case 'name':
        return <TableCell key={columnKey} align={align}>{row.name}</TableCell>
      
      case 'email':
        return <TableCell key={columnKey} align={align}>{row.email}</TableCell>
      
      case 'phone':
        return <TableCell key={columnKey} align={align}>{row.phone}</TableCell>
      
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
      <TableContainer sx={{ maxHeight: 600 }}>
        <Table stickyHeader size="small">
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