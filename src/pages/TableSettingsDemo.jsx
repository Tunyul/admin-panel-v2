import React, { useState } from 'react'
import { 
  Box, 
  Typography, 
  Button, 
  Card, 
  CardContent, 
  Alert,
  Divider,
  Stack
} from '@mui/material'
import { 
  Settings as SettingsIcon,
  TableChart as TableIcon,
  Download as DownloadIcon,
  Upload as UploadIcon,
  ContentCopy as CopyIcon
} from '@mui/icons-material'
import ExampleTableComponent from '../components/ExampleTableComponent'
import TableSettingsButton from '../components/TableSettingsButton'

// Sample data untuk demo
const sampleData = [
  { id: 1, name: 'John Doe', email: 'john@example.com', phone: '081234567890', status: 'active', category: 'premium', createdAt: '2024-01-15' },
  { id: 2, name: 'Jane Smith', email: 'jane@example.com', phone: '081234567891', status: 'inactive', category: 'basic', createdAt: '2024-01-16' },
  { id: 3, name: 'Bob Johnson', email: 'bob@example.com', phone: '081234567892', status: 'active', category: 'premium', createdAt: '2024-01-17' },
  { id: 4, name: 'Alice Brown', email: 'alice@example.com', phone: '081234567893', status: 'active', category: 'basic', createdAt: '2024-01-18' },
  { id: 5, name: 'Charlie Wilson', email: 'charlie@example.com', phone: '081234567894', status: 'inactive', category: 'premium', createdAt: '2024-01-19' },
]

function TableSettingsDemo() {
  const [loading, setLoading] = useState(false)

  const handleEdit = (row) => {
    console.log('Edit:', row)
    alert(`Edit: ${row.name}`)
  }

  const handleDelete = (row) => {
    console.log('Delete:', row)
    if (confirm(`Hapus ${row.name}?`)) {
      alert(`${row.name} dihapus`)
    }
  }

  const simulateRefresh = () => {
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      alert('Data refreshed!')
    }, 2000)
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Demo Sistem Pengaturan Tabel Global
        </Typography>
        <Typography variant="body1" color="textSecondary">
          Demo ini menunjukkan fitur-fitur sistem pengaturan tabel yang dapat digunakan secara global di seluruh aplikasi.
        </Typography>
      </Box>

      {/* Features Overview */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Fitur yang Tersedia
          </Typography>
          <Stack spacing={2}>
            <Alert severity="info" icon={<TableIcon />}>
              <strong>Column Visibility:</strong> Show/hide kolom tabel dan simpan preferensi
            </Alert>
            <Alert severity="info" icon={<SettingsIcon />}>
              <strong>Table Settings:</strong> Atur sorting, filter, layout, dan preferensi umum
            </Alert>
            <Alert severity="info" icon={<DownloadIcon />}>
              <strong>Export/Import:</strong> Ekspor pengaturan ke file JSON atau impor dari file
            </Alert>
            <Alert severity="info" icon={<CopyIcon />}>
              <strong>Copy Settings:</strong> Salin pengaturan antar tabel yang berbeda
            </Alert>
          </Stack>
        </CardContent>
      </Card>

      {/* Controls */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Kontrol Demo
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <TableSettingsButton 
              tableId="demo-table" 
              variant="button" 
              showLabel={true}
              onSettingsChange={(action) => {
                console.log('Demo settings changed:', action)
                alert(`Settings ${action} berhasil!`)
              }}
            />
            <Button 
              variant="outlined" 
              onClick={simulateRefresh}
              disabled={loading}
            >
              {loading ? 'Refreshing...' : 'Refresh Data'}
            </Button>
          </Box>
        </CardContent>
      </Card>

      <Divider sx={{ mb: 4 }} />

      {/* Instructions */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Cara Mencoba
          </Typography>
          <Stack spacing={1}>
            <Typography variant="body2">
              1. <strong>Klik tombol "Pengaturan"</strong> untuk membuka menu pengaturan tabel
            </Typography>
            <Typography variant="body2">
              2. <strong>Pilih "Pengaturan Kolom"</strong> untuk show/hide kolom
            </Typography>
            <Typography variant="body2">
              3. <strong>Coba sort kolom</strong> dengan klik header kolom
            </Typography>
            <Typography variant="body2">
              4. <strong>Export pengaturan</strong> untuk backup atau sharing
            </Typography>
            <Typography variant="body2">
              5. <strong>Reset pengaturan</strong> untuk kembali ke default
            </Typography>
            <Typography variant="body2">
              6. Refresh halaman dan lihat pengaturan tetap tersimpan!
            </Typography>
          </Stack>
        </CardContent>
      </Card>

      {/* Demo Table */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Demo Tabel
          </Typography>
          <ExampleTableComponent
            tableId="demo-table"
            data={sampleData}
            loading={loading}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        </CardContent>
      </Card>

      {/* Code Example */}
      <Card sx={{ mt: 4 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Contoh Kode
          </Typography>
          <Box 
            component="pre" 
            sx={{ 
              bgcolor: 'grey.100', 
              p: 2, 
              borderRadius: 1, 
              overflow: 'auto',
              fontSize: '0.875rem'
            }}
          >
{`// Implementasi dasar
import { useTableColumns, useTableSorting } from '../hooks/useTableSettings'

function MyTable() {
  const { visibleColumns } = useTableColumns('my-table')
  const { sortConfig, handleSort } = useTableSorting('my-table')
  
  return (
    <Table>
      <TableHead>
        {visibleColumns.map(col => (
          <TableCell key={col.key} onClick={() => handleSort(col.key)}>
            {col.label}
          </TableCell>
        ))}
      </TableHead>
      {/* ... */}
    </Table>
  )
}`}
          </Box>
        </CardContent>
      </Card>
    </Box>
  )
}

export default TableSettingsDemo