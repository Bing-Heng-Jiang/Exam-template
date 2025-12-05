import React from 'react';
import { Box, Link as MuiLink, useMediaQuery } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import logo from '../assets/logo.png'; // change this path to your logo

export default function Navbar() {
  const theme = useTheme();
  const isWide = useMediaQuery('(min-width:800px)');  // checks if bigger or smaller tha 800px

  const links = isWide  // changes based on is wide
    ? [
        { label: 'Home', href: '/' },
        { label: 'Blanko', href: '/blanko' },
        { label: 'Slido', href: '/slido' },
        { label: 'Tetro', href: '/tetro' },
      ]
    : [
        { label: 'H', href: '/' },
        { label: 'B', href: '/blanko' },
        { label: 'S', href: '/slido' },
        { label: 'T', href: '/tetro' },
      ];

  return (      // allignment at top
    <Box
      component='header'
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '80px',
        bgcolor: '#eeeeee',
        display: 'flex',
        alignItems: 'center',
        zIndex: theme.zIndex.appBar,
      }}
    >
      {/* Logo top-left */}
      <Box
        component='img'
        src={logo}
        alt='Logo'
        sx={{
          width: 50,
          height: 50,
          m: '15px',
        }}
      />

      {/* Nav links right-aligned */}
      <Box sx={{ ml: 'auto', mr: 3, display: 'flex', gap: 2 }}>
        {links.map((link) => (
          <MuiLink
            key={`${link.href}-${link.label}`}
            href={link.href}
            underline='none'
            sx={{ color: 'black', fontWeight: 500 ,
                '&:not(:last-of-type)::after': {
                    content: '"|"',
                    ml: 2,
                    },
                }}
            >

            {link.label}
          </MuiLink>
        ))}
      </Box>
    </Box>
  );
}
