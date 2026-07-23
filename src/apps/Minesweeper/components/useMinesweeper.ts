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

type StandardDifficulty = 'beginner' | 'intermediate' | 'expert'

type Difficulty = StandardDifficulty | 'custom'

type DiffParams = Record<StandardDifficulty, Parameters>

type Sizes = {
      width: number;
      height: number;
}

type DialogType = 'custom' | 'bestTimes' | 'nameEntry' | 'about'

type BestScore = {
      time: number;
      name: string;
}

type BestTimes = Record<StandardDifficulty, BestScore>

/* These constants don't depend on any component state, so they live at module level and the grid state can be initialized from them */
const difficultiesParams: DiffParams = {
      beginner: { rows: 9, cols: 9, mines: 10 },
      intermediate: { rows: 16, cols: 16, mines: 40 },
      expert: { rows: 16, cols: 30, mines: 99 },
}

/* The bounds of the custom game dialog, matching the original: out of range values are clamped, never rejected */
const customBounds = {
      rows: { min: 9, max: 24 },
      cols: { min: 9, max: 30 },
      mines: { min: 10, max: 668 },
}

/* Playfield geometry, used to estimate the window size before the rendered play area can be measured */
const CELL_SIZE = 16
const BANNER_TOTAL_HEIGHT = 44
const GRID_BORDER_WIDTH = 6
const PLAY_AREA_PADDING = 12

/* Shell chrome around the app content: 30px title bar, 4px bottom border and 2 x 4px side borders.
   The menu toolbar height depends on font rendering, so it's measured in the DOM with this fallback.
   The window also keeps a minimal width so the title bar buttons never overflow next to the title. */
const TITLE_BAR_HEIGHT = 30
const BOTTOM_BORDER_HEIGHT = 4
const SIDE_BORDERS_WIDTH = 8
const MIN_WINDOW_WIDTH = 170
export const DEFAULT_TOOLBAR_HEIGHT = 20

/* The exact window size derived from the play area and toolbar actually rendered in the DOM,
   so every border and padding of the layout is covered without a fragile sum of constants */
export const getWindowSizeFromContent = (contentWidth: number, contentHeight: number, toolbarHeight: number): Sizes => ({
      width: Math.max(MIN_WINDOW_WIDTH, contentWidth + SIDE_BORDERS_WIDTH),
      height: contentHeight + TITLE_BAR_HEIGHT + toolbarHeight + BOTTOM_BORDER_HEIGHT,
})

export const getWindowSize = (rows: number, cols: number, toolbarHeight: number = DEFAULT_TOOLBAR_HEIGHT): Sizes => {
      return getWindowSizeFromContent(
            cols * CELL_SIZE + GRID_BORDER_WIDTH + PLAY_AREA_PADDING,
            rows * CELL_SIZE + BANNER_TOTAL_HEIGHT + GRID_BORDER_WIDTH + PLAY_AREA_PADDING,
            toolbarHeight
      )
}

/* The best times are persisted in the browser storage, with 999 seconds for "Anonyme" as the original defaults */
const BEST_TIMES_STORAGE_KEY = 'minesweeper-best-times-v1'

const defaultBestTimes: BestTimes = {
      beginner: { time: 999, name: 'Anonyme' },
      intermediate: { time: 999, name: 'Anonyme' },
      expert: { time: 999, name: 'Anonyme' },
}

const loadBestTimes = (): BestTimes => {
      try {
            const savedBestTimes = window.localStorage.getItem(BEST_TIMES_STORAGE_KEY)
            if (savedBestTimes) {
                  return { ...defaultBestTimes, ...JSON.parse(savedBestTimes) }
            }
      } catch {
            /* A corrupted or unavailable storage falls back to the default best times */
      }

      return defaultBestTimes
}

const saveBestTimes = (bestTimes: BestTimes) => {
      try {
            window.localStorage.setItem(BEST_TIMES_STORAGE_KEY, JSON.stringify(bestTimes))
      } catch {
            /* An unavailable storage only loses the persistence, not the current session */
      }
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

/* This reveals every adjacent fully empty cell to the selected cell, skipping flagged cells like the original */
const revealEmptyCells = (grid: Cell[][], row: number, col: number) => {
      directions.forEach(([dx, dy]) => {
            const newRow = row + dx
            const newCol = col + dy

            if (
                  newRow >= 0 &&
                  newRow < grid.length &&
                  newCol >= 0 &&
                  newCol < grid[0].length &&
                  !grid[newRow][newCol].isRevealed &&
                  !grid[newRow][newCol].isFlagged
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

const useMinesweeper = (initialDifficulty: StandardDifficulty = 'beginner') => {
      /* The full grid of unclicked cells is displayed as soon as the window opens, mines only get placed on the first click */
      const [grid, setGrid] = useState<Cell[][]>(() =>
            createEmptyGrid(difficultiesParams[initialDifficulty].rows, difficultiesParams[initialDifficulty].cols)
      )
      const [gameInitialized, setGameInitialized] = useState(false)
      const [gameOver, setGameOver] = useState(false)
      const [gameWon, setGameWon] = useState(false)
      const [difficulty, setDifficulty] = useState<Difficulty>(initialDifficulty)
      const [customParams, setCustomParams] = useState<Parameters>(difficultiesParams[initialDifficulty])
      const [isMouseDown, setIsMouseDown] = useState(false)
      const [hoveredCell, setHoveredCell] = useState<{ row: number; col: number } | null>(null);
      const [chordCell, setChordCell] = useState<{ row: number; col: number } | null>(null)
      const [time, setTime] = useState(0)
      const [isSmileyPressed, setIsSmileyPressed] = useState(false)
      const [marksEnabled, setMarksEnabled] = useState(true)
      const [soundEnabled, setSoundEnabled] = useState(false)
      const [activeDialog, setActiveDialog] = useState<DialogType | null>(null)
      const [bestTimes, setBestTimes] = useState<BestTimes>(loadBestTimes)

      /* The three standard difficulties come from the table, a custom game uses the player's parameters */
      const gameParams = difficulty === 'custom' ? customParams : difficultiesParams[difficulty]

      /* The mine counter displays the total mines minus the flags the player has placed, so it can go below zero */
      const flagCount = grid.reduce((count, row) => count + row.filter((cell) => cell.isFlagged).length, 0)
      const minesLeft = gameParams.mines - flagCount

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

      /* The grid initializer generates a random grid with each cell's information, keeping the flags placed before the first click */
      const initializeGrid = (rows: number, cols: number, mines: number, clickedRow: number, clickedCol: number): Cell[][] => {
            const newGrid = grid.map((row) => row.map((cell) => ({ ...cell })))

            /* I place mines one by one completely at random, avoiding the clicked cell so the first click is always safe */
            let minesPlaced = 0
            while (minesPlaced < mines) {
                  const row = Math.floor(Math.random() * rows)
                  const col = Math.floor(Math.random() * cols)
                  if (!newGrid[row][col].isMine && !(row === clickedRow && col === clickedCol)) {
                        newGrid[row][col].isMine = true
                        minesPlaced++
                  }
            }

            /* I calculate the neighboring mines for each cell */
            for (let row = 0; row < rows; row++) {
                  for (let col = 0; col < cols; col++) {
                        if (!newGrid[row][col].isMine) {
                              newGrid[row][col].neighborMines = countNeighborMines(newGrid, row, col)
                        }
                  }
            }

            /* I reveal the first clicked cell */
            newGrid[clickedRow][clickedCol].isRevealed = true
            if (newGrid[clickedRow][clickedCol].neighborMines === 0) {
                  revealEmptyCells(newGrid, clickedRow, clickedCol)
            }

            setGameInitialized(true)
            /* The timer displays 1 as soon as the first cell is clicked, just like the original game */
            setTime(1)

            return newGrid
      }

      const triggerDefeat = () => {
            setGameOver(true)
            playSound(defeatSound)
      }

      const triggerVictory = (grid: Cell[][]) => {
            flagAllMines(grid)
            setGameWon(true)
            playSound(victorySound)

            /* A record time on a standard difficulty asks for the player's name, like the original */
            if (difficulty !== 'custom' && time < bestTimes[difficulty].time) {
                  setActiveDialog('nameEntry')
            }
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
                  const newGrid = initializeGrid(gameParams.rows, gameParams.cols, gameParams.mines, row, col)
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

      /* The positions are compared before updating the state, so the delegated mouseover of the grid
         can fire repeatedly over the same cell without triggering any extra render */
      const handleMouseEnter = (row: number, col: number) => {
            if (chordCell) {
                  if (chordCell.row !== row || chordCell.col !== col) {
                        setChordCell({ row, col })
                  }
                  return
            }

            if (isMouseDown && !gameOver && !gameWon && !grid[row][col].isRevealed && !grid[row][col].isFlagged) {
                  if (hoveredCell?.row !== row || hoveredCell?.col !== col) {
                        setHoveredCell({ row, col })
                  }
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

      /* This clears every state of the current game and displays a fresh grid */
      const startNewGame = (params: Parameters) => {
            setGrid(createEmptyGrid(params.rows, params.cols))
            setGameOver(false)
            setGameWon(false)
            setGameInitialized(false)
            setTime(0)
            setIsMouseDown(false)
            setHoveredCell(null)
            setChordCell(null)
      }

      const resetGame = (newDifficulty?: Difficulty) => {
            const targetDifficulty = newDifficulty ?? difficulty
            const targetParams = targetDifficulty === 'custom' ? customParams : difficultiesParams[targetDifficulty]

            setDifficulty(targetDifficulty)
            startNewGame(targetParams)
      }

      /* A custom game clamps out of range values instead of rejecting them, and caps the mines to the board capacity */
      const startCustomGame = (height: number, width: number, mines: number) => {
            const rows = Math.max(customBounds.rows.min, Math.min(height, customBounds.rows.max))
            const cols = Math.max(customBounds.cols.min, Math.min(width, customBounds.cols.max))
            const clampedMines = Math.max(customBounds.mines.min, Math.min(mines, customBounds.mines.max, (rows - 1) * (cols - 1)))

            setCustomParams({ rows, cols, mines: clampedMines })
            setDifficulty('custom')
            startNewGame({ rows, cols, mines: clampedMines })
            setActiveDialog(null)
      }

      const openDialog = (dialog: DialogType) => {
            setActiveDialog(dialog)
      }

      const closeDialog = () => {
            setActiveDialog(null)
      }

      /* A record saves the player's name for the current difficulty, then shows the leaderboard like the original */
      const submitBestTime = (name: string) => {
            if (difficulty !== 'custom') {
                  const newBestTimes = { ...bestTimes, [difficulty]: { time, name: name.trim() || 'Anonyme' } }
                  setBestTimes(newBestTimes)
                  saveBestTimes(newBestTimes)
            }

            setActiveDialog('bestTimes')
      }

      const resetBestTimes = () => {
            setBestTimes(defaultBestTimes)
            saveBestTimes(defaultBestTimes)
      }

      /* The smiley button stays pressed while the mouse button is held on it, and releasing it restarts the game */
      const handleSmileyMouseDown = () => {
            setIsSmileyPressed(true)
      }

      const handleSmileyMouseUp = () => {
            if (!isSmileyPressed) return

            setIsSmileyPressed(false)
            resetGame()
      }

      const handleSmileyMouseLeave = () => {
            setIsSmileyPressed(false)
      }

      return {
            grid,
            gameOver,
            gameWon,
            difficulty,
            gameParams,
            isMouseDown,
            hoveredCell,
            chordCell,
            minesLeft,
            time,
            isSmileyPressed,
            marksEnabled,
            soundEnabled,
            activeDialog,
            bestTimes,
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
            startCustomGame,
            openDialog,
            closeDialog,
            submitBestTime,
            resetBestTimes,
      }
}

export default useMinesweeper
