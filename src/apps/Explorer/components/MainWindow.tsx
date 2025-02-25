import React, { useRef } from 'react';
import styles from './styles.module.scss';

import { WindowToolbar } from '@/components/atoms/WindowToolbar/WindowToolbar';
import { WindowToolbarMenuButton } from '@/components/atoms/WindowToolbarMenuButton/WindowToolbarMenuButton';
import { FloatingMenu } from '@/components/molecules/FloatingMenu/FloatingMenu';
import { MenuItem } from '@/components/atoms/MenuItem/MenuItem';
import { MenuSeparator } from '@/components/atoms/MenuSeparator/MenuSeparator';
import { WindowToolbarButton } from '@/components/atoms/WindowToolbarButton/WindowToolbarButton';
import { OverlayScrollbarsComponent, OverlayScrollbarsComponentRef } from 'overlayscrollbars-react';

import WindowToolbarWindowsIcon from '@/assets/explorer-toolbar-windows-icon.png';
import BackwardIcon from '@/assets/explorer-icons/back.png';
import FoldersIcon from '@/assets/explorer-icons/folders.png';
import ForwardIcon from '@/assets/explorer-icons/forward.png';
import SearchIcon from '@/assets/explorer-icons/search.png';
import UpIcon from '@/assets/explorer-icons/up.png';
import ViewsIcon from '@/assets/explorer-icons/views.png';

export const ExplorerMainWindow: React.FC = () => {
  const osRef = useRef<OverlayScrollbarsComponentRef>(null);

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
            <MenuItem label="Annuler Déplacer" info="Ctrl+Z"/>
            <MenuSeparator />
            <MenuItem label="Couper" info="Ctrl+X" aria-disabled/>
            <MenuItem label="Copier" info="Ctrl+C" aria-disabled/>
            <MenuItem label="Coller" info="Ctrl+V" aria-disabled/>
            <MenuItem label="Coller le raccourci" aria-disabled/>
            <MenuSeparator />
            <MenuItem label="Copier dans un dossier..." aria-disabled/>
            <MenuItem label="Déplacer vers un dossier..." aria-disabled/>
            <MenuSeparator />
            <MenuItem label="Sélectionner tout" info="Ctrl+A"/>
            <MenuItem label="Inverser la sélection"/>
          </FloatingMenu>
        </WindowToolbarMenuButton>
        <WindowToolbarMenuButton label="Affichage">
          <FloatingMenu>
            <MenuItem label="Barre d'outils">
              <FloatingMenu>
                <MenuItem label="Boutons standard"/>
                <MenuItem label="Barre d'adresses"/>
                <MenuItem label="Liens"/>
                <MenuSeparator />
                <MenuItem label="Verouiller les barres d'outils"/>
                <MenuItem label="Personnaliser..."/>
              </FloatingMenu>
            </MenuItem>
            <MenuItem label="Barre d'état"/>
            <MenuItem label="Volet d'exploration">
              <FloatingMenu>
                <MenuItem label="Rechercher" info="Ctrl+E"/>
                <MenuItem label="Favoris" info="Ctrl+I"/>
                <MenuItem label="Historique" info="Ctrl+H"/>
                <MenuItem label="Dossiers"/>
                <MenuSeparator />
                <MenuItem label="Astuce du jour"/>
              </FloatingMenu>
            </MenuItem>
            <MenuSeparator />
            <MenuItem label="Miniatures"/>
            <MenuItem label="Mosaïques"/>
            <MenuItem label="Icônes"/>
            <MenuItem label="Liste"/>
            <MenuItem label="Détails"/>
            <MenuSeparator />
            <MenuItem label="Réorganiser les icônes par">
              <FloatingMenu>
                <MenuItem label="Nom"/>
                <MenuItem label="Type"/>
                <MenuItem label="Taille totale"/>
                <MenuItem label="Espace libre"/>
                <MenuItem label="Commentaires"/>
                <MenuSeparator />
                <MenuItem label="Afficher par groupe"/>
                <MenuItem label="Réorganisation automatique"/>
                <MenuItem label="Aligner sur la grille"/>
              </FloatingMenu>
            </MenuItem>
            <MenuSeparator />
            <MenuItem label="Choisir les détails..."/>
            <MenuItem label="Atteindre">
              <FloatingMenu>
                <MenuItem label="Précédente" info="Alt+Flèche gauche" aria-disabled/>
                <MenuItem label="Suivante" info="Alt+Flèche droite" aria-disabled/>
                <MenuItem label="Dossier parent"/>
                <MenuSeparator />
                <MenuItem label="Page de démarrage" info="Alt+Origine"/>
                <MenuSeparator />
                <MenuItem label="Poste de travail"/>
              </FloatingMenu>
            </MenuItem>
            <MenuItem label="Actualiser"/>
          </FloatingMenu>
        </WindowToolbarMenuButton>
        <WindowToolbarMenuButton label="Favoris">
          <FloatingMenu>
            <MenuItem label="Ajouter aux Favoris..."/>
            <MenuItem label="Organiser les Favoris..."/>
            <MenuSeparator />
            <MenuItem label="Liens">
              <FloatingMenu>
                <MenuItem label="Hotmail"/>
                <MenuItem label="Personnaliser les liens"/>
                <MenuItem label="Windows"/>
                <MenuItem label="Windows Media"/>
              </FloatingMenu>
            </MenuItem>
            <MenuItem label="Guide des stations de radio"/>
            <MenuItem label="MSN.com"/>
          </FloatingMenu>
        </WindowToolbarMenuButton>
        <WindowToolbarMenuButton label="Outils">
          <FloatingMenu>
            <MenuItem label="Connecter un lecteur réseau..."/>
            <MenuItem label="Déconnecter un lecteur réseau..."/>
            <MenuItem label="Synchroniser..."/>
            <MenuSeparator />
            <MenuItem label="Options des dossiers..."/>
          </FloatingMenu>
        </WindowToolbarMenuButton>
        <WindowToolbarMenuButton label="?">
          <FloatingMenu>
            <MenuItem label="Centre d'aide et de support"/>
            <MenuSeparator />
            <MenuItem label="Cette copie de Windows est-elle légale ?"/>
            <MenuItem label="À propos de Windows"/>
          </FloatingMenu>
        </WindowToolbarMenuButton>
        <img
          src={WindowToolbarWindowsIcon}
          style={{ marginLeft: 'auto', borderLeft: '1px solid #aca899' }}
          alt="Windows icon"
        />
      </WindowToolbar>

      <WindowToolbar variant="gradient">
        <WindowToolbarButton icon={BackwardIcon} label="Précédente">
          <FloatingMenu>
            <MenuItem label="Poste de travail"/>
          </FloatingMenu>
        </WindowToolbarButton>
        <WindowToolbarButton icon={ForwardIcon}>
          <FloatingMenu>
            <MenuItem label="Mes documents"/>
          </FloatingMenu>
        </WindowToolbarButton>
        <WindowToolbarButton icon={UpIcon}></WindowToolbarButton>
        <MenuSeparator direction="vertical"/>
        <WindowToolbarButton icon={SearchIcon} label="Rechercher"></WindowToolbarButton>
        <WindowToolbarButton icon={FoldersIcon} label="Dossiers"></WindowToolbarButton>
        <MenuSeparator direction="vertical"/>
        <WindowToolbarButton icon={ViewsIcon}>
          <FloatingMenu>
            <MenuItem label="Miniatures"/>
            <MenuItem label="Mosaïques"/>
            <MenuItem label="Icônes"/>
            <MenuItem label="Liste"/>
            <MenuItem label="Détails"/>
          </FloatingMenu>
        </WindowToolbarButton>
      </WindowToolbar>
      <WindowToolbar variant="gradient"><></></WindowToolbar>

      <OverlayScrollbarsComponent
        className="overlayscrollbars-react"
        ref={osRef}
        options={{ scrollbars: { theme: "os-theme-dark", autoHide: "never", clickScroll: true } }}
        style={{ backgroundColor: 'white' }}
        defer
      >
        <div>
          {/* Du contenu répétitif pour la démo */}
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aliquam ornare ligula molestie malesuada consequat. In laoreet nisl sit amet libero fermentum vestibulum. Mauris tincidunt posuere augue ac rutrum. Proin lobortis tristique sapien a rutrum. Morbi faucibus tincidunt risus, eu lobortis libero. Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas. Nam iaculis eu elit eget feugiat. Morbi elit urna, cursus non porttitor quis, facilisis quis tortor. Sed aliquet eros nulla, nec volutpat felis mattis a. Ut mollis neque nibh, vitae ullamcorper arcu malesuada et. Duis a semper justo. Vivamus efficitur neque velit, et mollis arcu consequat in.
          <br/><br/>
          Aliquam erat volutpat. Donec at aliquet purus. Aliquam non leo sed felis bibendum consectetur. Cras sagittis id nisi quis commodo. Pellentesque a blandit elit. Praesent scelerisque suscipit tellus, ut dignissim nibh vestibulum vitae. Vestibulum sit amet blandit dui. In hac habitasse platea dictumst. Cras venenatis massa purus, ac eleifend diam pellentesque sit amet. Aliquam egestas turpis ligula, vel congue orci condimentum nec. Vivamus nec volutpat metus. Nulla vehicula nibh finibus dapibus congue. Maecenas augue diam, vulputate non dapibus nec, mattis eu lectus. Sed hendrerit gravida mi. Vestibulum tincidunt ornare mi a ultrices.
          <br/><br/>
          Curabitur et enim ac diam auctor consectetur. Suspendisse placerat sed ex non maximus. In hac habitasse platea dictumst. Vivamus molestie ante libero, lacinia porta erat ullamcorper facilisis. Quisque auctor gravida consectetur. Vestibulum vitae turpis condimentum, facilisis leo at, rhoncus lacus. Praesent pellentesque urna ac justo rhoncus placerat. Ut ac dolor at massa pharetra sagittis eget vel tellus. Aliquam sit amet dignissim lacus. Fusce mollis aliquam augue eu sagittis. Morbi condimentum, ante nec ullamcorper porttitor, velit purus finibus diam, quis sollicitudin eros nisl in eros. Donec tellus metus, ullamcorper ac tincidunt aliquam, gravida a libero. Sed quis mi turpis. Praesent nec magna quis dui volutpat laoreet sed sollicitudin enim. Suspendisse sit amet tellus ut mauris pellentesque vestibulum quis dictum urna. Pellentesque nec convallis ligula, quis rutrum massa.
          <br/><br/>
          Morbi ac lacus lacus. Praesent vehicula nisl porttitor efficitur pellentesque. Suspendisse finibus, massa faucibus tristique laoreet, ex nulla lobortis dolor, ut blandit quam elit ut nibh. Aliquam sit amet suscipit ligula, at gravida odio. Donec quis tellus auctor, lobortis est eget, feugiat elit. Phasellus tempus molestie luctus. Pellentesque sodales arcu non iaculis faucibus. Proin et lectus urna. Integer egestas arcu arcu, sed varius metus lobortis ac.
          <br/><br/>
          Morbi elementum orci quis risus auctor elementum. Nunc sit amet purus et eros volutpat dapibus vitae id lectus. Nulla eu quam eu erat sodales ornare eu in enim. Proin nec odio auctor justo euismod rhoncus. Nulla sed dui ornare, elementum felis vitae, euismod purus. Phasellus ornare vitae felis nec lacinia. Suspendisse sagittis dolor in urna placerat fermentum. Etiam tempus sed neque sed tempor. Duis vitae ullamcorper mauris. Fusce rutrum sed urna sit amet rutrum. 
        </div>
      </OverlayScrollbarsComponent>
    </>
  );
};
