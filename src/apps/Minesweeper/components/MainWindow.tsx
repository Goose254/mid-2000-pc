import React, { useEffect } from 'react'
import styles from './styles.module.scss'

import { WindowToolbar } from '@/components/atoms/WindowToolbar/WindowToolbar'
import { WindowToolbarMenuButton } from '@/components/atoms/WindowToolbarMenuButton/WindowToolbarMenuButton'
import { FloatingMenu } from '@/components/molecules/FloatingMenu/FloatingMenu'
import { MenuItem } from '@/components/atoms/MenuItem/MenuItem'
import { MenuSeparator } from '@/components/atoms/MenuSeparator/MenuSeparator'
import { MinesweeperBanner } from './Banner'
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

import useMinesweeper, { windowSizes } from './useMinesweeper'

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

export const MinesweeperMainWindow: React.FC<MinesweeperMainWindowProps> = ({ windowId }) => {
      const {     grid,
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
      } = useMinesweeper('beginner');

      const isWindowActive = useWindowsStore((state) => state.windows.find((window) => window.id === windowId)?.isActive ?? false)

      /* F2 starts a new game while the window is active, like in the original */
      useEffect(() => {
            if (!isWindowActive) return

            const handleKeyDown = (event: KeyboardEvent) => {
                  if (event.key === 'F2') {
                        event.preventDefault()
                        resetGame(windowId)
                  }
            }

            window.addEventListener('keydown', handleKeyDown)
            return () => window.removeEventListener('keydown', handleKeyDown)
      }, [isWindowActive, windowId, resetGame])

      /* This keeps the window size in sync with the current difficulty, even when the shell restores a remembered size */
      useEffect(() => {
            useWindowsStore.getState().setWindowSize(windowId, windowSizes[difficulty])
      }, [windowId, difficulty])

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
            <>
                  <WindowToolbar>
                        <WindowToolbarMenuButton label="Partie">
                              <FloatingMenu>
                                    <MenuItem label="Nouvelle partie" info="F2" onClick={() => resetGame(windowId)} />
                                    <MenuSeparator />
                                    <MenuItem label="Débutant" iconElement={getMenuCheck(difficulty === 'beginner')} onClick={() => resetGame(windowId, 'beginner')} />
                                    <MenuItem label="Intermédiaire" iconElement={getMenuCheck(difficulty === 'intermediate')} onClick={() => resetGame(windowId, 'intermediate')} />
                                    <MenuItem label="Expert" iconElement={getMenuCheck(difficulty === 'expert')} onClick={() => resetGame(windowId, 'expert')} />
                                    <MenuItem label="Personnalisé..." />
                                    <MenuSeparator />
                                    <MenuItem label="Marques (?)" iconElement={getMenuCheck(marksEnabled)} onClick={() => toggleMarks()} />
                                    <MenuItem label="Couleur" />
                                    <MenuItem label="Son" iconElement={getMenuCheck(soundEnabled)} onClick={() => toggleSound()} />
                                    <MenuSeparator />
                                    <MenuItem label="Meilleurs temps..." />
                                    <MenuSeparator />
                                    <MenuItem label="Quitter" onClick={() => useWindowsStore.getState().closeWindow(windowId)} />
                              </FloatingMenu>
                        </WindowToolbarMenuButton>
                        <WindowToolbarMenuButton label="?">
                              <FloatingMenu>
                                    <MenuItem label="Sommaire"/>
                                    <MenuItem label="Aide sur..."/>
                                    <MenuItem label="Utiliser l'aide"/>
                                    <MenuSeparator />
                                    <MenuItem label="À propos du Démineur..."/>
                              </FloatingMenu>
                        </WindowToolbarMenuButton>
                  </WindowToolbar>

                  <div className={styles.gameArea}>
                        <MinesweeperBanner
                              minesLeft={minesLeft}
                              time={time}
                              gameOver={gameOver}
                              gameWon={gameWon}
                              isMouseDown={isMouseDown || chordCell !== null}
                              isSmileyPressed={isSmileyPressed}
                              onSmileyMouseDown={handleSmileyMouseDown}
                              onSmileyMouseUp={() => handleSmileyMouseUp(windowId)}
                              onSmileyMouseLeave={handleSmileyMouseLeave}
                        />

                        <div className={styles.gameGrid} onMouseLeave={() => handleGridMouseLeave()}>
                              {grid.map((row, rowIndex) => (
                                    <div key={rowIndex} className={styles.row}>
                                          {row.map((cell, colIndex) => (
                                                <div
                                                      key={colIndex}
                                                      className={styles.cell}
                                                      onMouseDown={(e) => {
                                                            if (e.button === 1) {
                                                                  e.preventDefault()
                                                                  handleChordStart(rowIndex, colIndex)
                                                            } else if (e.buttons === 3) {
                                                                  handleChordStart(rowIndex, colIndex)
                                                            } else if (e.button === 0) {
                                                                  handleMouseDown(rowIndex, colIndex)
                                                            } else if (e.button === 2) {
                                                                  handleRightClick(rowIndex, colIndex)
                                                            }
                                                      }}
                                                      onMouseUp={(e) => {
                                                            if (chordCell) {
                                                                  handleChordEnd(rowIndex, colIndex)
                                                            } else if (e.button === 0) {
                                                                  handleMouseUp(rowIndex, colIndex)
                                                            }
                                                      }}
                                                      onMouseEnter={() => {if (isMouseDown || chordCell) {handleMouseEnter(rowIndex, colIndex)}}}
                                                      onContextMenu={(e) => e.preventDefault()}
                                                >
                                                      <div className={styles.cellCover}></div>
                                                      <img
                                                            src={getCellIcon(cell, gameOver, isMouseDown, hoveredCell, rowIndex, colIndex)}
                                                            alt="cell"
                                                            style={{ width: '100%', height: '100%' }}
                                                      />
                                                </div>
                                          ))}
                                    </div>
                              ))}
                        </div>
                  </div>
            </>
      )
}
