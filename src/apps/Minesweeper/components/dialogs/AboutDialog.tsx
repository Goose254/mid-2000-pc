import React from 'react'
import styles from './styles.module.scss'

import { Button } from '@/components/atoms/Button/Button'
import { DialogFrame } from './DialogFrame'

import minesweeperIcon from '@/assets/windows-icons/winmine.exe_14_100-6.png'

interface AboutDialogProps {
      windowId: string
      onClose: () => void
}

export const AboutDialog: React.FC<AboutDialogProps> = ({ windowId, onClose }) => {
      return (
            <DialogFrame windowId={windowId} title="À propos du Démineur" onClose={onClose} onEnter={onClose}>
                  <div className={styles.aboutContent}>
                        <img src={minesweeperIcon} alt="Icône du Démineur" className={styles.aboutIcon} />
                        <div className={styles.aboutText}>
                              <span className={styles.aboutName}>Démineur</span>
                              <span>Reproduction du Démineur de Windows XP</span>
                              <span>mid-2000-pc — hommage, sans code original</span>
                        </div>
                  </div>
                  <div className={styles.aboutButtons}>
                        <Button onClick={onClose}>OK</Button>
                  </div>
            </DialogFrame>
      )
}
