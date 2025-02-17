import { useState } from 'react';

type Cell = {
      isMine: boolean;
      isRevealed: boolean;
      isFlagged: boolean;
      isMarked: boolean;
      neighborMines: number;
}

type Parameters = {
      rows: number;
      cols: number;
      mines: number;
}

type DiffParams = {
      beginner: Parameters;
      intermediate: Parameters;
      expert: Parameters;
}

type Difficulty = 'beginner' | 'intermediate' | 'expert'

const useMinesweeper = (initialDifficulty: Difficulty = 'beginner') => {
      const [grid, setGrid] = useState<Cell[][]>([])
      const [gameInitialized, setGameInitialized] = useState(false)
      const [gameOver, setGameOver] = useState(false)
      const [difficulty, setDifficulty] = useState<Difficulty>(initialDifficulty)
      const [isMouseDown, setIsMouseDown] = useState(false)
      const [hoveredCell, setHoveredCell] = useState<{ row: number; col: number } | null>(null);

      const difficultiesParams: DiffParams = {
            beginner: { rows: 9, cols: 9, mines: 10 },
            intermediate: { rows: 16, cols: 16, mines: 40 },
            expert: { rows: 16, cols: 30, mines: 99 },
      }

      /* I declare the possible directions from one cell in a [dx, dy] format to simplify later functions */
      const directions = [
            [-1, -1], [-1, 0], [-1, 1],
            [0, -1],          [0, 1],
            [1, -1],  [1, 0], [1, 1],
      ]

      /* This function returns a fully empty grid */
      const createEmptyGrid = (rows: number, cols: number) => {
            const grid: Cell[][] = Array.from({ length: rows }, () =>
                  Array.from({ length: cols }, () => ({
                        isMine: false,
                        isRevealed: false,
                        isFlagged: false,
                        isMarked: false,
                        neighborMines: 0,
                  }))
            )

            return grid
      }

      /* The grid initializer generates a random grid with each cell's information */
      const initializeGrid = (rows: number, cols: number, mines: number, clickedRow: number, clickedCol: number): Cell[][] => {
            const grid: Cell[][] = createEmptyGrid(rows, cols)

            /* I place mines one by one completely at random, making sure I don't place two mines on the same cell */
            let minesPlaced = 0
            while (minesPlaced < mines) {
                        const row = Math.floor(Math.random() * rows)
                        const col = Math.floor(Math.random() * cols)
                        if (!grid[row][col].isMine && row != clickedRow && col != clickedCol) {
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

            /* I reveal the first clicked cell */
            grid[clickedRow][clickedCol].isRevealed = true

            setGameInitialized(true)

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
            if (gameInitialized) {
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
            } else {
                  const rows = difficultiesParams[difficulty].rows
                  const cols = difficultiesParams[difficulty].cols
                  const mines = difficultiesParams[difficulty].mines

                  setGrid(initializeGrid(rows, cols, mines, row, col))
            }  
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
            let rows, cols

            if (newDifficulty) {
                  rows = difficultiesParams[newDifficulty].rows
                  cols = difficultiesParams[newDifficulty].cols

                  setDifficulty(newDifficulty)
            } else {
                  rows = difficultiesParams[difficulty].rows
                  cols = difficultiesParams[difficulty].cols
            }

            setGrid(createEmptyGrid(rows, cols))
            setGameOver(false)
            setGameInitialized(false)
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