import React, { useEffect, useState } from 'react';
import { Box, Button, Typography } from '@mui/material';

const SCORE_KEY = 'wins';
const STRINGS = [
  'the fat cats', 'larger frogs', 'banana cakes',
  'unsw vs usyd', 'french toast', 'hawaii pizza', 'barack obama',
];

// Helper: Get random item
const getRandomItem = (arr) => arr[Math.floor(Math.random() * arr.length)];

// Helper: Logic to generate a new puzzle
const generatePuzzle = () => {
  const str = getRandomItem(STRINGS);
  // Get all indices that aren't spaces
  const nonSpaceIndices = str.split('').map((c, i) => c !== ' ' ? i : -1).filter(i => i !== -1);
  
  // Shuffle indices and pick 3
  const shuffled = nonSpaceIndices.sort(() => 0.5 - Math.random());
  const blanks = shuffled.slice(0, 3);
  
  return { str, blanks };
};

export default function Blankopage() {
  const [gameState, setGameState] = useState({ str: '', blanks: [] });
  const [inputs, setInputs] = useState({});

  // 1. Initialize Game
  const startNewGame = () => {
    setGameState(generatePuzzle());
    setInputs({}); // Reset inputs
  };

  // Initial load
  useEffect(() => {
    startNewGame();
  }, []);

  // 2. Check for Win Condition (The Fix: Run this when 'inputs' changes)
  useEffect(() => {
    const { str, blanks } = gameState;
    if (!str || blanks.length === 0) return;

    // Check if all blanks are filled
    const allFilled = blanks.every(idx => inputs[idx]);
    if (!allFilled) return;

    // Check if correct
    const isCorrect = blanks.every(
      idx => inputs[idx].toUpperCase() === str[idx].toUpperCase()
    );

    if (isCorrect) {
      // Small timeout to allow the UI to update the last letter before alerting
      setTimeout(() => {
        handleWin();
      }, 50);
    }
  }, [inputs, gameState]);

  const handleWin = () => {
    // Synchronous LocalStorage update
    const current = Number(localStorage.getItem(SCORE_KEY)) || 0;
    localStorage.setItem(SCORE_KEY, String(current + 1));
    
    alert('Correct!');
    startNewGame();
  };

  const handleInputChange = (index, value) => {
    // Take last char only
    const char = value.slice(-1); 
    setInputs(prev => ({ ...prev, [index]: char }));
  };

  return (
    <Box sx={{ height: '85vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: 3 }}>
      
      {/* Dynamic Row of Boxes */}
      <Box sx={{ display: 'flex', gap: 1.5 }}>
        {gameState.str.split('').map((char, index) => {
          const isBlank = gameState.blanks.includes(index);
          
          return (
            <Box
              key={index}
              sx={{
                width: 50, height: 50,
                border: '1px solid black',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '24px',
                backgroundColor: char === ' ' ? '#f0f0f0' : 'white' // Gray out spaces slightly
              }}
            >
              {isBlank ? (
                <input
                  value={inputs[index] || ''}
                  onChange={(e) => handleInputChange(index, e.target.value)}
                  style={{
                    width: '100%', height: '100%',
                    border: 'none', outline: 'none',
                    textAlign: 'center', fontSize: '24px',
                    fontWeight: 'bold', color: 'blue'
                  }}
                />
              ) : (
                char
              )}
            </Box>
          );
        })}
      </Box>

      <Button variant="contained" onClick={startNewGame}>
        Skip / Reset
      </Button>
    </Box>
  );
}