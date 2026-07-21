import React, { useState } from 'react'
import styles from './styles.module.scss'

import { Button } from '@/components/atoms/Button/Button'
import { Input } from '@/components/atoms/Input/Input'
import { DialogFrame } from './DialogFrame'

interface NameEntryDialogProps {
      windowId: string
      difficulty: 'beginner' | 'intermediate' | 'expert' | 'custom'
      onSubmit: (name: string) => void
}

const difficultyLabels = {
      beginner: 'débutant',
      intermediate: 'intermédiaire',
      expert: 'expert',
      custom: 'personnalisé',
}

/* The original record dialog only has an OK button, so closing it also saves the name */
export const NameEntryDialog: React.FC<NameEntryDialogProps> = ({ windowId, difficulty, onSubmit }) => {
      const [name, setName] = useState('Anonyme')

      const submit = () => {
            onSubmit(name)
      }

      return (
            <DialogFrame windowId={windowId} title="Démineur" onClose={submit} onEnter={submit}>
                  <div className={styles.nameEntryContent}>
                        <p className={styles.nameEntryText}>
                              Vous avez le meilleur temps pour le niveau {difficultyLabels[difficulty]}.<br />
                              Entrez votre nom :
                        </p>
                        <div className={styles.nameEntryInput}>
                              <Input value={name} autoFocus onFocus={(e) => e.target.select()} onChange={(e) => setName(e.target.value)} />
                        </div>
                        <Button onClick={submit}>OK</Button>
                  </div>
            </DialogFrame>
      )
}
