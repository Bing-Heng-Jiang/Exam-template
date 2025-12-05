import React, { useState, useEffect, useCallback } from 'react';
import { Box, Button, Typography, Paper } from '@mui/material';

// --- Constants ---
const GRID_SIZE = 3;
const CELL_SIZE = 150; // px
const WIN_STATE = [0, 1, 2, 3, 4, 5, 6, 7, 8]; // 0-7 are images, 8 is blank
const SCORE_KEY = 'wins';

// Helper to get image URL (currently using placeholders for demonstration)
const getImageUrl = (index) => {
  // UNCOMMENT THIS for local assets:
  // return `/assets/shrek_${index + 1}.jpg`; 
  
  // Placeholder for display purposes:
  return `https://placehold.co/150x150/green/white?text=Shrek+${index + 1}`;
};

export default function Slido() {
  const [board, setBoard] = useState([...WIN_STATE]);
  const [isSolved, setIsSolved] = useState(false);
  const [hasMoved, setHasMoved] = useState(false);
  const [winCount, setWinCount] = useState(0);

  // --- Initialization ---

  // Initialize score from local storage
  useEffect(() => {
    const savedWins = localStorage.getItem(SCORE_KEY);
    if (savedWins) setWinCount(parseInt(savedWins, 10));
    shuffleBoard(); // Start game automatically on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- Game Logic ---

  // Check if board is solved
  const checkWin = (currentBoard) => {
    const won = JSON.stringify(currentBoard) === JSON.stringify(WIN_STATE);
    setIsSolved(won);
    
    if (won) {
      const newScore = winCount + 1;
      setWinCount(newScore);
      localStorage.setItem(SCORE_KEY, newScore.toString());
      
      // Small timeout to allow render update before alert
      setTimeout(() => {
        // eslint-disable-next-line no-alert
        alert('Correct!');
        shuffleBoard();
      }, 100);
    }
  };

  // Shuffle logic: To ensure solvability, we start solved and make N random valid moves
  const shuffleBoard = () => {
    let current = [...WIN_STATE];
    let emptyIdx = 8;
    let previousIdx = -1;

    // Simulate 100 random valid moves
    for (let i = 0; i < 100; i++) {
      const neighbors = getNeighbors(emptyIdx);
      // Don't undo the immediately previous move to ensure good mixing
      const validNeighbors = neighbors.filter(n => n !== previousIdx);
      const randomNeighbor = validNeighbors[Math.floor(Math.random() * validNeighbors.length)];
      
      // Swap
      [current[emptyIdx], current[randomNeighbor]] = [current[randomNeighbor], current[emptyIdx]];
      previousIdx = emptyIdx;
      emptyIdx = randomNeighbor;
    }

    setBoard(current);
    setIsSolved(false);
    setHasMoved(false); // Reset 'moved' state for the button logic
  };

  // Get valid indices adjacent to the current index
  const getNeighbors = (index) => {
    const row = Math.floor(index / GRID_SIZE);
    const col = index % GRID_SIZE;
    const neighbors = [];

    if (row > 0) neighbors.push(index - 3); // Up
    if (row < 2) neighbors.push(index + 3); // Down
    if (col > 0) neighbors.push(index - 1); // Left
    if (col < 2) neighbors.push(index + 1); // Right

    return neighbors;
  };

  // Move a tile at specific index
  const handleTileClick = (index) => {
    if (isSolved) return;

    const blankIndex = board.indexOf(8);
    const neighbors = getNeighbors(blankIndex);

    // If clicked tile is adjacent to blank
    if (neighbors.includes(index)) {
      const newBoard = [...board];
      // Swap
      [newBoard[index], newBoard[blankIndex]] = [newBoard[blankIndex], newBoard[index]];
      
      setBoard(newBoard);
      setHasMoved(true);
      checkWin(newBoard);
    }
  };

  // Handle Keyboard Interactions
  const handleKeyDown = useCallback((e) => {
    // Only active if game container is focused or generically on the page 
    // (Prompt implies page-wide or container active, we'll use window for better UX)
    if (isSolved) return;

    const blankIndex = board.indexOf(8);
    const row = Math.floor(blankIndex / GRID_SIZE);
    const col = blankIndex % GRID_SIZE;
    
    let targetIndex = -1;

    // Logic: Key direction moves the TILE into the blank space.
    // e.g., DOWN key -> The tile ABOVE the blank moves DOWN.
    switch (e.key) {
      case 'ArrowDown':
        if (row > 0) targetIndex = blankIndex - 3; // Tile above moves down
        break;
      case 'ArrowUp':
        if (row < 2) targetIndex = blankIndex + 3; // Tile below moves up
        break;
      case 'ArrowRight':
        if (col > 0) targetIndex = blankIndex - 1; // Tile to left moves right
        break;
      case 'ArrowLeft':
        if (col < 2) targetIndex = blankIndex + 1; // Tile to right moves left
        break;
      default:
        return;
    }

    if (targetIndex !== -1) {
      // Perform swap
      setBoard((prev) => {
        const newBoard = [...prev];
        [newBoard[targetIndex], newBoard[blankIndex]] = [newBoard[blankIndex], newBoard[targetIndex]];
        
        // We need to check win here, but we don't have the *new* state immediately in this callback 
        // if we just called setBoard. However, since React batches, we can do this:
        
        // NOTE: Strictly speaking, checking win inside the setBoard callback 
        // or via useEffect is safer. Let's rely on a useEffect to check win 
        // whenever 'board' changes, or use the helper with the calculated array.
        const isWin = JSON.stringify(newBoard) === JSON.stringify(WIN_STATE);
        if (isWin) {
           // We can't easily trigger the alert sequence from inside the setState callback cleanly
           // The useEffect approach handles this better.
        }
        return newBoard;
      });
      setHasMoved(true);
    }
  }, [board, isSolved]);

  // Attach Keyboard Listener
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Secondary Effect to catch wins triggered by keyboard
  // (Since handleKeyDown uses functional state update, we check result here)
  useEffect(() => {
    if (!isSolved && JSON.stringify(board) === JSON.stringify(WIN_STATE)) {
       // Re-run the win logic
       checkWin(board);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [board]);


  // --- Button Handlers ---

  const handleSolve = () => {
    setBoard([...WIN_STATE]);
    setIsSolved(true);
    setHasMoved(false);
    // Note: Prompt says "move to solved state", implies visual. 
    // It implies a win, but usually debug/cheat buttons don't award points.
    // However, logic says "Win state... waiting for reset".
  };

  const handleReset = () => {
    shuffleBoard();
  };

  return (
    <Box 
      sx={{ 
        minHeight: '100vh',
        display: 'flex', 
        flexDirection: 'column',
        alignItems: 'center',
        padding: 4
      }}
    >
      {/* Simulate Header Place */}
      <Typography variant="h4" gutterBottom>Slido</Typography>
      <Typography variant="subtitle1" gutterBottom>Wins: {winCount}</Typography>

      {/* Game Grid Container */}
      <Paper 
        elevation={3}
        sx={{
          // Grid styling
          display: 'grid',
          gridTemplateColumns: `repeat(${GRID_SIZE}, ${CELL_SIZE}px)`,
          gridTemplateRows: `repeat(${GRID_SIZE}, ${CELL_SIZE}px)`,
          border: '1px solid #333', // Outer border if desired, or relying on cell borders
          width: 'fit-content',
          margin: 'auto',
          backgroundColor: '#333', // gap color
          gap: '0px'
        }}
        // "active" state for keyboard listener is handled globally, 
        // but focusing this div helps if we wanted scoped events
        tabIndex={0} 
      >
        {board.map((tileNumber, index) => {
          const isBlank = tileNumber === 8;
          
          return (
            <Box
              key={`${index}-${tileNumber}`}
              onClick={() => handleTileClick(index)}
              sx={{
                width: CELL_SIZE,
                height: CELL_SIZE,
                border: '1px solid #333',
                margin: 0,
                boxSizing: 'border-box',
                backgroundColor: isBlank ? '#fff' : '#eee',
                cursor: isBlank ? 'default' : 'pointer',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                overflow: 'hidden'
              }}
            >
              {!isBlank && (
                <img 
                  src={getImageUrl(tileNumber)} 
                  alt={`Tile ${tileNumber + 1}`}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  draggable={false}
                />
              )}
            </Box>
          );
        })}
      </Paper>

      {/* Controls */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', width: CELL_SIZE * 3, marginTop: 2 }}>
        
        {/* Solve Button (Left) */}
        <Button 
          variant="contained" 
          color="secondary"
          onClick={handleSolve}
          disabled={isSolved}
        >
          Solve
        </Button>

        {/* Reset Button (Right) */}
        <Button 
          variant="contained" 
          color="primary"
          onClick={handleReset}
          // Disabled if started but no move made
          disabled={!hasMoved && !isSolved}
        >
          Reset
        </Button>
      </Box>

      <Typography variant="caption" sx={{ marginTop: 2, color: 'gray' }}>
        Use Arrow Keys or Click tiles to move
      </Typography>
    </Box>
  );
}