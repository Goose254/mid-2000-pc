import React, { useEffect, useRef } from 'react'
import styles from './styles.module.scss'

import { WindowToolbar } from '@/components/atoms/WindowToolbar/WindowToolbar'
import { WindowToolbarMenuButton } from '@/components/atoms/WindowToolbarMenuButton/WindowToolbarMenuButton'
import { FloatingMenu } from '@/components/molecules/FloatingMenu/FloatingMenu'
import { MenuItem } from '@/components/atoms/MenuItem/MenuItem'
import { MenuSeparator } from '@/components/atoms/MenuSeparator/MenuSeparator'
import { MinesweeperBanner } from './Banner'
import { MinesweeperCell } from './Cell'
import { CustomGameDialog } from './dialogs/CustomGameDialog'
import { BestTimesDialog } from './dialogs/BestTimesDialog'
import { NameEntryDialog } from './dialogs/NameEntryDialog'
import { AboutDialog } from './dialogs/AboutDialog'
import { useWindowsStore } from '@/common/stores/windowsStore'

import icon1 from '../assets/icons/buttons/1.png'
import icon2 from '../assets/icons/buttons/2.png'
import icon3 from '../assets/icons/buttons/3.png'
import icon4 from '../assets/icons/buttons/4.png'
import icon5 from '../assets/icons/buttons/5.png'
import icon6 from '../assets/icons/buttons/6.png'
import icon7 from '../assets/icons/buttons/7.png'
import icon8 from '../assets/icons/buttons/8.png'
import iconEmpty from '../assets/icons/buttons/empty.png'

import iconFlagged from '../assets/icons/buttons/flagged.png'
import iconMarked from '../assets/icons/buttons/marked.png'
import iconMarkedPressed from '../assets/icons/buttons/marked-pressed.png'
import iconUnclicked from '../assets/icons/buttons/unclicked.png'

import iconBlown from '../assets/icons/buttons/blown.png'
import iconRevealed from '../assets/icons/buttons/revealed.png'
import iconMistake from '../assets/icons/buttons/mistake.png'

import useMinesweeper, { getWindowSizeFromContent } from './useMinesweeper'

interface MinesweeperMainWindowProps {
      windowId: string
}

type Cell = {
      isMine: boolean;
      isRevealed: boolean;
      isFlagged: boolean;
      isMarked: boolean;
      neighborMines: number;
}

const cellIcons = {
      numbered: [iconEmpty, icon1, icon2, icon3, icon4, icon5, icon6, icon7, icon8],

      flagged: iconFlagged,
      marked: iconMarked,
      markedPressed: iconMarkedPressed,
      unclicked: iconUnclicked,

      blown: iconBlown,
      revealed: iconRevealed,
      mistake: iconMistake,
}

/* The toolbar menus stay open while their button has the focus, so an item click blurs it to close them */
const closeMenu = () => {
      (document.activeElement as HTMLElement | null)?.blur()
}

/* The grid uses event delegation: one set of handlers on the container instead of one per cell,
   the targeted cell is found back through the data attributes of the memoized cells */
const getCellFromEvent = (event: React.MouseEvent): { row: number; col: number } | null => {
      const cellElement = (event.target as HTMLElement).closest('[data-row]')
      if (!(cellElement instanceof HTMLElement)) return null

      return { row: Number(cellElement.dataset.row), col: Number(cellElement.dataset.col) }
}

export const MinesweeperMainWindow: React.FC<MinesweeperMainWindowProps> = ({ windowId }) => {
      const {     grid,
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
      } = useMinesweeper('beginner');

      const isWindowActive = useWindowsStore((state) => state.windows.find((window) => window.id === windowId)?.isActive ?? false)

      const appContentRef = useRef<HTMLDivElement>(null)
      const toolbarRef = useRef<HTMLDivElement>(null)
      const gameAreaRef = useRef<HTMLDivElement>(null)

      /* The shell content wrapper scrolls by default, which Explorer needs but a fixed size game must not:
         the Minesweeper window locks its own scroll container so it can never scroll */
      useEffect(() => {
            const scrollContainer = appContentRef.current?.closest('[class*="window-content-wrapper"]')
            if (scrollContainer instanceof HTMLElement) {
                  scrollContainer.style.overflow = 'hidden'
            }
      }, [])

      /* The window is sized on the toolbar and play area actually rendered in the DOM, so every border
         and padding of the layout is covered and the window always ends flush with the playfield.
         Heights are fractional with font rendering, so they are ceiled to never leave a scrollable pixel. */
      useEffect(() => {
            if (!toolbarRef.current || !gameAreaRef.current) return

            const gameAreaRect = gameAreaRef.current.getBoundingClientRect()
            const windowSize = getWindowSizeFromContent(
                  Math.ceil(gameAreaRect.width),
                  Math.ceil(gameAreaRect.height),
                  Math.ceil(toolbarRef.current.getBoundingClientRect().height)
            )
            useWindowsStore.getState().setWindowSize(windowId, windowSize)
      }, [windowId, gameParams.rows, gameParams.cols])

      /* F2 starts a new game while the window is active and no dialog is open, like in the original */
      useEffect(() => {
            if (!isWindowActive || activeDialog) return

            const handleKeyDown = (event: KeyboardEvent) => {
                  if (event.key === 'F2') {
                        event.preventDefault()
                        resetGame()
                  }
            }

            window.addEventListener('keydown', handleKeyDown)
            return () => window.removeEventListener('keydown', handleKeyDown)
      }, [isWindowActive, activeDialog, resetGame])

      /* The active difficulty and the enabled options display a checkmark in the menu */
      const getMenuCheck = (checked: boolean) => {
            return checked ? <span className={styles.menuCheck}>✓</span> : undefined
      }

      const getCellIcon = (
            cell: Cell,
            gameOver: boolean,
            isMouseDown: boolean,
            hoveredCell: { row: number; col: number } | null,
            row: number,
            col: number
      ) => {
            if (gameOver) {
                  if (cell.isMine) {
                        if (cell.isRevealed) return cellIcons.blown
                        if (cell.isFlagged) return cellIcons.flagged
                        return cellIcons.revealed
                  }
                  if (cell.isFlagged && !cell.isMine) {
                        return cellIcons.mistake
                  }
            }

            if (cell.isFlagged) return cellIcons.flagged
            if (!cell.isRevealed) {
                  /* A cell appears pressed when the mouse is held on it, or when it belongs to the neighborhood of a chording press */
                  const isPressed =
                        (isMouseDown && hoveredCell?.row === row && hoveredCell?.col === col) ||
                        (chordCell !== null && Math.abs(chordCell.row - row) <= 1 && Math.abs(chordCell.col - col) <= 1)

                  if (isPressed) {
                        return cell.isMarked ? cellIcons.markedPressed : cellIcons["numbered"][0]
                  }
                  if (cell.isMarked) return cellIcons.marked
                  return cellIcons.unclicked
            }

            if (cell.isMine) return cellIcons.blown
            return cellIcons["numbered"][cell.neighborMines]
      }

      return (
            <div className={styles.appContent} ref={appContentRef}>
                  <div ref={toolbarRef}>
                        <WindowToolbar>
                              <WindowToolbarMenuButton label="Partie">
                                    <FloatingMenu>
                                          <MenuItem label="Nouvelle partie" info="F2" onClick={() => {closeMenu(); resetGame()}} />
                                          <MenuSeparator />
                                          <MenuItem label="Débutant" iconElement={getMenuCheck(difficulty === 'beginner')} onClick={() => {closeMenu(); resetGame('beginner')}} />
                                          <MenuItem label="Intermédiaire" iconElement={getMenuCheck(difficulty === 'intermediate')} onClick={() => {closeMenu(); resetGame('intermediate')}} />
                                          <MenuItem label="Expert" iconElement={getMenuCheck(difficulty === 'expert')} onClick={() => {closeMenu(); resetGame('expert')}} />
                                          <MenuItem label="Personnalisé..." iconElement={getMenuCheck(difficulty === 'custom')} onClick={() => {closeMenu(); openDialog('custom')}} />
                                          <MenuSeparator />
                                          <MenuItem label="Marques (?)" iconElement={getMenuCheck(marksEnabled)} onClick={() => {closeMenu(); toggleMarks()}} />
                                          <MenuItem label="Couleur" />
                                          <MenuItem label="Son" iconElement={getMenuCheck(soundEnabled)} onClick={() => {closeMenu(); toggleSound()}} />
                                          <MenuSeparator />
                                          <MenuItem label="Meilleurs temps..." onClick={() => {closeMenu(); openDialog('bestTimes')}} />
                                          <MenuSeparator />
                                          <MenuItem label="Quitter" onClick={() => {closeMenu(); useWindowsStore.getState().closeWindow(windowId)}} />
                                    </FloatingMenu>
                              </WindowToolbarMenuButton>
                              <WindowToolbarMenuButton label="?">
                                    <FloatingMenu>
                                          <MenuItem label="Sommaire"/>
                                          <MenuItem label="Aide sur..."/>
                                          <MenuItem label="Utiliser l'aide"/>
                                          <MenuSeparator />
                                          <MenuItem label="À propos du Démineur..." onClick={() => {closeMenu(); openDialog('about')}} />
                                    </FloatingMenu>
                              </WindowToolbarMenuButton>
                        </WindowToolbar>
                  </div>

                  <div className={styles.playSurface}>
                        <div className={styles.gameArea} ref={gameAreaRef}>
                              <MinesweeperBanner
                                    minesLeft={minesLeft}
                                    time={time}
                                    gameOver={gameOver}
                                    gameWon={gameWon}
                                    isMouseDown={isMouseDown || chordCell !== null}
                                    isSmileyPressed={isSmileyPressed}
                                    onSmileyMouseDown={handleSmileyMouseDown}
                                    onSmileyMouseUp={handleSmileyMouseUp}
                                    onSmileyMouseLeave={handleSmileyMouseLeave}
                              />

                              <div
                                    className={styles.gameGrid}
                                    onMouseDown={(e) => {
                                          const cell = getCellFromEvent(e)
                                          if (!cell) return

                                          if (e.button === 1) {
                                                e.preventDefault()
                                                handleChordStart(cell.row, cell.col)
                                          } else if (e.buttons === 3) {
                                                handleChordStart(cell.row, cell.col)
                                          } else if (e.button === 0) {
                                                handleMouseDown(cell.row, cell.col)
                                          } else if (e.button === 2) {
                                                handleRightClick(cell.row, cell.col)
                                          }
                                    }}
                                    onMouseUp={(e) => {
                                          const cell = getCellFromEvent(e)
                                          if (!cell) return

                                          if (chordCell) {
                                                handleChordEnd(cell.row, cell.col)
                                          } else if (e.button === 0) {
                                                handleMouseUp(cell.row, cell.col)
                                          }
                                    }}
                                    onMouseOver={(e) => {
                                          if (!isMouseDown && !chordCell) return

                                          const cell = getCellFromEvent(e)
                                          if (cell) handleMouseEnter(cell.row, cell.col)
                                    }}
                                    onMouseLeave={() => handleGridMouseLeave()}
                                    onContextMenu={(e) => e.preventDefault()}
                              >
                                    {grid.map((row, rowIndex) => (
                                          <div key={rowIndex} className={styles.row}>
                                                {row.map((cell, colIndex) => (
                                                      <MinesweeperCell
                                                            key={colIndex}
                                                            icon={getCellIcon(cell, gameOver, isMouseDown, hoveredCell, rowIndex, colIndex)}
                                                            row={rowIndex}
                                                            col={colIndex}
                                                      />
                                                ))}
                                          </div>
                                    ))}
                              </div>
                        </div>
                  </div>

                  {activeDialog === 'custom' && (
                        <CustomGameDialog
                              windowId={windowId}
                              initialParams={gameParams}
                              onSubmit={startCustomGame}
                              onClose={closeDialog}
                        />
                  )}
                  {activeDialog === 'bestTimes' && (
                        <BestTimesDialog
                              windowId={windowId}
                              bestTimes={bestTimes}
                              onReset={resetBestTimes}
                              onClose={closeDialog}
                        />
                  )}
                  {activeDialog === 'nameEntry' && (
                        <NameEntryDialog
                              windowId={windowId}
                              difficulty={difficulty}
                              onSubmit={submitBestTime}
                        />
                  )}
                  {activeDialog === 'about' && (
                        <AboutDialog windowId={windowId} onClose={closeDialog} />
                  )}
            </div>
      )
}
