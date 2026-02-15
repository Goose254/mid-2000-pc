import React from 'react';
import styles from './styles.module.scss';

import { WindowToolbar } from '@/components/atoms/WindowToolbar/WindowToolbar';
import { WindowToolbarMenuButton } from '@/components/atoms/WindowToolbarMenuButton/WindowToolbarMenuButton';
import { FloatingMenu } from '@/components/molecules/FloatingMenu/FloatingMenu';
import { MenuItem } from '@/components/atoms/MenuItem/MenuItem';
import { MenuSeparator } from '@/components/atoms/MenuSeparator/MenuSeparator';
import { WindowToolbarButton } from '@/components/atoms/WindowToolbarButton/WindowToolbarButton';
import { Input } from '@/components/atoms/Input/Input';
import { Button } from '@/components/atoms/Button/Button';

import WindowToolbarWindowsIcon from '@/assets/explorer-toolbar-windows-icon.png';
import BackwardIcon from '@/assets/explorer-icons/back.png';
import FoldersIcon from '@/assets/explorer-icons/folders.png';
import ForwardIcon from '@/assets/explorer-icons/forward.png';
import SearchIcon from '@/assets/explorer-icons/search.png';
import UpIcon from '@/assets/explorer-icons/up.png';
import ViewsIcon from '@/assets/explorer-icons/views.png';

import MyComputerIcon from '@/assets/windows-icons/explorer.exe_14_100-9.png';
import SharedFolderIcon from '@/assets/windows-icons/shell32.dll_14_267-6.png';
import FolderIcon from '@/assets/windows-icons/shell32.dll_14_235-8.png';
import LocalDiskIcon from '@/assets/windows-icons/shell32.dll_14_9-6.png';
import FloppyIcon from '@/assets/windows-icons/shell32.dll_14_7-6.png';
import CdDriveIcon from '@/assets/windows-icons/shell32.dll_14_12-6.png';
import NetworkDriveIcon from '@/assets/windows-icons/shell32.dll_14_14-6.png';

import SystemInfoIcon from '@/assets/windows-icons/sysdm.cpl_14_9-9.png';
import AddRemoveProgramsIcon from '@/assets/windows-icons/appwiz.cpl_14_1503.png';
import ChangeSettingsIcon from '@/assets/windows-icons/desk.cpl_14_40-6.png';
import NetworkPlacesIcon from '@/assets/windows-icons/hnetcfg.dll_14_60.png';
import MyDocumentsIcon from '@/assets/windows-icons/shell32.dll_14_235-9.png';
import ControlPanelIcon from '@/assets/windows-icons/shell32.dll_14_137-8.png';

interface SidebarTask {
  label: string;
  icon: string;
}

interface ExplorerItem {
  label: string;
  icon: string;
  description?: string;
  linkLike?: boolean;
}

interface ExplorerGroup {
  title: string;
  items: ExplorerItem[];
}

interface SidebarSectionProps {
  title: string;
  tasks: SidebarTask[];
}

const SYSTEM_TASKS: SidebarTask[] = [
  { label: "Afficher les informations système", icon: SystemInfoIcon },
  { label: "Ajouter ou supprimer des programmes", icon: AddRemoveProgramsIcon },
  { label: "Modifier un paramètre", icon: ChangeSettingsIcon },
];

const OTHER_PLACES_TASKS: SidebarTask[] = [
  { label: "Favoris réseau", icon: NetworkPlacesIcon },
  { label: "Mes documents", icon: MyDocumentsIcon },
  { label: "Documents partagés", icon: FolderIcon },
  { label: "Panneau de configuration", icon: ControlPanelIcon },
];

const STORAGE_GROUPS: ExplorerGroup[] = [
  {
    title: "Fichiers enregistrés sur cet ordinateur",
    items: [
      { label: "Documents partagés", icon: SharedFolderIcon },
      { label: "Documents de Administrateur", icon: FolderIcon },
    ],
  },
  {
    title: "Lecteurs de disques dur",
    items: [
      { label: "Disque local (C:)", icon: LocalDiskIcon },
      { label: "Disque local (E:)", icon: LocalDiskIcon },
    ],
  },
  {
    title: "Périphériques utilisant des supports amovibles",
    items: [
      { label: "Disquette 3½ (A:)", icon: FloppyIcon },
      { label: "Lecteur CD (D:)", icon: CdDriveIcon },
    ],
  },
  {
    title: "Lecteurs réseau",
    items: [
      {
        label: "Shared Folders sur 'vmware-host' (Z:)",
        icon: NetworkDriveIcon,
      },
    ],
  },
];

const SidebarSection: React.FC<SidebarSectionProps> = ({ title, tasks }) => (
  <section className={styles.sidebarSection}>
    <header className={styles.sidebarSectionHeader}>
      <span>{title}</span>
      <button type="button" className={styles.sidebarCollapseButton} aria-label="Réduire la section" />
    </header>

    <ul className={styles.sidebarTasks}>
      {tasks.map((task) => (
        <li key={task.label}>
          <button type="button" className={styles.sidebarTaskButton}>
            <img src={task.icon} alt="" aria-hidden="true" />
            <span>{task.label}</span>
          </button>
        </li>
      ))}
    </ul>
  </section>
);

export const ExplorerMainWindow: React.FC = () => {
  return (
    <>
      <WindowToolbar variant="gradient">
        <WindowToolbarMenuButton label="Fichier">
          <FloatingMenu>
            <MenuItem label="Créer un raccourci" aria-disabled />
            <MenuItem label="Supprimer" aria-disabled />
            <MenuItem label="Renommer" aria-disabled />
            <MenuItem label="Propriétés" aria-disabled />
            <MenuSeparator />
            <MenuItem label="Fermer" />
          </FloatingMenu>
        </WindowToolbarMenuButton>
        <WindowToolbarMenuButton label="Edition">
          <FloatingMenu>
            <MenuItem label="Annuler Déplacer" info="Ctrl+Z" />
            <MenuSeparator />
            <MenuItem label="Couper" info="Ctrl+X" aria-disabled />
            <MenuItem label="Copier" info="Ctrl+C" aria-disabled />
            <MenuItem label="Coller" info="Ctrl+V" aria-disabled />
            <MenuItem label="Coller le raccourci" aria-disabled />
            <MenuSeparator />
            <MenuItem label="Sélectionner tout" info="Ctrl+A" />
          </FloatingMenu>
        </WindowToolbarMenuButton>
        <WindowToolbarMenuButton label="Affichage">
          <FloatingMenu>
            <MenuItem label="Barre d'état" />
            <MenuItem label="Volet d'exploration">
              <FloatingMenu>
                <MenuItem label="Rechercher" info="Ctrl+E" />
                <MenuItem label="Dossiers" />
              </FloatingMenu>
            </MenuItem>
            <MenuSeparator />
            <MenuItem label="Miniatures" />
            <MenuItem label="Mosaïques" />
            <MenuItem label="Icônes" />
            <MenuItem label="Liste" />
            <MenuItem label="Détails" />
            <MenuSeparator />
            <MenuItem label="Actualiser" />
          </FloatingMenu>
        </WindowToolbarMenuButton>
        <WindowToolbarMenuButton label="Favoris">
          <FloatingMenu>
            <MenuItem label="Ajouter aux Favoris..." />
            <MenuItem label="Organiser les Favoris..." />
          </FloatingMenu>
        </WindowToolbarMenuButton>
        <WindowToolbarMenuButton label="Outils">
          <FloatingMenu>
            <MenuItem label="Connecter un lecteur réseau..." />
            <MenuItem label="Déconnecter un lecteur réseau..." />
            <MenuSeparator />
            <MenuItem label="Options des dossiers..." />
          </FloatingMenu>
        </WindowToolbarMenuButton>
        <WindowToolbarMenuButton label="?">
          <FloatingMenu>
            <MenuItem label="Centre d'aide et de support" />
            <MenuSeparator />
            <MenuItem label="À propos de Windows" />
          </FloatingMenu>
        </WindowToolbarMenuButton>
        <img
          src={WindowToolbarWindowsIcon}
          className={styles.windowsToolbarBrand}
          alt="Windows icon"
        />
      </WindowToolbar>

      <WindowToolbar variant="gradient">
        <WindowToolbarButton icon={BackwardIcon} label="Précédente">
          <FloatingMenu>
            <MenuItem label="Poste de travail" />
          </FloatingMenu>
        </WindowToolbarButton>
        <WindowToolbarButton icon={ForwardIcon} />
        <WindowToolbarButton icon={UpIcon} />
        <MenuSeparator direction="vertical" />
        <WindowToolbarButton icon={SearchIcon} label="Rechercher" />
        <WindowToolbarButton icon={FoldersIcon} label="Dossiers" />
        <MenuSeparator direction="vertical" />
        <WindowToolbarButton icon={ViewsIcon}>
          <FloatingMenu>
            <MenuItem label="Miniatures" />
            <MenuItem label="Mosaïques" />
            <MenuItem label="Icônes" />
            <MenuItem label="Liste" />
            <MenuItem label="Détails" />
          </FloatingMenu>
        </WindowToolbarButton>
      </WindowToolbar>

      <WindowToolbar variant="gradient" lastToolbar className={styles.addressToolbar}>
        <div className={styles.addressToolbarRow}>
          <span className={styles.addressLabel}>Adresse</span>
          <div className={styles.addressFieldRow}>
            <div className={styles.addressInputShell}>
              <img src={MyComputerIcon} alt="" aria-hidden="true" className={styles.addressInputIcon} />
              <Input
                readOnly
                value="Poste de travail"
                dropdownOptions={['Poste de travail']}
                wrapperClassName={styles.addressInputWrapper}
                className={styles.addressInputField}
              />
            </div>
            <Button type="button" size="small" className={styles.addressOkButton}>
              OK
            </Button>
          </div>
        </div>
      </WindowToolbar>

      <div className={styles.explorerLayout}>
        <aside className={styles.sidebar}>
          <SidebarSection title="Gestion du système" tasks={SYSTEM_TASKS} />
          <SidebarSection title="Autres emplacements" tasks={OTHER_PLACES_TASKS} />

          <section className={styles.sidebarSection}>
            <header className={styles.sidebarSectionHeader}>
              <span>Détails</span>
              <button type="button" className={styles.sidebarCollapseButton} aria-label="Réduire la section" />
            </header>

            <div className={styles.detailsBlock}>
              <div className={styles.detailsTitle}>Disque local (E:)</div>
              <div className={styles.detailsText}>Disque local</div>
            </div>
          </section>
        </aside>

        <main className={styles.mainArea}>
          {STORAGE_GROUPS.map((group) => (
            <section key={group.title} className={styles.storageGroup}>
              <h3 className={styles.storageGroupTitle}>{group.title}</h3>
              <div className={styles.storageItemsGrid}>
                {group.items.map((item) => (
                  <button key={item.label} type="button" className={styles.storageItem}>
                    <img src={item.icon} alt="" aria-hidden="true" />
                    <div className={styles.storageItemText}>
                      <span className={`${styles.storageItemLabel} ${item.linkLike ? styles.linkLike : ''}`}>
                        {item.label}
                      </span>
                      {item.description && (
                        <span className={styles.storageItemDescription}>{item.description}</span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </section>
          ))}
        </main>
      </div>
    </>
  );
};
