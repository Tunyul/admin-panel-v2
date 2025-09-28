import React from 'react'
import { Box } from '@mui/material'

export default function LayoutContent({ children, sx = {}, ...props }) {
  // Layout wrapper removed — render children directly to avoid extra DOM wrapper
  // If you need layout sizing again, reintroduce a wrapper or use a page-level container.
  return (
    <Box
      sx={{
        width: '100%',
        minHeight: '100%',
        background: 'transparent',
        ...sx,
      }}
      {...props}
    >
      {children}
    </Box>
  )
}
