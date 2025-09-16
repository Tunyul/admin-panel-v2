import LogoutButton from './LogoutButton';
import ThemeSwitcher from './ThemeSwitcher';

import React, { useState } from 'react';
import NotificationBell from './Notification';
import { TextField, InputAdornment, IconButton, Box } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';

export default function Header() {
  const [search, setSearch] = useState('');
  return (
    <header className="w-full flex items-center justify-between px-6 py-4 bg-[#232946] shadow-md">
      <h1
        className="text-2xl font-bold text-[#fbbf24] tracking-wide"
        style={{ fontFamily: 'Quicksand, Poppins, Arial, sans-serif', paddingLeft: 24 }}
      >
        CS Bot Admin
      </h1>
  <Box display="flex" alignItems="center" gap={2} sx={{ pr: 4 }}>
        <TextField
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Cari..."
          size="small"
          variant="outlined"
          sx={{
            minWidth: 180,
            bgcolor: '#181A20',
            borderRadius: 2,
            input: { color: '#fff', fontFamily: 'Poppins, Arial, sans-serif' },
            '& .MuiOutlinedInput-notchedOutline': { borderColor: '#232946' },
            '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#fbbf24' },
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#fbbf24' },
            '& .MuiInputBase-root': { bgcolor: '#181A20' },
            '& .MuiInputAdornment-root': { color: '#fbbf24' },
          }}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton size="small" edge="end" sx={{ color: '#fbbf24' }}>
                  <SearchIcon />
                </IconButton>
              </InputAdornment>
            ),
          }}
        />
  <NotificationBell />
        <ThemeSwitcher />
        <LogoutButton />
      </Box>
    </header>
  );
}
