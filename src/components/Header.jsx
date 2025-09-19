import LogoutButton from './LogoutButton';
import ThemeSwitcher from './ThemeSwitcher';

import React, { useState } from 'react';
import NotificationBell from './Notification';
import { TextField, InputAdornment, IconButton, Box, Paper } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';

export default function Header() {
  const [search, setSearch] = useState('');
    return (
      <Paper
        elevation={0}
        sx={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          bgcolor: 'transparent',
          height: 72,
          borderRadius: 0,
          boxShadow: 'none',
          mt: 0,
          mb: 0,
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 1200,
          overflow: 'visible',
        }}
      >
        <h1
          className="text-3xl font-extrabold tracking-wide"
          style={{
            color: '#fbbf24',
            fontFamily: 'Quicksand, Poppins, Comic Sans MS, Arial, sans-serif',
            paddingLeft: 32,
            letterSpacing: 2,
          }}
        >
          ehe
        </h1>
        <Box display="flex" alignItems="center" gap={2.5} sx={{ pr: 4 }}>
          <TextField
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Cari..."
            size="small"
            variant="outlined"
            sx={{
              minWidth: 180,
              bgcolor: 'var(--input-bg)',
              borderRadius: 3,
              input: {
                color: 'var(--text)',
                fontFamily: 'Poppins, Arial, sans-serif',
                fontWeight: 500,
                letterSpacing: 1,
              },
              '& .MuiOutlinedInput-notchedOutline': { borderColor: '#3b82f6' },
              '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#f472b6' },
              '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#fbbf24' },
              '& .MuiInputBase-root': { bgcolor: 'var(--input-bg)', borderRadius: 3 },
              '& .MuiInputAdornment-root': { color: '#fbbf24' },
              transition: 'all 0.2s cubic-bezier(.4,0,.2,1)',
            }}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton size="small" edge="end" sx={{ color: '#f472b6', transition: 'color 0.2s', '&:hover': { color: '#fbbf24' } }}>
                    <SearchIcon />
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
          <Box sx={{
            bgcolor: 'var(--panel)',
            borderRadius: 2,
            p: 1,
            display: 'flex',
            alignItems: 'center',
            transition: 'none',
          }}>
            <NotificationBell />
          </Box>
          <ThemeSwitcher />
          <LogoutButton />
        </Box>
        {/* removed shadow-based glow animation to keep header flat */}
      </Paper>
    );
}
