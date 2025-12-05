import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Box, Button, Typography, Dialog, DialogTitle, DialogActions } from '@mui/material';

// --- Constants ---
const COLS = 10;
const ROWS = 12;
const GRAVITY_MS = 1000; // 1 second per step
const WIN_ROW_COUNT = 5;

// "Higher than one of the first 8 rows"
// We interpret this as: The board has 12 rows (0-11).
// If you occupy rows 0, 1, 2, or 3 (the top 4), you lose.
// Only rows 4-11 (the bottom 8) are "safe" for locked blocks.
const SAFE_ZONE_START_ROW = 4; 

// Shapes definitions
// Format: array of {x, y} offsets relative to the piece's top-left origin
const SHAPES = [
  // 2x2 block
  { type: '2x2', coords: [{x:0, y:0}, {x:1, y:0}, {x:0, y:1}, {x:1, y:1}], width: 2, height: 2 },
  // 2 (high) x 1 (wide) block
  { type: '2x1', coords: [{x:0, y:0}, {x:0, y:1}], width: 1, height: 2 },
  // 1x1 block
  { type: '1x1', coords: [{x:0, y:0}], width: 1, height: 1 },
];

export default function Tetro() {
  // Grid State: 2D array [row][col]. 
  // Values: null (empty), 'locked' (filled block), 'green' (completed row)
  const [grid, setGrid] = useState(
    Array.from({ length: ROWS }, () => Array(COLS).fill(null))
  );

  const [activePiece, setActivePiece] = useState(null); // { shape, x, y }
  const [isActive, setIsActive] = useState(false); // Game active (clicked on board)
  const [isGameOver, setIsGameOver] = useState(false);
  const [gameResult, setGameResult] = useState(null); // 'win' or 'loss'

  // Refs for state accessible in event listeners/intervals
  const activePieceRef = useRef(activePiece);
  const gridRef = useRef(grid);
  const isActiveRef = useRef(isActive);
  const isGameOverRef = useRef(isGameOver);

  // Sync refs with state
  useEffect(() => { activePieceRef.current = activePiece; }, [activePiece]);
  useEffect(() => { gridRef.current = grid; }, [grid]);
  useEffect(() => { isActiveRef.current = isActive; }, [isActive]);
  useEffect(() => { isGameOverRef.current = isGameOver; }, [isGameOver]);

  // --- Game Loop (Gravity) ---
  useEffect(() => {
    const interval = setInterval(() => {
      if (isActiveRef.current && !isGameOverRef.current && activePieceRef.current) {
        movePiece(0, 1); // Try moving down
      }
    }, GRAVITY_MS);

    return () => clearInterval(interval);
  }, []);

  // --- Keyboard Controls ---
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isActiveRef.current || isGameOverRef.current || !activePieceRef.current) return;

      if (e.key === 'ArrowLeft') {
        movePiece(-1, 0);
      } else if (e.key === 'ArrowRight') {
        movePiece(1, 0);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // --- Core Logic ---

  const startNewGame = () => {
    setGrid(Array.from({ length: ROWS }, () => Array(COLS).fill(null)));
    setActivePiece(null);
    setIsGameOver(false);
    setGameResult(null);
    setIsActive(false); // Wait for click to activate
  };

  const spawnPiece = () => {
    const randomShape = SHAPES[Math.floor(Math.random() * SHAPES.length)];
    // Spawns at top-left (0,0) as per requirements
    const newPiece = { shape: randomShape, x: 0, y: 0 };
    
    // Check if spawn point is valid immediately (collision on spawn = loss)
    if (checkCollision(newPiece.x, newPiece.y, randomShape, gridRef.current)) {
       // Technically this shouldn't happen often if we clear lines, 
       // but if the stack is to the top, we lose.
       handleLoss();
       return;
    }
    
    setActivePiece(newPiece);
  };

  const movePiece = (dx, dy) => {
    const piece = activePieceRef.current;
    if (!piece) return;

    const newX = piece.x + dx;
    const newY = piece.y + dy;

    if (!checkCollision(newX, newY, piece.shape, gridRef.current)) {
      // Valid move
      setActivePiece({ ...piece, x: newX, y: newY });
    } else {
      // Collision detected
      if (dy > 0) {
        // We were moving down, so we lock
        lockPiece();
      }
      // If moving sideways (dx !== 0), we just ignore the input
    }
  };

  const checkCollision = (x, y, shape, currentGrid) => {
    for (let coord of shape.coords) {
      const targetX = x + coord.x;
      const targetY = y + coord.y;

      // Boundaries
      if (targetX < 0 || targetX >= COLS || targetY >= ROWS) return true;

      // Occupied cells (locked or green)
      // Note: We ignore 'active' piece in this check because it's stored separately
      if (targetY >= 0 && currentGrid[targetY][targetX] !== null) {
        return true;
      }
    }
    return false;
  };

  const lockPiece = () => {
    const piece = activePieceRef.current;
    const currentGrid = [...gridRef.current.map(row => [...row])];

    // 1. Place the piece into the grid
    let landedHigh = false;

    piece.shape.coords.forEach(coord => {
      const targetX = piece.x + coord.x;
      const targetY = piece.y + coord.y;
      
      if (targetY >= 0 && targetY < ROWS && targetX >= 0 && targetX < COLS) {
        currentGrid[targetY][targetX] = 'locked';
        
        // Check loss condition logic:
        // "Occupies a cell that is higher than one of the first 8 rows"
        // Safe rows: 4, 5, ..., 11.
        // Dangerous rows: 0, 1, 2, 3.
        if (targetY < SAFE_ZONE_START_ROW) {
          landedHigh = true;
        }
      }
    });

    setGrid(currentGrid);
    setActivePiece(null);

    // 2. Check Loss Condition
    if (landedHigh) {
      // We must check if we lost BEFORE we check for line clears, 
      // or AFTER? The prompt implies "Every time a new block is locked... if rows are filled... turn green."
      // THEN "If... it occupies a cell that is higher... player loses".
      // Usually "Game Over" checks happen after placement.
      // We will prioritize the Loss alert if it placed high.
      handleLoss();
      return;
    }

    // 3. Check for Full Rows (Turn Green)
    let greenCount = 0;
    const nextGrid = currentGrid.map(row => {
      // If row is full of 'locked' or 'green' blocks, it becomes 'green'
      const isFull = row.every(cell => cell !== null);
      if (isFull) {
        greenCount++;
        // Turn entire row green
        return Array(COLS).fill('green');
      }
      return row;
    });

    // Count total green rows in the board
    const totalGreenRows = nextGrid.filter(row => row[0] === 'green').length;

    setGrid(nextGrid);

    // 4. Check Win Condition
    if (totalGreenRows >= WIN_ROW_COUNT) {
      handleWin();
    } else {
      // 5. Spawn next piece (Step E)
      spawnPiece();
    }
  };

  const handleWin = () => {
    setIsGameOver(true);
    setGameResult('win');
    // We use a timeout to let the React render cycle finish painting the green rows
    setTimeout(() => {
        alert("Congrats!");
        startNewGame();
    }, 100);
  };

  const handleLoss = () => {
    setIsGameOver(true);
    setGameResult('loss');
    setTimeout(() => {
        alert("Failed");
        startNewGame();
    }, 100);
  };

  const handleBoardClick = () => {
    if (!isActive) {
      setIsActive(true);
      if (!activePiece && !isGameOver) {
        spawnPiece();
      }
    }
  };

  // --- Rendering Helpers ---

  // Determine cell color for rendering
  const getCellContent = (r, c) => {
    // 1. Check Active Piece
    if (activePiece) {
      const { x, y, shape } = activePiece;
      // Check if (c, r) is inside the active piece
      const isPiecePart = shape.coords.some(coord => (x + coord.x) === c && (y + coord.y) === r);
      if (isPiecePart) {
        return { bg: '#333', border: '#333' }; // Active piece color
      }
    }

    // 2. Check Grid Content
    const cellValue = grid[r][c];
    if (cellValue === 'locked') {
      return { bg: '#555', border: '#333' };
    } else if (cellValue === 'green') {
      return { bg: 'rgb(0,255,0)', border: '#333' };
    }

    // 3. Empty
    return { bg: 'transparent', border: '#333' };
  };

  return (
    <Box
      sx={{
        width: '100vw',
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden', // Prevent scrollbars
      }}
    >
      {/* Header Placeholder (Requirement: Contains header/footer from 1.2.1 - simplified here) */}
      <Box sx={{ p: 2, bgcolor: '#eee' }}>
        <Typography variant="h5">Tetro</Typography>
      </Box>

      {/* Main Game Area */}
      <Box
        sx={{
          flexGrow: 1,
          position: 'relative',
          marginTop: '20px',
          marginLeft: '20px',
          marginRight: '20px',
          marginBottom: '100px',
          border: isActive ? '2px solid blue' : '1px dashed #ccc', // Visual indicator for active state
          display: 'flex',
          flexDirection: 'column',
        }}
        onClick={handleBoardClick}
      >
        {!isActive && !activePiece && (
          <Typography 
            variant="h4" 
            sx={{ 
              position: 'absolute', 
              top: '50%', 
              left: '50%', 
              transform: 'translate(-50%, -50%)',
              color: 'rgba(0,0,0,0.3)',
              pointerEvents: 'none',
              zIndex: 10
            }}
          >
            Click to Start
          </Typography>
        )}

        {/* The Grid */}
        {grid.map((row, rIndex) => (
          <Box 
            key={rIndex} 
            sx={{ 
              display: 'flex', 
              flex: 1, // Distribute rows evenly
            }}
          >
            {row.map((_, cIndex) => {
              const { bg, border } = getCellContent(rIndex, cIndex);
              return (
                <Box
                  key={cIndex}
                  sx={{
                    flex: 1, // Distribute cols evenly
                    border: `1px solid ${border}`,
                    backgroundColor: bg,
                    boxSizing: 'border-box'
                  }}
                />
              );
            })}
          </Box>
        ))}
      </Box>

      {/* Footer/Reset Area */}
      <Box sx={{ 
        position: 'fixed', 
        bottom: 20, 
        left: 0, 
        right: 0, 
        display: 'flex', 
        justifyContent: 'center' 
      }}>
        <Button 
          variant="contained" 
          onClick={startNewGame}
          size="large"
        >
          Reset Game
        </Button>
      </Box>

    </Box>
  );
}
