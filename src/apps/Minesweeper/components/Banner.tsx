import React from 'react'
import styles from './styles.module.scss'

import digit0 from '../assets/icons/digits/0.png'
import digit1 from '../assets/icons/digits/1.png'
import digit2 from '../assets/icons/digits/2.png'
import digit3 from '../assets/icons/digits/3.png'
import digit4 from '../assets/icons/digits/4.png'
import digit5 from '../assets/icons/digits/5.png'
import digit6 from '../assets/icons/digits/6.png'
import digit7 from '../assets/icons/digits/7.png'
import digit8 from '../assets/icons/digits/8.png'
import digit9 from '../assets/icons/digits/9.png'
import digitDash from '../assets/icons/digits/dash.png'

import guyNeutral from '../assets/icons/button_guy/neutral.png'
import guyPressed from '../assets/icons/button_guy/pressed.png'
import guySuspense from '../assets/icons/button_guy/suspense.png'
import guyVictory from '../assets/icons/button_guy/victory.png'
import guyDefeat from '../assets/icons/button_guy/defeat.png'

interface MinesweeperBannerProps {
      minesLeft: number
      time: number
      gameOver: boolean
      gameWon: boolean
      isMouseDown: boolean
      isSmileyPressed: boolean
      onSmileyMouseDown: () => void
      onSmileyMouseUp: () => void
      onSmileyMouseLeave: () => void
}

const digitIcons = [digit0, digit1, digit2, digit3, digit4, digit5, digit6, digit7, digit8, digit9]

const smileyIcons = {
      neutral: guyNeutral,
      pressed: guyPressed,
      suspense: guySuspense,
      victory: guyVictory,
      defeat: guyDefeat,
}

/* This converts a counter value into its three LCD sprites, using the dash sprite as a minus sign */
const getCounterIcons = (value: number): string[] => {
      const clampedValue = Math.max(-99, Math.min(value, 999))

      if (clampedValue < 0) {
            const digits = String(-clampedValue).padStart(2, '0')
            return [digitDash, digitIcons[Number(digits[0])], digitIcons[Number(digits[1])]]
      }

      const digits = String(clampedValue).padStart(3, '0')
      return digits.split('').map((digit) => digitIcons[Number(digit)])
}

export const MinesweeperBanner: React.FC<MinesweeperBannerProps> = ({
      minesLeft,
      time,
      gameOver,
      gameWon,
      isMouseDown,
      isSmileyPressed,
      onSmileyMouseDown,
      onSmileyMouseUp,
      onSmileyMouseLeave,
}) => {
      const getSmileyIcon = () => {
            if (isSmileyPressed) return smileyIcons.pressed
            if (gameWon) return smileyIcons.victory
            if (gameOver) return smileyIcons.defeat
            if (isMouseDown) return smileyIcons.suspense
            return smileyIcons.neutral
      }

      return (
            <div className={styles.banner}>
                  <div className={styles.counter}>
                        {getCounterIcons(minesLeft).map((icon, index) => (
                              <img key={index} src={icon} alt="digit" />
                        ))}
                  </div>
                  <button
                        className={styles.smiley}
                        onMouseDown={(e) => {if (e.button === 0) {onSmileyMouseDown()}}}
                        onMouseUp={(e) => {if (e.button === 0) {onSmileyMouseUp()}}}
                        onMouseLeave={() => onSmileyMouseLeave()}
                  >
                        <img src={getSmileyIcon()} alt="smiley" />
                  </button>
                  <div className={styles.counter}>
                        {getCounterIcons(time).map((icon, index) => (
                              <img key={index} src={icon} alt="digit" />
                        ))}
                  </div>
            </div>
      )
}
