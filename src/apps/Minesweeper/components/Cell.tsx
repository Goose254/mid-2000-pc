import React from 'react'
import styles from './styles.module.scss'

interface MinesweeperCellProps {
      icon: string
      row: number
      col: number
}

/* Cells are memoized so an expert grid of 16 x 30 only re-renders the few cells whose sprite actually
   changed on each interaction, keeping every reveal instantaneous. The mouse handlers live on the grid
   container (event delegation) and find the cell back through the data attributes. */
export const MinesweeperCell = React.memo<MinesweeperCellProps>(({ icon, row, col }) => {
      return (
            <div className={styles.cell} data-row={row} data-col={col}>
                  <div className={styles.cellCover}></div>
                  <img src={icon} alt="cell" />
            </div>
      )
})

MinesweeperCell.displayName = 'MinesweeperCell'
