// src/App.jsx
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { Box, CssBaseline, CssVarsProvider } from '@mui/material';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Homepage from './pages/Homepage';
import Blankopage from './pages/Blankopage';
import Slido from './pages/Slido';
import Tetro from './pages/Tetro';

export default function App() {

  return (
    <>
      {/* Reset browser default styles (incl. body margin: 8px) */}
      <CssBaseline />
      <Navbar />

      {/* Main body */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          minHeight: '95vh', // full - footer
          pt: '80px', // account for fixed navbar height
        }}
      >
        {/* Main body: fills all space between header and footer */}
        <Box component='main' sx={{ flex: 1 }}>
          <Routes>
            <Route path='/' element={<Homepage />} />
            <Route path='/blanko' element={<Blankopage />} />
            <Route path='/slido' element={<Slido />} />
            <Route path='/tetro' element={<Tetro />} />
          </Routes>
        </Box>
      </Box>

      {/* Footer at bottom of document */}
      <Footer />
    </>
  );
}
