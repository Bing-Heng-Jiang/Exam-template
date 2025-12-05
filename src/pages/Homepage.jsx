import React, { useEffect, useState } from 'react';
import { Box, Typography, Button } from '@mui/material';

const SCORE_URL = 'https://cgi.cse.unsw.edu.au/~cs6080/raw/data/info.json';

export default function Homepage() {
  // null = "not loaded yet"
  const [wins, setWins] = useState(null);

  // Load initial value: from localStorage, or from remote URL if empty
  useEffect(() => {
    const saved = localStorage.getItem('wins');

    if (saved !== null) {
      const parsed = Number(saved);
      setWins(Number.isFinite(parsed) ? parsed : 0);
    } else {
      fetchInitialScore();
    }
  }, []);

  // Sync wins -> localStorage whenever it changes (after initial load)
  useEffect(() => {
    if (wins === null) return;
    localStorage.setItem('wins', String(wins));
  }, [wins]);

  // Fetch initial score from the URL
  async function fetchInitialScore() {
    try {
      const res = await fetch(SCORE_URL);
      if (!res.ok) throw new Error('Network error');

      const data = await res.json(); // { score: 5 }
      const score = Number(data.score);
      const initial = Number.isFinite(score) ? score : 0;
      setWins(initial);
      console.log(score)
    } catch (err) {
      // Fallback if fetch fails
      setWins(0);
    }
  }

  // Reset: re-fetch from URL and use that value
  const handleReset = () => {
    localStorage.removeItem('wins');
    fetchInitialScore();
  };

  return (
    <Box
      sx={{
        height: '85vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        textAlign: 'center',
      }}
    >
      <Typography variant='h5' sx={{ color: 'red', mb: 1 }}>
        Please choose an option from the navbar.
      </Typography>

      <Typography variant='body2' sx={{ mb: 2 }}>
        Games won:{' '}
        {wins === null ? '...' : wins}
      </Typography>

      <Button variant='outlined' color='error' onClick={handleReset}>
        Reset
      </Button>
    </Box>
  );
}
