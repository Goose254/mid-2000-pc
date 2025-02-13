// common/stores/taskbarStore.ts
import { create } from 'zustand';
import React from 'react';

export interface TaskbarIcon {
  /** Identifiant unique de l'instance d'application associée */
  appPid: string;
  /** Composant React représentant l'icône affichée dans la taskbar */
  icon: React.ReactNode;
}

export interface TaskbarState {
  /** Tableau des icônes affichées dans la taskbar */
  toolIcons: TaskbarIcon[];
  /** Ajoute une icône dans la taskbar pour une instance d'app donnée */
  addToolIcon: (appPid: string, icon: React.ReactNode) => void;
  /** Met à jour l'icône pour une instance d'app donnée */
  updateToolIcon: (appPid: string, icon: React.ReactNode) => void;
  /** Retire l'icône associée à une instance d'app */
  removeToolIcon: (appPid: string) => void;
}

export const useTaskbarStore = create<TaskbarState>((set, get) => ({
  toolIcons: [],
  
  addToolIcon: (appPid, icon) => {
    // Vérifier si une icône pour cet appPid existe déjà
    const existing = get().toolIcons.find(item => item.appPid === appPid);
    if (existing) {
      // Si elle existe, on la met à jour
      set((state) => ({
        toolIcons: state.toolIcons.map(item =>
          item.appPid === appPid ? { ...item, icon } : item
        )
      }));
    } else {
      // Sinon, on l'ajoute
      set((state) => ({
        toolIcons: [...state.toolIcons, { appPid, icon }]
      }));
    }
  },

  updateToolIcon: (appPid, icon) => {
    set((state) => ({
      toolIcons: state.toolIcons.map(item =>
        item.appPid === appPid ? { ...item, icon } : item
      )
    }));
  },

  removeToolIcon: (appPid) => {
    set((state) => ({
      toolIcons: state.toolIcons.filter(item => item.appPid !== appPid)
    }));
  }
}));
