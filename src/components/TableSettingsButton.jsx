import React, { useState } from 'react'
import {
  Button,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  FormControlLabel,
  Switch,
  Box,
  Typography,
  Alert,
  Stack,
  Card,
  CardContent
} from '@mui/material'
import {
  Settings as SettingsIcon,
  ViewColumn as ViewColumnIcon,
  Sort as SortIcon,
  FilterList as FilterIcon,
  RestartAlt as ResetIcon,
  SaveAlt as SaveIcon,
  CloudUpload as ImportIcon,
  CloudDownload as ExportIcon,
  ContentCopy as CopyIcon,
  TableRows as TableRowsIcon
} from '@mui/icons-material'
import { useTableSettings } from '../store/tableSettingsStore'
import ColumnSettingsDialog from './ColumnSettingsDialog'
import useTableSettingsStore from '../store/tableSettingsStore'

const TableSettingsButton = ({ 
  tableId, 
  variant = 'icon', // 'icon', 'button', 'menuItem'
  showLabel = true,
  onSettingsChange
}) => {
  const [anchorEl, setAnchorEl] = useState(null)
  const [columnDialogOpen, setColumnDialogOpen] = useState(false)
  const [preferencesDialogOpen, setPreferencesDialogOpen] = useState(false)
  const [exportDialogOpen, setExportDialogOpen] = useState(false)
  const [importDialogOpen, setImportDialogOpen] = useState(false)
  const [copyDialogOpen, setCopyDialogOpen] = useState(false)
  
  const tableStore = useTableSettingsStore()
  const { settings, resetSettings, updateLayout, updatePreferences } = useTableSettings(tableId)
  
  const handleClick = (event) => {
    setAnchorEl(event.currentTarget)
  }

  const handleClose = () => {
    setAnchorEl(null)
  }

  const handleMenuAction = (action) => {
    handleClose()
    
    switch (action) {
      case 'columns':
        setColumnDialogOpen(true)
        break
      case 'preferences':
        setPreferencesDialogOpen(true)
        break
      case 'reset':
        handleReset()
        break
      case 'export':
        setExportDialogOpen(true)
        break
      case 'import':
        setImportDialogOpen(true)
        break
      case 'copy':
        setCopyDialogOpen(true)
        break
    }
  }

  const handleReset = () => {
    resetSettings()
    if (onSettingsChange) {
      onSettingsChange('reset')
    }
    
    // Show notification
    if (typeof window !== 'undefined' && window.dispatchEvent) {
      window.dispatchEvent(new CustomEvent('show-notification', { 
        detail: { message: 'Pengaturan tabel direset ke default', type: 'info' } 
      }))
    }
  }

  const handleExport = () => {
    const exportData = {
      tableId,
      settings,
      exportedAt: new Date().toISOString(),
      version: '1.0'
    }
    
    const dataStr = JSON.stringify(exportData, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    
    const link = document.createElement('a')
    link.href = URL.createObjectURL(dataBlob)
    link.download = `table-settings-${tableId}-${Date.now()}.json`
    link.click()
    
    setExportDialogOpen(false)
    
    // Show notification
    if (typeof window !== 'undefined' && window.dispatchEvent) {
      window.dispatchEvent(new CustomEvent('show-notification', { 
        detail: { message: 'Pengaturan berhasil diekspor', type: 'success' } 
      }))
    }
  }

  const handleImport = (event) => {
    const file = event.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const importData = JSON.parse(e.target.result)
          if (importData.settings) {
            tableStore.importTableSettings(tableId, importData.settings)
            if (onSettingsChange) {
              onSettingsChange('import')
            }
            
            // Show notification
            if (typeof window !== 'undefined' && window.dispatchEvent) {
              window.dispatchEvent(new CustomEvent('show-notification', { 
                detail: { message: 'Pengaturan berhasil diimpor', type: 'success' } 
              }))
            }
          } else {
            throw new Error('Invalid file format')
          }
        } catch {
          // Show error notification
          if (typeof window !== 'undefined' && window.dispatchEvent) {
            window.dispatchEvent(new CustomEvent('show-notification', { 
              detail: { message: 'File tidak valid atau rusak', type: 'error' } 
            }))
          }
        }
      }
      reader.readAsText(file)
    }
    setImportDialogOpen(false)
  }

  const renderButton = () => {
    if (variant === 'icon') {
      return (
        <Tooltip title="Pengaturan Tabel">
          <IconButton onClick={handleClick} size="small">
            <SettingsIcon />
          </IconButton>
        </Tooltip>
      )
    } else if (variant === 'button') {
      return (
        <Button
          onClick={handleClick}
          startIcon={<SettingsIcon />}
          variant="outlined"
          size="small"
        >
          {showLabel && 'Pengaturan'}
        </Button>
      )
    } else {
      return (
        <MenuItem onClick={handleClick}>
          <ListItemIcon>
            <SettingsIcon />
          </ListItemIcon>
          <ListItemText primary="Pengaturan Tabel" />
        </MenuItem>
      )
    }
  }

  return (
    <>
      {renderButton()}

      {/* Settings Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <MenuItem onClick={() => handleMenuAction('columns')}>
          <ListItemIcon>
            <ViewColumnIcon />
          </ListItemIcon>
          <ListItemText primary="Pengaturan Kolom" />
        </MenuItem>
        
        <MenuItem onClick={() => handleMenuAction('preferences')}>
          <ListItemIcon>
            <TableRowsIcon />
          </ListItemIcon>
          <ListItemText primary="Preferensi Layout" />
        </MenuItem>
        
        <Divider />
        
        <MenuItem onClick={() => handleMenuAction('export')}>
          <ListItemIcon>
            <ExportIcon />
          </ListItemIcon>
          <ListItemText primary="Ekspor Pengaturan" />
        </MenuItem>
        
        <MenuItem onClick={() => handleMenuAction('import')}>
          <ListItemIcon>
            <ImportIcon />
          </ListItemIcon>
          <ListItemText primary="Impor Pengaturan" />
        </MenuItem>
        
        <MenuItem onClick={() => handleMenuAction('copy')}>
          <ListItemIcon>
            <CopyIcon />
          </ListItemIcon>
          <ListItemText primary="Salin ke Tabel Lain" />
        </MenuItem>
        
        <Divider />
        
        <MenuItem onClick={() => handleMenuAction('reset')}>
          <ListItemIcon>
            <ResetIcon />
          </ListItemIcon>
          <ListItemText primary="Reset ke Default" />
        </MenuItem>
      </Menu>

      {/* Column Settings Dialog */}
      <ColumnSettingsDialog
        open={columnDialogOpen}
        onClose={() => setColumnDialogOpen(false)}
        tableId={tableId}
      />

      {/* Preferences Dialog */}
      <PreferencesDialog
        open={preferencesDialogOpen}
        onClose={() => setPreferencesDialogOpen(false)}
        tableId={tableId}
        settings={settings}
        onUpdate={(updates) => {
          if (updates.layout) updateLayout(updates.layout)
          if (updates.preferences) updatePreferences(updates.preferences)
          if (onSettingsChange) onSettingsChange('preferences')
        }}
      />

      {/* Export Dialog */}
      <Dialog open={exportDialogOpen} onClose={() => setExportDialogOpen(false)}>
        <DialogTitle>Ekspor Pengaturan Tabel</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="textSecondary" paragraph>
            Pengaturan tabel akan diekspor sebagai file JSON yang dapat dibagikan atau diimpor ke tabel lain.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setExportDialogOpen(false)}>Batal</Button>
          <Button onClick={handleExport} variant="contained">Ekspor</Button>
        </DialogActions>
      </Dialog>

      {/* Import Dialog */}
      <Dialog open={importDialogOpen} onClose={() => setImportDialogOpen(false)}>
        <DialogTitle>Impor Pengaturan Tabel</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="textSecondary" paragraph>
            Pilih file JSON yang berisi pengaturan tabel untuk diimpor.
          </Typography>
          <input
            type="file"
            accept=".json"
            onChange={handleImport}
            style={{ width: '100%', padding: '10px' }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setImportDialogOpen(false)}>Batal</Button>
        </DialogActions>
      </Dialog>

      {/* Copy Settings Dialog */}
      <CopySettingsDialog
        open={copyDialogOpen}
        onClose={() => setCopyDialogOpen(false)}
        sourceTableId={tableId}
        onCopy={(targetTableId) => {
          tableStore.copyTableSettings(tableId, targetTableId)
          if (onSettingsChange) onSettingsChange('copy')
          
          // Show notification
          if (typeof window !== 'undefined' && window.dispatchEvent) {
            window.dispatchEvent(new CustomEvent('show-notification', { 
              detail: { message: `Pengaturan berhasil disalin ke ${targetTableId}`, type: 'success' } 
            }))
          }
        }}
      />
    </>
  )
}

// Preferences Dialog Component
const PreferencesDialog = ({ open, onClose, settings, onUpdate }) => {
  const [layout, setLayout] = useState(settings.layout || {})
  const [preferences, setPreferences] = useState(settings.preferences || {})

  const handleLayoutChange = (key, value) => {
    const newLayout = { ...layout, [key]: value }
    setLayout(newLayout)
  }

  const handlePreferencesChange = (key, value) => {
    const newPreferences = { ...preferences, [key]: value }
    setPreferences(newPreferences)
  }

  const handleSave = () => {
    onUpdate({ layout, preferences })
    onClose()
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Preferensi Layout Tabel</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={3}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="subtitle2" gutterBottom>
                Layout Tabel
              </Typography>
              
              <FormControl fullWidth margin="normal">
                <InputLabel>Kepadatan Baris</InputLabel>
                <Select
                  value={layout.density || 'standard'}
                  onChange={(e) => handleLayoutChange('density', e.target.value)}
                  label="Kepadatan Baris"
                >
                  <MenuItem value="compact">Kompak</MenuItem>
                  <MenuItem value="standard">Standar</MenuItem>
                  <MenuItem value="comfortable">Luas</MenuItem>
                </Select>
              </FormControl>

              <TextField
                fullWidth
                margin="normal"
                label="Baris per Halaman"
                type="number"
                value={layout.rowsPerPage || 25}
                onChange={(e) => handleLayoutChange('rowsPerPage', parseInt(e.target.value))}
                inputProps={{ min: 5, max: 100 }}
              />

              <FormControlLabel
                control={
                  <Switch
                    checked={layout.stickyHeader || false}
                    onChange={(e) => handleLayoutChange('stickyHeader', e.target.checked)}
                  />
                }
                label="Header Tabel Tetap"
              />

              <FormControlLabel
                control={
                  <Switch
                    checked={layout.showActions !== false}
                    onChange={(e) => handleLayoutChange('showActions', e.target.checked)}
                  />
                }
                label="Tampilkan Kolom Aksi"
              />
            </CardContent>
          </Card>

          <Card variant="outlined">
            <CardContent>
              <Typography variant="subtitle2" gutterBottom>
                Preferensi Umum
              </Typography>
              
              <FormControlLabel
                control={
                  <Switch
                    checked={preferences.autoRefresh || false}
                    onChange={(e) => handlePreferencesChange('autoRefresh', e.target.checked)}
                  />
                }
                label="Auto Refresh"
              />

              {preferences.autoRefresh && (
                <TextField
                  fullWidth
                  margin="normal"
                  label="Interval Refresh (detik)"
                  type="number"
                  value={Math.floor((preferences.refreshInterval || 30000) / 1000)}
                  onChange={(e) => handlePreferencesChange('refreshInterval', parseInt(e.target.value) * 1000)}
                  inputProps={{ min: 10, max: 300 }}
                />
              )}

              <FormControlLabel
                control={
                  <Switch
                    checked={preferences.confirmDelete !== false}
                    onChange={(e) => handlePreferencesChange('confirmDelete', e.target.checked)}
                  />
                }
                label="Konfirmasi Hapus"
              />

              <FormControlLabel
                control={
                  <Switch
                    checked={preferences.showNotifications !== false}
                    onChange={(e) => handlePreferencesChange('showNotifications', e.target.checked)}
                  />
                }
                label="Tampilkan Notifikasi"
              />
            </CardContent>
          </Card>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Batal</Button>
        <Button onClick={handleSave} variant="contained">Simpan</Button>
      </DialogActions>
    </Dialog>
  )
}

// Copy Settings Dialog Component
const CopySettingsDialog = ({ open, onClose, sourceTableId, onCopy }) => {
  const [targetTableId, setTargetTableId] = useState('')
  
  const availableTableIds = ['orders', 'customers', 'products', 'payments', 'piutangs']
    .filter(id => id !== sourceTableId)

  const handleCopy = () => {
    if (targetTableId && onCopy) {
      onCopy(targetTableId)
      onClose()
      setTargetTableId('')
    }
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Salin Pengaturan ke Tabel Lain</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="textSecondary" paragraph>
          Salin pengaturan dari tabel <strong>{sourceTableId}</strong> ke tabel lain.
        </Typography>
        
        <FormControl fullWidth margin="normal">
          <InputLabel>Tabel Tujuan</InputLabel>
          <Select
            value={targetTableId}
            onChange={(e) => setTargetTableId(e.target.value)}
            label="Tabel Tujuan"
          >
            {availableTableIds.map(id => (
              <MenuItem key={id} value={id}>
                {id.charAt(0).toUpperCase() + id.slice(1)}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Batal</Button>
        <Button onClick={handleCopy} variant="contained" disabled={!targetTableId}>
          Salin
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default TableSettingsButton