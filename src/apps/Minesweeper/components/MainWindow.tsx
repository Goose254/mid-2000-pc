import React from 'react'
import styles from './styles.module.scss'

import { WindowToolbar } from '@/components/atoms/WindowToolbar/WindowToolbar'
import { WindowToolbarMenuButton } from '@/components/atoms/WindowToolbarMenuButton/WindowToolbarMenuButton'
import { FloatingMenu } from '@/components/molecules/FloatingMenu/FloatingMenu'
import { MenuItem } from '@/components/atoms/MenuItem/MenuItem'
import { MenuSeparator } from '@/components/atoms/MenuSeparator/MenuSeparator'

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
import iconUnclicked from '../assets/icons/buttons/unclicked.png'

import iconBlown from '../assets/icons/buttons/blown.png'
import iconRevealed from '../assets/icons/buttons/revealed.png'
import iconMistake from '../assets/icons/buttons/mistake.png'

import useMinesweeper from './useMinesweeper'

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
      unclicked: iconUnclicked,

      blown: iconBlown,
      revealed: iconRevealed,
      mistake: iconMistake,
}

export const MinesweeperMainWindow: React.FC = () => {
      const {     grid,
                  gameOver,
                  isMouseDown,
                  hoveredCell,
                  handleRightClick,
                  handleMouseDown,
                  handleMouseUp,
                  handleMouseEnter,
                  resetGame,
      } = useMinesweeper('beginner');

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
            if (cell.isMarked) return cellIcons.marked
            if (!cell.isRevealed) {
                  if (isMouseDown && hoveredCell?.row === row && hoveredCell?.col === col) {
                        return cellIcons["numbered"][0]
                  }
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
                                    <MenuItem label="Nouveau" onClick={() => resetGame()} />
                                    <MenuSeparator />
                                    <MenuItem label="Débutant" onClick={() => resetGame('beginner')} />
                                    <MenuItem label="Intermédiaire" onClick={() => resetGame('intermediate')} />
                                    <MenuItem label="Expert" onClick={() => resetGame('expert')} />
                                    <MenuItem label="Personnalisé..." />
                                    <MenuSeparator />
                                    <MenuItem label="Marques (?)" />
                                    <MenuItem label="Couleur" />
                                    <MenuItem label="Son" />
                                    <MenuSeparator />
                                    <MenuItem label="Meilleurs temps..." />
                                    <MenuSeparator />
                                    <MenuItem label="Quitter" />
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

                  <div className={styles.gameGrid}>
                        {grid.map((row, rowIndex) => (
                              <div key={rowIndex} className={styles.row}>
                                    {row.map((cell, colIndex) => (
                                          <div
                                                key={colIndex}
                                                className={styles.cell}
                                                onMouseDown={(e) => {if (e.button === 0) {handleMouseDown(rowIndex, colIndex)}}}
                                                onMouseUp={(e) => {if (e.button === 0) {handleMouseUp(rowIndex, colIndex)}}}
                                                onMouseEnter={() => {if (isMouseDown) {handleMouseEnter(rowIndex, colIndex)}}}
                                                onContextMenu={(e) => {
                                                      e.preventDefault()
                                                      handleRightClick(rowIndex, colIndex)
                                                }}
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
            </>
      )
}
