# Sistem Pengaturan Tabel Global

Sistem ini memungkinkan Anda untuk menyimpan dan mengelola pengaturan tabel secara global yang dapat digunakan di berbagai halaman dan tabel dalam aplikasi.

## Fitur Utama

### 1. **Penyimpanan Pengaturan Global**
- Sorting configuration (pengaturan urutan kolom)
- Filter configuration (pengaturan filter)
- Column visibility (visibilitas kolom)
- Layout preferences (preferensi tampilan)
- User preferences (preferensi pengguna)

### 2. **Persistensi Data**
- Pengaturan disimpan secara otomatis ke localStorage
- Data tetap tersimpan meskipun browser ditutup
- Setiap tabel memiliki pengaturan terpisah berdasarkan tableId

### 3. **Sharing dan Export/Import**
- Export pengaturan sebagai file JSON
- Import pengaturan dari file JSON
- Salin pengaturan antar tabel
- Buat dan simpan preset pengaturan

## Cara Penggunaan

### 1. **Menggunakan Hook useTableSettings**

```jsx
import { useTableSettings } from '../hooks/useTableSettings'

function MyTableComponent() {
  const tableId = 'orders' // unique identifier untuk tabel
  const { 
    settings, 
    updateSettings, 
    resetSettings,
    sortConfig,
    filters,
    columnVisibility,
    layout,
    preferences
  } = useTableSettings(tableId)
  
  // Gunakan settings untuk konfigurasi tabel Anda
}
```

### 2. **Menggunakan Hook untuk Kolom**

```jsx
import { useTableColumns } from '../hooks/useTableSettings'

function MyTableComponent() {
  const tableId = 'orders'
  const {
    columnConfig,
    columnVisibility,
    visibleColumns,
    hiddenColumns,
    toggleColumn,
    showColumn,
    hideColumn,
    resetColumnVisibility
  } = useTableColumns(tableId)
  
  // Render hanya kolom yang visible
  return (
    <TableHead>
      <TableRow>
        {visibleColumns.map(column => (
          <TableCell key={column.key}>
            {column.label}
          </TableCell>
        ))}
      </TableRow>
    </TableHead>
  )
}
```

### 3. **Menggunakan Hook untuk Filters**

```jsx
import { useTableFilters } from '../hooks/useTableSettings'

function MyTableComponent() {
  const tableId = 'orders'
  const defaultFilters = {
    status: '',
    date_from: '',
    date_to: ''
  }
  
  const {
    filters,
    setFilter,
    setFilters,
    clearFilter,
    clearAllFilters,
    resetFilters
  } = useTableFilters(tableId, defaultFilters)
  
  // Gunakan filters untuk memfilter data
}
```

### 4. **Menggunakan Hook untuk Sorting**

```jsx
import { useTableSorting } from '../hooks/useTableSettings'

function MyTableComponent() {
  const tableId = 'orders'
  const {
    sortConfig,
    handleSort,
    resetSort,
    isSorted,
    getSortDirection
  } = useTableSorting(tableId)
  
  // Gunakan untuk sorting tabel
  return (
    <TableSortLabel
      active={isSorted('columnKey')}
      direction={getSortDirection('columnKey')}
      onClick={() => handleSort('columnKey')}
    >
      Column Name
    </TableSortLabel>
  )
}
```

### 5. **Menambahkan Tombol Pengaturan**

```jsx
import TableSettingsButton from '../components/TableSettingsButton'

function MyPage() {
  return (
    <Box>
      {/* Toolbar dengan tombol pengaturan */}
      <Box sx={{ display: 'flex', gap: 1 }}>
        <TableSettingsButton 
          tableId="orders" 
          variant="button" 
          showLabel={true}
          onSettingsChange={(action) => {
            console.log('Settings changed:', action)
            // Refresh tabel jika diperlukan
          }}
        />
        {/* Tombol lainnya */}
      </Box>
      
      {/* Tabel Anda */}
      <MyTableComponent />
    </Box>
  )
}
```

### 6. **Menambahkan Dialog Pengaturan Kolom**

```jsx
import ColumnSettingsDialog from '../components/ColumnSettingsDialog'

function MyTableComponent() {
  const [dialogOpen, setDialogOpen] = useState(false)
  
  return (
    <>
      <Button onClick={() => setDialogOpen(true)}>
        Pengaturan Kolom
      </Button>
      
      <ColumnSettingsDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        tableId="orders"
        title="Pengaturan Kolom Tabel Orders"
      />
    </>
  )
}
```

## Konfigurasi Kolom Tabel

Untuk menambahkan tabel baru, edit file `src/hooks/useTableSettings.js` dan tambahkan konfigurasi di `TABLE_COLUMN_CONFIGS`:

```javascript
export const TABLE_COLUMN_CONFIGS = {
  // ... konfigurasi existing
  
  // Konfigurasi tabel baru
  myNewTable: [
    { 
      key: 'id', 
      label: 'ID', 
      sortable: true, 
      defaultVisible: true, 
      align: 'left' 
    },
    { 
      key: 'name', 
      label: 'Nama', 
      sortable: true, 
      defaultVisible: true, 
      align: 'left' 
    },
    // ... kolom lainnya
  ]
}
```

## Struktur Data Pengaturan

```javascript
const tableSettings = {
  sortConfig: {
    key: 'columnKey', // null untuk no sorting
    direction: 'asc' // 'asc' atau 'desc'
  },
  filters: {
    status: 'active',
    date_from: '2024-01-01',
    // ... filter lainnya
  },
  columnVisibility: {
    id: true,
    name: true,
    email: false,
    // ... visibilitas kolom lainnya
  },
  layout: {
    density: 'standard', // 'compact', 'standard', 'comfortable'
    rowsPerPage: 25,
    expandedRows: false,
    showActions: true,
    stickyHeader: false
  },
  preferences: {
    autoRefresh: false,
    refreshInterval: 30000, // ms
    showNotifications: true,
    confirmDelete: true
  }
}
```

## Contoh Implementasi Lengkap

Lihat implementasi di:
- `src/pages/Orders.jsx` - Contoh penggunaan di halaman
- `src/components/ContentOrders.jsx` - Contoh implementasi tabel dengan pengaturan global
- `src/components/TableSettingsButton.jsx` - Tombol pengaturan
- `src/components/ColumnSettingsDialog.jsx` - Dialog pengaturan kolom

## Tips Penggunaan

1. **Table ID**: Gunakan nama yang unik dan deskriptif untuk tableId (contoh: 'orders', 'customers', 'products')

2. **Column Keys**: Pastikan column key sesuai dengan field data Anda

3. **Default Values**: Selalu berikan nilai default untuk filters dan settings

4. **Performance**: Gunakan React.useMemo untuk data yang expensive seperti filtered/sorted rows

5. **Preset**: Manfaatkan fitur preset untuk pengaturan yang sering digunakan

6. **Export/Import**: Gunakan fitur export untuk backup atau sharing pengaturan antar user

## API Reference

### Store: `useTableSettingsStore`

- `getTableSettings(tableId)` - Mendapatkan pengaturan tabel
- `updateTableSettings(tableId, settings)` - Update pengaturan tabel
- `resetTableSettings(tableId)` - Reset ke pengaturan default
- `copyTableSettings(fromId, toId)` - Salin pengaturan antar tabel
- `exportTableSettings(tableId)` - Export pengaturan sebagai JSON
- `importTableSettings(tableId, settings)` - Import pengaturan dari JSON

### Hooks

- `useTableSettings(tableId)` - Hook utama untuk semua pengaturan
- `useTableColumns(tableId)` - Hook khusus untuk kolom
- `useTableFilters(tableId, defaultFilters)` - Hook khusus untuk filters
- `useTableSorting(tableId, defaultSort)` - Hook khusus untuk sorting

### Components

- `<TableSettingsButton />` - Tombol pengaturan dengan menu lengkap
- `<ColumnSettingsDialog />` - Dialog untuk pengaturan visibilitas kolom

Sistem ini memberikan fleksibilitas penuh untuk mengelola pengaturan tabel dan dapat dengan mudah diadaptasi untuk kebutuhan spesifik aplikasi Anda.