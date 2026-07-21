import React, { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import styles from './styles.module.scss'

import { TitleBar } from '@/components/molecules/TitleBar/TitleBar'
import { useWindowsStore } from '@/common/stores/windowsStore'

interface DialogFrameProps {
      windowId: string
      title: string
      onClose: () => void
      onEnter?: () => void
      children: React.ReactNode
}

/* An XP style modal dialog rendered above its parent window through a portal: the backdrop covers
   the whole window (title bar included) so every click on it is swallowed, and clicking it flashes
   the dialog's title bar like the original */
export const DialogFrame: React.FC<DialogFrameProps> = ({ windowId, title, onClose, onEnter, children }) => {
      const parentWindow = useWindowsStore((state) => state.windows.find((window) => window.id === windowId))
      const [flashesLeft, setFlashesLeft] = useState(0)
      const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
      const dragStart = useRef<{ x: number; y: number } | null>(null)

      /* Each flash step alternates the dialog title bar between inactive and active */
      useEffect(() => {
            if (flashesLeft === 0) return

            const flashTimeout = setTimeout(() => setFlashesLeft(flashesLeft - 1), 60)
            return () => clearTimeout(flashTimeout)
      }, [flashesLeft])

      /* Escape closes the dialog and Enter validates it, wherever the focus is */
      useEffect(() => {
            const handleKeyDown = (event: KeyboardEvent) => {
                  if (event.key === 'Escape') {
                        event.preventDefault()
                        onClose()
                  } else if (event.key === 'Enter' && onEnter) {
                        event.preventDefault()
                        onEnter()
                  }
            }

            window.addEventListener('keydown', handleKeyDown)
            return () => window.removeEventListener('keydown', handleKeyDown)
      }, [onClose, onEnter])

      /* The dialog can be dragged by its title bar, like a real window */
      useEffect(() => {
            const handleMouseMove = (event: MouseEvent) => {
                  if (!dragStart.current) return

                  setDragOffset({ x: event.clientX - dragStart.current.x, y: event.clientY - dragStart.current.y })
            }

            const handleMouseUp = () => {
                  dragStart.current = null
            }

            window.addEventListener('mousemove', handleMouseMove)
            window.addEventListener('mouseup', handleMouseUp)
            return () => {
                  window.removeEventListener('mousemove', handleMouseMove)
                  window.removeEventListener('mouseup', handleMouseUp)
            }
      }, [])

      if (!parentWindow || parentWindow.isMinimized) return null

      const handleBackdropMouseDown = () => {
            setFlashesLeft(5)
            useWindowsStore.getState().bringToFront(windowId)
      }

      const handleDragStart = (event: React.MouseEvent) => {
            dragStart.current = { x: event.clientX - dragOffset.x, y: event.clientY - dragOffset.y }
      }

      return createPortal(
            <div
                  className={styles.backdrop}
                  style={{
                        left: parentWindow.position.x,
                        top: parentWindow.position.y,
                        width: parentWindow.size.width,
                        height: parentWindow.size.height,
                        zIndex: parentWindow.zIndex + 1,
                  }}
                  onMouseDown={handleBackdropMouseDown}
            >
                  <div
                        className={styles.dialog}
                        style={{ transform: `translate(${dragOffset.x}px, ${dragOffset.y}px)` }}
                        onMouseDown={(e) => e.stopPropagation()}
                  >
                        <div onMouseDown={handleDragStart}>
                              <TitleBar
                                    options={{
                                          title,
                                          isActive: flashesLeft % 2 === 0,
                                          buttons: {
                                                close: { visible: true, enabled: true, action: onClose },
                                          },
                                    }}
                              />
                        </div>
                        <div className={styles.dialogBody}>{children}</div>
                  </div>
            </div>,
            document.body
      )
}
