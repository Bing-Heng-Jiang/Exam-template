// src/components/Footer.jsx
import React from 'react';
import { Box, Typography } from '@mui/material';

export default function Footer() {
  return (
    <Box
      component='footer'
      sx={{
        height: '50px',
        width: '100%',
        bgcolor: '#999999',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Typography variant='body2' sx={{ color: 'white' }}>
        Footer
      </Typography>
    </Box>
  );
}
