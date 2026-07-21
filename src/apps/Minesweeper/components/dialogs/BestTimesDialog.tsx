import React from 'react'
import styles from './styles.module.scss'

import { Button } from '@/components/atoms/Button/Button'
import { DialogFrame } from './DialogFrame'

type BestScore = {
      time: number;
      name: string;
}

interface BestTimesDialogProps {
      windowId: string
      bestTimes: {
            beginner: BestScore;
            intermediate: BestScore;
            expert: BestScore;
      }
      onReset: () => void
      onClose: () => void
}

export const BestTimesDialog: React.FC<BestTimesDialogProps> = ({ windowId, bestTimes, onReset, onClose }) => {
      return (
            <DialogFrame windowId={windowId} title="Meilleurs temps" onClose={onClose} onEnter={onClose}>
                  <div className={styles.bestTimesTable}>
                        <span>Débutant :</span>
                        <span>{bestTimes.beginner.time} secondes</span>
                        <span>{bestTimes.beginner.name}</span>
                        <span>Intermédiaire :</span>
                        <span>{bestTimes.intermediate.time} secondes</span>
                        <span>{bestTimes.intermediate.name}</span>
                        <span>Expert :</span>
                        <span>{bestTimes.expert.time} secondes</span>
                        <span>{bestTimes.expert.name}</span>
                  </div>
                  <div className={styles.bestTimesButtons}>
                        <Button onClick={onReset}>Réinitialiser les scores</Button>
                        <Button onClick={onClose}>OK</Button>
                  </div>
            </DialogFrame>
      )
}
