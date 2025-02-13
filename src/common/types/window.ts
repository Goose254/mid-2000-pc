import { ReactElement, ReactNode } from "react";

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
  showHelpButton?: boolean;
  showMinimizeButton?: boolean;
  showMaximizeButton?: boolean;
  showCloseButton?: boolean;
}