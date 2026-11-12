/**
 * Emplacements de l'Explorateur : types et constantes, sans aucune dépendance.
 *
 * Ce module est volontairement minuscule : le registre des applications
 * (`src/apps/registry.ts`) s'en sert pour décrire les raccourcis du bureau et
 * du menu Démarrer (« Mes documents », « Corbeille »...) sans charger le reste
 * de l'Explorateur. Tout le reste du modèle vit dans `model.ts`, qui réexporte
 * ces définitions.
 */

/** Un emplacement navigable de l'Explorateur. */
export type Location =
  | { kind: 'computer' } // « Poste de travail » (racine virtuelle : les lecteurs)
  | { kind: 'folder'; path: string } // un dossier réel du lecteur C:
  | { kind: 'trash' }; // la Corbeille (liste `trash` du store FS)

export const COMPUTER: Location = { kind: 'computer' };
export const TRASH: Location = { kind: 'trash' };

/** Chemins spéciaux reconnus (icônes + libellés dédiés). */
export const SPECIAL_PATHS = {
  myDocuments: 'C:\\Mes documents',
  myPictures: 'C:\\Mes documents\\Mes images',
  myMusic: 'C:\\Mes documents\\Ma musique',
  favoris: 'C:\\Documents and Settings\\Utilisateur\\Favoris',
  sharedDocuments: 'C:\\Documents and Settings\\All Users',
} as const;

/** Arguments de lancement de l'Explorateur (`explorer.exe`). */
export interface ExplorerLaunchArgs {
  /** Emplacement affiché à l'ouverture ; « Poste de travail » par défaut. */
  location?: Location;
}
