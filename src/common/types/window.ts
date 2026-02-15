import { TitleBarButtonOptions } from "@/components/organisms/Window/Window";
import type { ReactElement, ReactNode } from "react";

export type WindowAnimationState = 'none' | 'minimizing' | 'restoring' | 'maximizing' | 'unmaximizing';

export interface WindowInfo {
  id: string;
  appPid: string;
  title: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  isMinimized: boolean;
  isMaximized: boolean;
  isActive: boolean;
  zIndex: number;
  icon?: ReactElement;
  content: ReactNode;
  fixedSize?: boolean;
  buttons?: {
    help?: TitleBarButtonOptions;
    minimize?: TitleBarButtonOptions;
    maximize?: TitleBarButtonOptions;
    close?: TitleBarButtonOptions;
  }
  // Animation state
  animationState?: WindowAnimationState;
  // Position and size before maximize (for restoration animation)
  preMaximizePosition?: { x: number; y: number };
  preMaximizeSize?: { width: number; height: number };
  // Taskbar button position (for minimize/restore animation)
  taskbarButtonRect?: DOMRect;
}