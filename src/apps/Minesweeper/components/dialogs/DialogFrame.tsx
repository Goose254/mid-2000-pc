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
   the whole dialog chrome (title bar and borders) like the original */
export const DialogFrame: React.FC<DialogFrameProps> = ({ windowId, title, onClose, onEnter, children }) => {
      const parentWindow = useWindowsStore((state) => state.windows.find((window) => window.id === windowId))
      const [flashesLeft, setFlashesLeft] = useState(0)
      const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
      const dragStart = useRef<{ x: number; y: number } | null>(null)
      const backdropRef = useRef<HTMLDivElement>(null)

      /* Each flash step alternates the whole dialog chrome between inactive and active */
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

      /* The dialog lives outside the window's DOM, so the shell marks the parent inactive on any click
         on the overlay: it's re-activated right after, and only clicks really outside the application
         (desktop, other windows) leave the parent and therefore the dialog in the inactive state */
      useEffect(() => {
            const handleDocumentMouseDown = (event: MouseEvent) => {
                  if (backdropRef.current?.contains(event.target as Node)) {
                        useWindowsStore.getState().bringToFront(windowId)
                  }
            }

            document.addEventListener('mousedown', handleDocumentMouseDown)
            return () => document.removeEventListener('mousedown', handleDocumentMouseDown)
      }, [windowId])

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

      /* The dialog is modal, so it's active exactly when its parent window is; the flash counter
         alternates that state to make the whole chrome blink */
      const isDialogActive = parentWindow.isActive && flashesLeft % 2 === 0

      const handleBackdropMouseDown = () => {
            setFlashesLeft(5)
      }

      /* Clicking the dialog swallows the event before it reaches the shell listeners (so no flash and no
         inactive marking), which means the parent has to be re-activated explicitly here */
      const handleDialogMouseDown = (event: React.MouseEvent) => {
            event.stopPropagation()
            useWindowsStore.getState().bringToFront(windowId)
      }

      const handleDragStart = (event: React.MouseEvent) => {
            dragStart.current = { x: event.clientX - dragOffset.x, y: event.clientY - dragOffset.y }
      }

      return createPortal(
            <div
                  ref={backdropRef}
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
                        className={`${styles.dialog} ${isDialogActive ? '' : styles.inactive}`}
                        style={{ transform: `translate(${dragOffset.x}px, ${dragOffset.y}px)` }}
                        onMouseDown={handleDialogMouseDown}
                  >
                        <div onMouseDown={handleDragStart}>
                              <TitleBar
                                    options={{
                                          title,
                                          isActive: isDialogActive,
                                          buttons: {
                                                close: { visible: true, enabled: true, action: onClose },
                                          },
                                    }}
                              />
                        </div>
                        <div className={styles.dialogContentRow}>
                              <div className={styles.dialogLeftBorder}></div>
                              <div className={styles.dialogBody}>{children}</div>
                              <div className={styles.dialogRightBorder}></div>
                        </div>
                        <div className={styles.dialogBottomBorder}></div>
                  </div>
            </div>,
            /* The portal targets #root so the dialog inherits the shell cursor and its text selection rules */
            document.getElementById('root') ?? document.body
      )
}
