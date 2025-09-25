import React from 'react'
import {
  TableRow,
  TableCell,
  Checkbox,
  IconButton,
  Collapse,
  Box,
  Table,
  TableHead,
  TableBody,
  Typography,
} from '@mui/material'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import MoreVertIcon from '@mui/icons-material/MoreVert'

// A memoized row component. It expects several helper functions and data passed as props.
function OrderRowComponent(props) {
  const {
    row,
    idx,
    selected,
    toggle,
    visibleColumns,
    columnVisibility,
  customerCache,
  waIcon,
  formatRupiah,
  computeSisaBayar: _computeSisaBayar,
  getStatusChipClass: _getStatusChipClass,
  statusColor: _statusColor,
    handleOpenEdit,
    handleDelete,
    openRowMenu,
    expandedIds,
  } = props

  return (
    <>
      <TableRow hover selected={selected.has(row.id)} onClick={(e) => { if (props.handleRowClick) props.handleRowClick(e, row.id) }} sx={{ cursor: 'pointer' }}>
        <TableCell padding="checkbox">
          <Checkbox size="small" checked={selected.has(row.id)} onChange={() => toggle(row.id)} />
        </TableCell>
        <TableCell>{idx + 1}</TableCell>
        {/* Dynamic columns: we'll render the visibleColumns via a simple map but keep common columns outside */}
        {visibleColumns.map((column) => {
          return (
            <React.Fragment key={`cell-${row.id}-${column.key}`}>
              {props.renderTableCell ? (
                props.renderTableCell(column.key, row, column.align)
              ) : (
                <TableCell align={column.align}>{row[column.key] ?? ''}</TableCell>
              )}
            </React.Fragment>
          )
        })}

        {/* Additional always-visible columns (customerPhone/name, invoice/drive, items, actions) */}
        {columnVisibility.customerName !== false && (
          <TableCell>
            {(customerCache.get(row.idCustomer) && (customerCache.get(row.idCustomer).nama || customerCache.get(row.idCustomer).nama_customer || customerCache.get(row.idCustomer).name)) || ''}
          </TableCell>
        )}
        {columnVisibility.customerPhone !== false && (
          <TableCell>
            {(() => {
              const c = customerCache.get(row.idCustomer)
              const nohp = c?.no_hp || c?.noHp || ''
              if (!nohp) return ''
              const waUrl = `https://wa.me/${nohp}?text=${encodeURIComponent('Hai')}`
              return (
                <a href={waUrl} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                  <img src={waIcon} alt="wa" style={{ width: 18, height: 18 }} />
                  <span style={{ fontSize: 13 }}>{nohp}</span>
                </a>
              )
            })()}
          </TableCell>
        )}
        {columnVisibility.bukti !== false && (
          <TableCell>
            {(() => {
              const url = row.bukti || row.bukti_url || row.proof || row.attachment || row.file || row.bukti_transfer || row.proof_url || ''
              if (!url || !String(url).trim()) return ''
              return <a href={String(url).trim()} target="_blank" rel="noreferrer">Bukti</a>
            })()}
          </TableCell>
        )}
        <TableCell>
          {typeof row.linkInvoice === 'string' && row.linkInvoice.trim() ? (
            <a href={row.linkInvoice} target="_blank" rel="noreferrer">View</a>
          ) : ('')}
        </TableCell>
        <TableCell>
          {typeof row.linkDrive === 'string' && row.linkDrive.trim() ? (
            <a href={row.linkDrive} target="_blank" rel="noreferrer">Drive</a>
          ) : ('')}
        </TableCell>
        <TableCell sx={{ whiteSpace: { xs: 'normal', sm: 'nowrap' }, overflow: 'visible', wordBreak: 'break-word' }}>
          {Array.isArray(row.items) && row.items.length > 0 ? (
            <div style={{ fontSize: 13 }}>{row.items.length} item(s)</div>
          ) : (
            '—'
          )}
        </TableCell>

        <TableCell align="right">
          <IconButton size="small" color="primary" onClick={(e) => { e.stopPropagation(); handleOpenEdit(row); }}>
            <EditIcon fontSize="small" />
          </IconButton>
          <IconButton size="small" color="error" onClick={(e) => { e.stopPropagation(); handleDelete(row.id); }}>
            <DeleteIcon fontSize="small" />
          </IconButton>
          <IconButton size="small" onClick={(e) => { e.stopPropagation(); openRowMenu(e, row); }} aria-label="more actions">
            <MoreVertIcon fontSize="small" />
          </IconButton>
        </TableCell>
      </TableRow>

      <TableRow>
        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={18}>
          <Collapse in={expandedIds.has(row.id)} timeout="auto" unmountOnExit>
            <Box sx={{ margin: 1 }}>
              {Array.isArray(row.items) && row.items.length > 0 ? (
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Produk</TableCell>
                      <TableCell>Kategori</TableCell>
                      <TableCell>Qty</TableCell>
                      <TableCell>Harga Satuan</TableCell>
                      <TableCell>Subtotal</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {row.items.map((it, ii) => (
                      <TableRow key={ii}>
                        <TableCell>{it.name}</TableCell>
                        <TableCell>{it.kategori}</TableCell>
                        <TableCell>{it.quantity}</TableCell>
                        <TableCell>{formatRupiah(it.harga_satuan)}</TableCell>
                        <TableCell>{formatRupiah(it.subtotal_item)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <Typography variant="body2">No items</Typography>
              )}
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </>
  )
}

const areEqual = (prev, next) => {
  // Only re-render when row id changed, selection changed, or expanded state for this row changed
  if (!prev || !next) return false
  const sameId = prev.row.id === next.row.id
  const sameSelected = prev.selected.has(prev.row.id) === next.selected.has(next.row.id)
  const prevExpanded = prev.expandedIds.has(prev.row.id)
  const nextExpanded = next.expandedIds.has(next.row.id)
  return sameId && sameSelected && prevExpanded === nextExpanded
}

export default React.memo(OrderRowComponent, areEqual)
