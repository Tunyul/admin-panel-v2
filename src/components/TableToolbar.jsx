import React, { useEffect, useRef, useState, useMemo } from 'react';
import { Box, TextField, InputAdornment, Select, MenuItem, FormControl, InputLabel, IconButton, Chip } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';

function useDebouncedValue(value, delay = 300) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return v;
}

export default function TableToolbar({ value, onChange, placeholder = 'Search…', filterValue, onFilterChange, filterOptions = [] }) {
  const inputRef = useRef(null);
  const [local, setLocal] = useState(value || '');
  const debounced = useDebouncedValue(local, 300);

  useEffect(() => {
    if (debounced !== value) onChange && onChange(debounced);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced]);

  useEffect(() => {
    setLocal(value || '');
  }, [value]);

  // focus search when '/' pressed (unless focused on input-like element)
  useEffect(() => {
    const handler = (e) => {
      if (e.key === '/' && document.activeElement && ['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) return;
      if (e.key === '/') {
        e.preventDefault();
        inputRef.current && inputRef.current.focus();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const filterChip = useMemo(() => {
    if (!filterValue) return null;
    const opt = filterOptions.find((o) => o.value === filterValue);
    return opt ? opt.label : filterValue;
  }, [filterValue, filterOptions]);

  return (
    <Box sx={{ display: 'flex', gap: 2, mb: 2, alignItems: 'center', flexWrap: 'wrap' }}>
      <TextField
        inputRef={inputRef}
        size="small"
        variant="outlined"
        placeholder={placeholder}
        value={local}
        onChange={(e) => setLocal(e.target.value)}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon sx={{ color: '#cbd5e1' }} />
            </InputAdornment>
          ),
          endAdornment: local ? (
            <InputAdornment position="end">
              <IconButton size="small" onClick={() => setLocal('')} sx={{ color: '#cbd5e1' }} aria-label="clear search"><ClearIcon fontSize="small" /></IconButton>
            </InputAdornment>
          ) : null,
        }}
        InputLabelProps={{ sx: { color: '#94a3b8' } }}
        sx={{
          minWidth: 220,
          '& .MuiOutlinedInput-root': { bgcolor: 'rgba(255,255,255,0.03)', color: '#fff' },
          '& .MuiOutlinedInput-input': { color: '#fff' },
          '& .MuiInputLabel-root': { color: '#94a3b8' },
          '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(148,163,184,0.08)' },
        }}
      />

      {filterOptions && filterOptions.length > 0 && (
        <FormControl size="small" sx={{ minWidth: 180 }}>
          <InputLabel id="tbl-filter-label" sx={{ color: '#94a3b8' }}>Filter</InputLabel>
          <Select
            labelId="tbl-filter-label"
            value={filterValue || ''}
            label="Filter"
            onChange={(e) => onFilterChange && onFilterChange(e.target.value)}
            MenuProps={{
              PaperProps: { sx: { bgcolor: 'rgba(15,23,42,0.98)', color: '#cbd5e1' } },
            }}
            sx={{
              '& .MuiSelect-select': { color: '#fff' },
              '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(148,163,184,0.08)' },
              bgcolor: 'rgba(255,255,255,0.02)'
            }}
          >
            <MenuItem value="">(all)</MenuItem>
            {filterOptions.map((opt) => (
              <MenuItem key={opt.value} value={opt.value} sx={{ color: '#cbd5e1' }}>{opt.label}</MenuItem>
            ))}
          </Select>
        </FormControl>
      )}

      {filterChip && (
        <Chip
          label={filterChip}
          onDelete={() => onFilterChange && onFilterChange('')}
          size="small"
          sx={{ bgcolor: 'rgba(96,165,250,0.12)', color: '#e6f0ff', border: '1px solid rgba(96,165,250,0.18)' }}
        />
      )}
    </Box>
  );
}
