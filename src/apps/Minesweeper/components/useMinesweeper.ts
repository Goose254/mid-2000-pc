import { useWindowsStore } from '@/common/stores/windowsStore';
import { useEffect, useState } from 'react';

import tickSound from '../assets/sounds/winmine.exe_432.wav'
import victorySound from '../assets/sounds/winmine.exe_433.wav'
import defeatSound from '../assets/sounds/winmine.exe_434.wav'

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

type Sizes = {
      width: number;
      height: number;
}

type WindowSizes = {
      beginner: Sizes;
      intermediate: Sizes;
      expert: Sizes;
}

type Difficulty = 'beginner' | 'intermediate' | 'expert'

/* These constants don't depend on any component state, so they live at module level and the grid state can be initialized from them */
const difficultiesParams: DiffParams = {
      beginner: { rows: 9, cols: 9, mines: 10 },
      intermediate: { rows: 16, cols: 16, mines: 40 },
      expert: { rows: 16, cols: 30, mines: 99 },
}

export const windowSizes: WindowSizes = {
      beginner: { width: 170, height: 303 },
      intermediate: { width: 282, height: 415 },
      expert: { width: 506, height: 415 },
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

/* This counts each flag in the adjacent cells for a given cell, which chording compares to the cell's number */
const countNeighborFlags = (grid: Cell[][], row: number, col: number): number => {
      return directions.reduce((count, [dx, dy]) => {
            const newRow = row + dx
            const newCol = col + dy

            if (
                  newRow >= 0 &&
                  newRow < grid.length &&
                  newCol >= 0 &&
                  newCol < grid[0].length &&
                  grid[newRow][newCol].isFlagged
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

/* This checks if every safe cell has been revealed, which means the game is won */
const checkVictory = (grid: Cell[][]): boolean => {
      return grid.every((row) => row.every((cell) => cell.isMine || cell.isRevealed))
}

/* When the game is won, the remaining mines are flagged automatically so the mine counter drops to zero */
const flagAllMines = (grid: Cell[][]) => {
      grid.forEach((row) => row.forEach((cell) => {
            if (cell.isMine) {
                  cell.isFlagged = true
                  cell.isMarked = false
            }
      }))
}

const useMinesweeper = (initialDifficulty: Difficulty = 'beginner') => {
      /* The full grid of unclicked cells is displayed as soon as the window opens, mines only get placed on the first click */
      const [grid, setGrid] = useState<Cell[][]>(() =>
            createEmptyGrid(difficultiesParams[initialDifficulty].rows, difficultiesParams[initialDifficulty].cols)
      )
      const [gameInitialized, setGameInitialized] = useState(false)
      const [gameOver, setGameOver] = useState(false)
      const [gameWon, setGameWon] = useState(false)
      const [difficulty, setDifficulty] = useState<Difficulty>(initialDifficulty)
      const [isMouseDown, setIsMouseDown] = useState(false)
      const [hoveredCell, setHoveredCell] = useState<{ row: number; col: number } | null>(null);
      const [chordCell, setChordCell] = useState<{ row: number; col: number } | null>(null)
      const [time, setTime] = useState(0)
      const [isSmileyPressed, setIsSmileyPressed] = useState(false)
      const [marksEnabled, setMarksEnabled] = useState(true)
      const [soundEnabled, setSoundEnabled] = useState(false)

      /* The mine counter displays the total mines minus the flags the player has placed, so it can go below zero */
      const flagCount = grid.reduce((count, row) => count + row.filter((cell) => cell.isFlagged).length, 0)
      const minesLeft = difficultiesParams[difficulty].mines - flagCount

      /* Every sound stays muted unless the player enables the sound option in the menu */
      const playSound = (sound: string) => {
            if (!soundEnabled) return

            new Audio(sound).play().catch(() => {})
      }

      /* The timer ticks every second once the game is running, stops when it ends and caps at 999 */
      useEffect(() => {
            if (!gameInitialized || gameOver || gameWon) return

            const timerInterval = setInterval(() => {
                  setTime((prevTime) => Math.min(prevTime + 1, 999))
                  if (soundEnabled) {
                        new Audio(tickSound).play().catch(() => {})
                  }
            }, 1000)

            return () => clearInterval(timerInterval)
      }, [gameInitialized, gameOver, gameWon, soundEnabled])

      /* The grid initializer generates a random grid with each cell's information */
      const initializeGrid = (rows: number, cols: number, mines: number, clickedRow: number, clickedCol: number): Cell[][] => {
            const grid: Cell[][] = createEmptyGrid(rows, cols)

            /* I place mines one by one completely at random, avoiding the clicked cell so the first click is always safe */
            let minesPlaced = 0
            while (minesPlaced < mines) {
                  const row = Math.floor(Math.random() * rows)
                  const col = Math.floor(Math.random() * cols)
                  if (!grid[row][col].isMine && !(row === clickedRow && col === clickedCol)) {
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
            if (grid[clickedRow][clickedCol].neighborMines === 0) {
                  revealEmptyCells(grid, clickedRow, clickedCol)
            }

            setGameInitialized(true)
            /* The timer displays 1 as soon as the first cell is clicked, just like the original game */
            setTime(1)

            return grid
      }

      const triggerDefeat = () => {
            setGameOver(true)
            playSound(defeatSound)
      }

      const triggerVictory = (grid: Cell[][]) => {
            flagAllMines(grid)
            setGameWon(true)
            playSound(victorySound)
      }

      const handleCellClick = (row: number, col: number) => {
            if (gameOver || gameWon) return;
            if (gameInitialized) {
                  const newGrid = grid.map((row) => row.map((cell) => ({ ...cell })))
                  const cell = newGrid[row][col]

                  if (cell.isMine) {
                        cell.isRevealed = true

                        triggerDefeat()
                  } else {
                        cell.isRevealed = true
                        if (cell.neighborMines === 0) {
                              revealEmptyCells(newGrid, row, col)
                        }

                        if (checkVictory(newGrid)) {
                              triggerVictory(newGrid)
                        }
                  }

                  setGrid(newGrid)
            } else {
                  const rows = difficultiesParams[difficulty].rows
                  const cols = difficultiesParams[difficulty].cols
                  const mines = difficultiesParams[difficulty].mines

                  const newGrid = initializeGrid(rows, cols, mines, row, col)
                  if (checkVictory(newGrid)) {
                        triggerVictory(newGrid)
                  }

                  setGrid(newGrid)
            }
      }

      const handleRightClick = (row: number, col: number) => {
            if (gameOver || gameWon) return;

            setGrid((prevGrid) => {
                  const newGrid = prevGrid.map((row) => row.map((cell) => ({ ...cell })))
                  const cell = newGrid[row][col]

                  if (!cell.isRevealed) {
                        if (!cell.isFlagged && !cell.isMarked) {
                              cell.isFlagged = true
                        } else if (cell.isFlagged) {
                              cell.isFlagged = false
                              cell.isMarked = marksEnabled
                        } else if (cell.isMarked) {
                              cell.isMarked = false
                        }
                  }

                  return newGrid
            })
      }

      const handleMouseDown = (row: number, col: number) => {
            if (gameOver || gameWon || grid[row][col].isRevealed || grid[row][col].isFlagged) return

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
            if (chordCell) {
                  setChordCell({ row, col })
                  return
            }

            if (isMouseDown && !gameOver && !gameWon && !grid[row][col].isRevealed && !grid[row][col].isFlagged) {
                  setHoveredCell({ row, col })
            }
      }

      /* Chording presses the whole neighborhood of a cell at once, with both mouse buttons held or the middle one */
      const handleChordStart = (row: number, col: number) => {
            if (gameOver || gameWon || !gameInitialized) return

            setIsMouseDown(false)
            setHoveredCell(null)
            setChordCell({ row, col })
      }

      /* Releasing a chord on a number surrounded by as many flags reveals every other neighboring cell */
      const handleChordEnd = (row: number, col: number) => {
            if (!chordCell) return

            setChordCell(null)
            setIsMouseDown(false)
            setHoveredCell(null)

            const cell = grid[row][col]
            if (!cell.isRevealed || cell.neighborMines === 0) return
            if (countNeighborFlags(grid, row, col) !== cell.neighborMines) return

            const newGrid = grid.map((gridRow) => gridRow.map((gridCell) => ({ ...gridCell })))
            let mineHit = false

            directions.forEach(([dx, dy]) => {
                  const newRow = row + dx
                  const newCol = col + dy

                  if (
                        newRow >= 0 &&
                        newRow < newGrid.length &&
                        newCol >= 0 &&
                        newCol < newGrid[0].length &&
                        !newGrid[newRow][newCol].isRevealed &&
                        !newGrid[newRow][newCol].isFlagged
                  ) {
                        const neighbor = newGrid[newRow][newCol]
                        neighbor.isRevealed = true
                        neighbor.isMarked = false

                        if (neighbor.isMine) {
                              mineHit = true
                        } else if (neighbor.neighborMines === 0) {
                              revealEmptyCells(newGrid, newRow, newCol)
                        }
                  }
            })

            if (mineHit) {
                  triggerDefeat()
            } else if (checkVictory(newGrid)) {
                  triggerVictory(newGrid)
            }

            setGrid(newGrid)
      }

      /* Leaving the grid while a press is held cancels it, so no cell stays visually stuck */
      const handleGridMouseLeave = () => {
            setIsMouseDown(false)
            setHoveredCell(null)
            setChordCell(null)
      }

      /* Turning the marks option off also clears the question marks already placed on the grid */
      const toggleMarks = () => {
            if (marksEnabled) {
                  setGrid((prevGrid) => prevGrid.map((row) => row.map((cell) => ({ ...cell, isMarked: false }))))
            }

            setMarksEnabled(!marksEnabled)
      }

      const toggleSound = () => {
            setSoundEnabled(!soundEnabled)
      }

      const resetGame = (windowId: string, newDifficulty?: Difficulty) => {
            let rows, cols

            if (newDifficulty) {
                  rows = difficultiesParams[newDifficulty].rows
                  cols = difficultiesParams[newDifficulty].cols

                  useWindowsStore.getState().setWindowSize(windowId, windowSizes[newDifficulty])

                  setDifficulty(newDifficulty)
            } else {
                  rows = difficultiesParams[difficulty].rows
                  cols = difficultiesParams[difficulty].cols

                  useWindowsStore.getState().setWindowSize(windowId, windowSizes[difficulty])
            }

            setGrid(createEmptyGrid(rows, cols))
            setGameOver(false)
            setGameWon(false)
            setGameInitialized(false)
            setTime(0)
            setIsMouseDown(false)
            setHoveredCell(null)
            setChordCell(null)
      }

      /* The smiley button stays pressed while the mouse button is held on it, and releasing it restarts the game */
      const handleSmileyMouseDown = () => {
            setIsSmileyPressed(true)
      }

      const handleSmileyMouseUp = (windowId: string) => {
            if (!isSmileyPressed) return

            setIsSmileyPressed(false)
            resetGame(windowId)
      }

      const handleSmileyMouseLeave = () => {
            setIsSmileyPressed(false)
      }

      return {
            grid,
            gameOver,
            gameWon,
            difficulty,
            isMouseDown,
            hoveredCell,
            chordCell,
            minesLeft,
            time,
            isSmileyPressed,
            marksEnabled,
            soundEnabled,
            handleCellClick,
            handleRightClick,
            handleMouseDown,
            handleMouseUp,
            handleMouseEnter,
            handleChordStart,
            handleChordEnd,
            handleGridMouseLeave,
            handleSmileyMouseDown,
            handleSmileyMouseUp,
            handleSmileyMouseLeave,
            toggleMarks,
            toggleSound,
            resetGame,
      }
}

export default useMinesweeper
