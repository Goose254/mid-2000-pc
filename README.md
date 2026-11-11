# Mid-2000 PC

Un PC de 2004 sous Windows XP, reproduit dans le navigateur : le BIOS qui fait
son POST, l'écran de boot Windows XP, l'écran de bienvenue, puis un bureau
complet avec ses fenêtres, sa barre des tâches et son menu Démarrer.

**Démo en ligne : [https://mid-2000-pc.douay.me/](https://mid-2000-pc.douay.me/)**

![Capture d'écran](./screenshot.png)

## Fonctionnalités

- **Séquence de démarrage complète** : écran BIOS avec POST et test mémoire
  (beep inclus), écran de boot Windows XP, écran de bienvenue avec le son de
  démarrage.
- **BIOS Setup** : accessible avec la touche `Suppr` pendant le POST, navigable
  au clavier.
- **Bureau Windows XP** : icônes, fond d'écran, barre des tâches, menu
  Démarrer, boîte de dialogue Exécuter, fenêtres déplaçables et
  redimensionnables (réduire / agrandir / fermer).
- **Explorateur** : Poste de travail, navigation dans les dossiers, plusieurs
  modes d'affichage.
- **Démineur** : le jeu culte, fidèle à l'original.
- **Gestionnaire des tâches** : liste des processus et icône animée dans la
  zone de notification.
- **Arrêt du système** : mise en veille, arrêt et redémarrage (qui relance la
  séquence de boot).
- **Internationalisation** : interface disponible en français et en anglais
  (détection automatique de la langue du navigateur).

## Stack technique

- [React 18](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- [Vite 6](https://vitejs.dev/)
- [Zustand](https://zustand-demo.pmnd.rs/) pour l'état global
- SCSS Modules
- [i18next](https://www.i18next.com/) / react-i18next (fr / en)
- Canvas 2D pour les écrans BIOS et de boot

## Installation

```bash
# Installer les dépendances
npm install

# Lancer le serveur de développement
npm run dev

# Vérifier le code
npm run lint

# Construire pour la production
npm run build

# Prévisualiser le build de production
npm run preview
```

## Crédits

- Développé par [Vincent Douay](https://douay.me).
- Le Démineur est l'œuvre de mon frère [Florian Douay](https://florian.douay.me).

## Disclaimer

Ce projet est un hommage nostalgique à Windows XP, réalisé pour le plaisir. Il
n'est **ni affilié à, ni sponsorisé, ni approuvé par Microsoft Corporation**.
Windows XP ainsi que ses éléments visuels et sonores (icônes, fond d'écran
Bliss, sons système, écrans de démarrage) sont des marques et des œuvres de
Microsoft Corporation, utilisés ici uniquement à titre d'hommage/parodie. Le
code source du projet est publié sous [licence MIT](LICENSE) ; les assets
évoquant Windows XP en sont exclus.
