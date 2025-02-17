import { useState } from 'react';

type Cell = {
      isMine: boolean;
      isRevealed: boolean;
      isFlagged: boolean;
      isMarked: boolean;
      neighborMines: number;
}

type Difficulty = 'beginner' | 'intermediate' | 'expert'

const useMinesweeper = (initialDifficulty: Difficulty = 'beginner') => {
      const [grid, setGrid] = useState<Cell[][]>([])
      const [gameOver, setGameOver] = useState(false)
      const [difficulty, setDifficulty] = useState<Difficulty>(initialDifficulty)
      const [isMouseDown, setIsMouseDown] = useState(false)
      const [hoveredCell, setHoveredCell] = useState<{ row: number; col: number } | null>(null);

      /* I declare the possible directions from one cell in a [dx, dy] format to simplify later functions */
      const directions = [
            [-1, -1], [-1, 0], [-1, 1],
            [0, -1],          [0, 1],
            [1, -1],  [1, 0], [1, 1],
      ]

      /* The grid initializer generates a random grid with each cell's information */
      const initializeGrid = (rows: number, cols: number, mines: number): Cell[][] => {
            const grid: Cell[][] = Array.from({ length: rows }, () =>
                  Array.from({ length: cols }, () => ({
                        isMine: false,
                        isRevealed: false,
                        isFlagged: false,
                        isMarked: false,
                        neighborMines: 0,
                  }))
            )

            /* I place mines one by one completely at random, making sure I don't place two mines on the same cell */
            let minesPlaced = 0
            while (minesPlaced < mines) {
                        const row = Math.floor(Math.random() * rows)
                        const col = Math.floor(Math.random() * cols)
                        if (!grid[row][col].isMine) {
                              grid[row][col].isMine = true
                        minesPlaced++
                  }
            }

            /* I calculate the neighboring mines for each cell */
            for (let row = 0; row < rows; row++) {
                  for (let col = 0; col < cols; col++) {
                        if (!grid[row][col].isMine) {
                              grid[row][col].neighborMines = countNeighborMines(grid, row, col)
                        }
                  }
            }

            return grid
      }

      /* This counts each mine in the adjacent cells for a given cell */
      const countNeighborMines = (grid: Cell[][], row: number, col: number): number => {
            return directions.reduce((count, [dx, dy]) => {
                  const newRow = row + dx
                  const newCol = col + dy

                  if (
                        newRow >= 0 &&
                        newRow < grid.length &&
                        newCol >= 0 &&
                        newCol < grid[0].length &&
                        grid[newRow][newCol].isMine
                  ) {
                        return count + 1
                  }

                  return count
            }, 0)
      }

      /* This reveals every adjacent fully empty cell to the selected cell */
      const revealEmptyCells = (grid: Cell[][], row: number, col: number) => {
            directions.forEach(([dx, dy]) => {
                  const newRow = row + dx
                  const newCol = col + dy

                  if (
                        newRow >= 0 &&
                        newRow < grid.length &&
                        newCol >= 0 &&
                        newCol < grid[0].length &&
                        !grid[newRow][newCol].isRevealed
                  ) {
                        grid[newRow][newCol].isRevealed = true
                        
                        if (grid[newRow][newCol].neighborMines === 0) {
                              revealEmptyCells(grid, newRow, newCol)
                        }
                  }
            })
      }

      const handleCellClick = (row: number, col: number) => {
            if (gameOver) return;

            setGrid((prevGrid) => {
                  const newGrid = prevGrid.map((row) => row.map((cell) => ({ ...cell })))
                  const cell = newGrid[row][col]

                  if (cell.isMine) {
                        cell.isRevealed = true

                        setGameOver(true)
                  } else {
                        cell.isRevealed = true
                        if (cell.neighborMines === 0) {
                              revealEmptyCells(newGrid, row, col)
                        }
                  }

                  return newGrid
            })
      }

      const handleRightClick = (row: number, col: number) => {
            if (gameOver) return;

            setGrid((prevGrid) => {
                  const newGrid = prevGrid.map((row) => row.map((cell) => ({ ...cell })))
                  const cell = newGrid[row][col]

                  if (!cell.isRevealed) {
                        if (!cell.isFlagged && !cell.isMarked) {
                              cell.isFlagged = true
                        } else if (cell.isFlagged) {
                              cell.isFlagged = false
                              cell.isMarked = true
                        } else if (cell.isMarked) {
                              cell.isMarked = false
                        }
                  }

                  return newGrid
            })
      }

      const handleMouseDown = (row: number, col: number) => {
            if (gameOver || grid[row][col].isRevealed || grid[row][col].isFlagged) return

            setIsMouseDown(true)
            setHoveredCell({ row, col })
      }
      
      const handleMouseUp = (row: number, col: number) => {
            if (!isMouseDown) return

            setIsMouseDown(false)
            setHoveredCell(null)
            handleCellClick(row, col)
      }
      
      const handleMouseEnter = (row: number, col: number) => {
            if (isMouseDown && !gameOver && !grid[row][col].isRevealed && !grid[row][col].isFlagged) {
                  setHoveredCell({ row, col })
            }
      }

      const resetGame = (newDifficulty?: Difficulty) => {
            const rows = newDifficulty === 'beginner' ? 9 : 16
            const cols = newDifficulty === 'beginner' ? 9 : newDifficulty === 'intermediate' ? 16 : 30
            const mines = newDifficulty === 'beginner' ? 10 : newDifficulty === 'intermediate' ? 40 : 99

            setGrid(initializeGrid(rows, cols, mines))
            setGameOver(false)

            if (newDifficulty) setDifficulty(newDifficulty)
      }

      return {
            grid,
            gameOver,
            difficulty,
            isMouseDown,
            hoveredCell,
            handleCellClick,
            handleRightClick,
            handleMouseDown,
            handleMouseUp,
            handleMouseEnter,
            resetGame,
      }
}

export default useMinesweeper