import React, { useState } from 'react'
import styles from './styles.module.scss'

import { Button } from '@/components/atoms/Button/Button'
import { Input } from '@/components/atoms/Input/Input'
import { DialogFrame } from './DialogFrame'

interface CustomGameDialogProps {
      windowId: string
      initialParams: { rows: number; cols: number; mines: number }
      onSubmit: (height: number, width: number, mines: number) => void
      onClose: () => void
}

/* A field that can't be parsed keeps its previous value, the out of range ones are clamped by the game hook */
const parseField = (value: string, fallback: number): number => {
      const parsedValue = parseInt(value, 10)
      return Number.isNaN(parsedValue) ? fallback : parsedValue
}

export const CustomGameDialog: React.FC<CustomGameDialogProps> = ({ windowId, initialParams, onSubmit, onClose }) => {
      const [height, setHeight] = useState(String(initialParams.rows))
      const [width, setWidth] = useState(String(initialParams.cols))
      const [mines, setMines] = useState(String(initialParams.mines))

      const submit = () => {
            onSubmit(
                  parseField(height, initialParams.rows),
                  parseField(width, initialParams.cols),
                  parseField(mines, initialParams.mines)
            )
      }

      return (
            <DialogFrame windowId={windowId} title="Plateau de jeu personnalisé" onClose={onClose} onEnter={submit}>
                  <div className={styles.customLayout}>
                        <div className={styles.customFields}>
                              <label htmlFor="minesweeper-custom-height">Hauteur :</label>
                              <div className={styles.customInput}>
                                    <Input id="minesweeper-custom-height" value={height} autoFocus onChange={(e) => setHeight(e.target.value)} />
                              </div>
                              <label htmlFor="minesweeper-custom-width">Largeur :</label>
                              <div className={styles.customInput}>
                                    <Input id="minesweeper-custom-width" value={width} onChange={(e) => setWidth(e.target.value)} />
                              </div>
                              <label htmlFor="minesweeper-custom-mines">Mines :</label>
                              <div className={styles.customInput}>
                                    <Input id="minesweeper-custom-mines" value={mines} onChange={(e) => setMines(e.target.value)} />
                              </div>
                        </div>
                        <div className={styles.customButtons}>
                              <Button onClick={submit}>OK</Button>
                              <Button onClick={onClose}>Annuler</Button>
                        </div>
                  </div>
            </DialogFrame>
      )
}
