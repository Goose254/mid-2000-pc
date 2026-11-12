import { beforeEach, describe, expect, it, vi } from 'vitest';
import { selectDesktopWindows, selectTaskbarWindows, useWindowsStore } from '../windowsStore';
import { useAppsStore } from '../appsStore';
import type { WindowInfo } from '../../types/window';

const store = () => useWindowsStore.getState();
const win = (id: string): WindowInfo => {
  const found = store().windows.find((w) => w.id === id);
  if (!found) throw new Error(`Fenêtre ${id} introuvable`);
  return found;
};
const ids = (windows: WindowInfo[] = store().windows) => windows.map((w) => w.id);
const activeIds = () => ids(store().windows.filter((w) => w.isActive));
/** Identifiants des fenêtres, de celle du fond à celle du dessus. */
const stack = () => ids([...store().windows].sort((a, b) => a.zIndex - b.zIndex));

/**
 * La mémoire de placement est tenue par application et survit aux tests : on
 * donne à chaque test ses propres identifiants d'application.
 */
let testIndex = 0;
let app: (name: string) => string;

type OpenOptions = Parameters<ReturnType<typeof store>['openWindow']>[5];

/** Ouvre la fenêtre `id` d'une application ; par défaut une app par fenêtre. */
const open = (id: string, options?: OpenOptions, appName: string = id) => {
  store().openWindow(id, `${app(appName)}-1`, `Titre ${id}`, null, undefined, options);
};

/** Réduit la fenêtre comme le fait l'interface : action puis fin d'animation. */
const minimize = (id: string) => {
  store().toggleMinimizeWindow(id, true);
  store().completeMinimizeAnimation(id);
};
const maximize = (id: string) => {
  store().toggleMaximizeWindow(id);
  store().completeMaximizeAnimation(id);
};

beforeEach(() => {
  testIndex++;
  app = (name) => `test${testIndex}-${name}.exe`;
  useWindowsStore.setState({ windows: [] });
});

describe('ouverture', () => {
  it('ouvre une fenêtre active avec la position, la taille et les boutons par défaut', () => {
    open('a');

    expect(win('a')).toMatchObject({
      id: 'a',
      appPid: `${app('a')}-1`,
      title: 'Titre a',
      position: { x: 100, y: 100 },
      size: { width: 600, height: 400 },
      isActive: true,
      isMinimized: false,
      isMaximized: false,
      fixedSize: false,
      zIndex: 1,
      animationState: 'none',
    });
    expect(win('a').buttons).toMatchObject({
      help: { visible: false, enabled: false },
      minimize: { visible: true, enabled: true },
      maximize: { visible: true, enabled: true },
      close: { visible: true, enabled: true },
    });
  });

  it('applique la position, la taille et les boutons demandés', () => {
    open('dialog', {
      position: { x: 3, y: 548 },
      size: { width: 363, height: 186 },
      fixedSize: true,
      buttons: { help: { visible: true, enabled: true }, minimize: { visible: false, enabled: false } },
    });

    expect(win('dialog')).toMatchObject({
      position: { x: 3, y: 548 },
      size: { width: 363, height: 186 },
      fixedSize: true,
    });
    expect(win('dialog').buttons).toMatchObject({
      help: { visible: true, enabled: true },
      minimize: { visible: false, enabled: false },
      close: { visible: true, enabled: true },
    });
  });

  it('empile chaque nouvelle fenêtre au-dessus des autres', () => {
    open('a');
    open('b');
    open('c');

    expect(stack()).toEqual(['a', 'b', 'c']);
    expect(win('c').zIndex).toBe(3);
  });

  it('rend la nouvelle fenêtre seule active', () => {
    open('a');
    open('b');

    expect(activeIds()).toEqual(['b']);
  });

  it('décale en cascade une fenêtre qui tomberait exactement sur une autre', () => {
    open('a');
    open('b');
    open('c');

    expect(win('a').position).toEqual({ x: 100, y: 100 });
    expect(win('b').position).toEqual({ x: 130, y: 130 });
    expect(win('c').position).toEqual({ x: 160, y: 160 });
  });

  it('ignore les fenêtres réduites ou agrandies pour la cascade', () => {
    open('a');
    minimize('a');
    open('b');
    maximize('b');
    open('c');

    expect(win('c').position).toEqual({ x: 100, y: 100 });
  });

  it('ne duplique pas une fenêtre déjà ouverte : elle revient au premier plan', () => {
    open('a');
    open('b');
    minimize('a');

    open('a');

    expect(ids()).toEqual(['a', 'b']);
    expect(win('a')).toMatchObject({ isMinimized: false, isActive: true, animationState: 'restoring' });
    expect(stack()).toEqual(['b', 'a']);
    expect(activeIds()).toEqual(['a']);
  });
});

describe('focus et ordre d\'empilement', () => {
  beforeEach(() => {
    open('a');
    open('b');
    open('c');
  });

  it('amène une fenêtre au premier plan en conservant l\'ordre des autres', () => {
    store().bringToFront('a');

    expect(stack()).toEqual(['b', 'c', 'a']);
    expect(store().windows.map((w) => w.zIndex).sort()).toEqual([1, 2, 3]);
    expect(activeIds()).toEqual(['a']);
  });

  it('ne déplace que les fenêtres situées au-dessus de celle qui monte', () => {
    store().bringToFront('b');

    expect(win('a').zIndex).toBe(1);
    expect(stack()).toEqual(['a', 'c', 'b']);
  });

  it('active la fenêtre déjà au premier plan sans toucher à l\'empilement', () => {
    store().setWindowInactive('c');
    expect(activeIds()).toEqual([]);

    store().bringToFront('c');

    expect(stack()).toEqual(['a', 'b', 'c']);
    expect(activeIds()).toEqual(['c']);
  });

  it('ignore un identifiant inconnu', () => {
    const before = store().windows;
    store().bringToFront('inconnue');

    expect(store().windows).toBe(before);
  });

  it('désactive une fenêtre sans changer son rang (clic sur le bureau)', () => {
    store().setWindowInactive('c');

    expect(win('c')).toMatchObject({ isActive: false, zIndex: 3 });
  });
});

describe('réduction et restauration', () => {
  it('réduit la fenêtre active en deux temps : animation, puis état réduit', () => {
    open('a');

    store().toggleMinimizeWindow('a');
    expect(win('a')).toMatchObject({ animationState: 'minimizing', isMinimized: false, isActive: false });

    store().completeMinimizeAnimation('a');
    expect(win('a')).toMatchObject({ animationState: 'none', isMinimized: true, isActive: false });
  });

  it('restaure une fenêtre réduite, au premier plan et active', () => {
    open('a');
    open('b');
    minimize('a');

    store().toggleMinimizeWindow('a');
    expect(win('a')).toMatchObject({ animationState: 'restoring', isMinimized: false, isActive: true });
    expect(stack()).toEqual(['b', 'a']);
    expect(activeIds()).toEqual(['a']);

    store().completeRestoreAnimation('a');
    expect(win('a').animationState).toBe('none');
  });

  it('conserve la position et la taille à travers une réduction', () => {
    open('a', { position: { x: 40, y: 50 }, size: { width: 300, height: 200 } });
    minimize('a');
    store().toggleMinimizeWindow('a');
    store().completeRestoreAnimation('a');

    expect(win('a')).toMatchObject({ position: { x: 40, y: 50 }, size: { width: 300, height: 200 } });
  });

  it('amène au premier plan, sans la réduire, une fenêtre visible mais inactive', () => {
    open('a');
    open('b');

    store().toggleMinimizeWindow('a');

    expect(win('a')).toMatchObject({ isMinimized: false, animationState: 'none', isActive: true });
    expect(stack()).toEqual(['b', 'a']);
  });

  it('réduit une fenêtre inactive quand on le force (menu « Réduire »)', () => {
    open('a');
    open('b');

    store().toggleMinimizeWindow('a', true);

    expect(win('a').animationState).toBe('minimizing');
    expect(activeIds()).toEqual(['b']);
  });

  it('ne réduit jamais une fenêtre sans bouton Réduire', () => {
    open('dialog', { buttons: { minimize: { visible: false, enabled: false } } });

    store().toggleMinimizeWindow('dialog');
    store().toggleMinimizeWindow('dialog', true);

    expect(win('dialog')).toMatchObject({ isMinimized: false, animationState: 'none', isActive: true });
  });

  it('donne le focus à la fenêtre visible du dessus quand la fenêtre active est réduite', () => {
    open('a');
    open('b');
    open('c');

    store().toggleMinimizeWindow('c');

    expect(activeIds()).toEqual(['b']);
  });

  it('ne laisse aucune fenêtre active quand la dernière visible est réduite', () => {
    open('a');
    minimize('a');
    open('b');

    store().toggleMinimizeWindow('b');

    expect(activeIds()).toEqual([]);
  });

  it('ignore un identifiant inconnu', () => {
    open('a');
    const before = store().windows;

    store().toggleMinimizeWindow('inconnue');

    expect(store().windows).toBe(before);
  });
});

describe('agrandissement et restauration', () => {
  const geometry = { position: { x: 40, y: 50 }, size: { width: 300, height: 200 } };

  it('agrandit en deux temps en mémorisant la géométrie de départ', () => {
    open('a', geometry);

    store().toggleMaximizeWindow('a');
    expect(win('a')).toMatchObject({
      animationState: 'maximizing',
      isMaximized: false,
      preMaximizePosition: geometry.position,
      preMaximizeSize: geometry.size,
    });

    store().completeMaximizeAnimation('a');
    expect(win('a')).toMatchObject({ animationState: 'none', isMaximized: true });
  });

  it('restaure la géométrie mémorisée', () => {
    open('a', geometry);
    maximize('a');

    store().toggleMaximizeWindow('a');
    expect(win('a')).toMatchObject({ animationState: 'unmaximizing', isMaximized: true });

    store().completeUnmaximizeAnimation('a');
    expect(win('a')).toMatchObject({ animationState: 'none', isMaximized: false, ...geometry });
  });

  it('mémorise la géométrie du moment, pas celle de l\'ouverture', () => {
    open('a', geometry);
    store().setWindowPosition('a', { x: 200, y: 220 });
    store().setWindowSize('a', { width: 500, height: 320 });

    maximize('a');

    expect(win('a')).toMatchObject({
      preMaximizePosition: { x: 200, y: 220 },
      preMaximizeSize: { width: 500, height: 320 },
    });
  });

  it('reste agrandie à travers une réduction', () => {
    open('a', geometry);
    maximize('a');
    minimize('a');
    store().toggleMinimizeWindow('a');
    store().completeRestoreAnimation('a');

    expect(win('a')).toMatchObject({ isMaximized: true, isMinimized: false, preMaximizeSize: geometry.size });
  });

  it('ignore un identifiant inconnu', () => {
    open('a');
    const before = store().windows;

    store().toggleMaximizeWindow('inconnue');

    expect(store().windows).toBe(before);
  });
});

describe('déplacement et redimensionnement', () => {
  it('déplace et redimensionne la seule fenêtre visée', () => {
    open('a');
    open('b');
    const b = win('b');

    store().setWindowPosition('a', { x: 12, y: 34 });
    store().setWindowSize('a', { width: 640, height: 480 });

    expect(win('a')).toMatchObject({ position: { x: 12, y: 34 }, size: { width: 640, height: 480 } });
    expect(win('b')).toBe(b);
  });

  it('ne change ni le focus ni l\'empilement', () => {
    open('a');
    open('b');

    store().setWindowPosition('a', { x: 0, y: 0 });
    store().setWindowSize('a', { width: 700, height: 500 });

    expect(stack()).toEqual(['a', 'b']);
    expect(activeIds()).toEqual(['b']);
  });

  it('laisse sortir une fenêtre de l\'écran (comme Windows XP)', () => {
    open('a');

    store().setWindowPosition('a', { x: -250, y: 900 });

    expect(win('a').position).toEqual({ x: -250, y: 900 });
  });

  it('met à jour une fenêtre par fusion partielle', () => {
    open('a');

    store().updateWindow('a', { title: 'Nouveau titre' });

    expect(win('a')).toMatchObject({ title: 'Nouveau titre', position: { x: 100, y: 100 }, isActive: true });
  });
});

describe('fermeture', () => {
  it('retire la fenêtre sans toucher au rang des autres', () => {
    open('a');
    open('b');
    open('c');

    store().closeWindow('b');

    expect(ids()).toEqual(['a', 'c']);
    expect(win('a').zIndex).toBe(1);
    expect(win('c').zIndex).toBe(3);
  });

  it('donne le focus à la fenêtre visible du dessus quand la fenêtre active est fermée', () => {
    open('a');
    open('b');
    open('c');
    store().bringToFront('a');

    store().closeWindow('a');

    expect(stack()).toEqual(['b', 'c']);
    expect(activeIds()).toEqual(['c']);
  });

  it('ne donne pas le focus à une fenêtre réduite', () => {
    open('a');
    open('b');
    minimize('b');
    open('c');

    store().closeWindow('c');

    expect(activeIds()).toEqual(['a']);
    expect(win('b')).toMatchObject({ isMinimized: true, isActive: false });
  });

  it('ne change pas le focus quand on ferme une fenêtre inactive', () => {
    open('a');
    open('b');
    open('c');

    store().closeWindow('a');

    expect(activeIds()).toEqual(['c']);
  });

  it('laisse le bureau sans fenêtre active après la dernière fermeture', () => {
    open('a');

    store().closeWindow('a');

    expect(store().windows).toEqual([]);
  });

  it('ignore un identifiant inconnu', () => {
    open('a');

    store().closeWindow('inconnue');

    expect(ids()).toEqual(['a']);
    expect(activeIds()).toEqual(['a']);
  });

  it('termine l\'instance de l\'application quand sa dernière fenêtre se ferme', () => {
    const killInstance = vi.fn();
    const pid = `${app('multi')}-1`;
    useAppsStore.setState((state) => ({
      instances: [{ pid, appId: app('multi'), control: { killInstance } }, ...state.instances],
    }));
    open('main', undefined, 'multi');
    open('dialog', undefined, 'multi');

    store().closeWindow('dialog');
    expect(killInstance).not.toHaveBeenCalled();
    expect(useAppsStore.getState().instances.some((instance) => instance.pid === pid)).toBe(true);

    store().closeWindow('main');
    expect(killInstance).toHaveBeenCalledOnce();
    expect(useAppsStore.getState().instances.some((instance) => instance.pid === pid)).toBe(false);
  });
});

describe('mémoire de placement par application', () => {
  it('rouvre une application là où sa dernière fenêtre a été fermée', () => {
    open('a', { position: { x: 40, y: 50 }, size: { width: 300, height: 200 } });
    store().setWindowPosition('a', { x: 222, y: 111 });
    store().setWindowSize('a', { width: 512, height: 384 });
    store().closeWindow('a');

    // Deuxième instance de la même application (pid différent).
    store().openWindow('a2', `${app('a')}-2`, 'Titre', null, undefined, {
      position: { x: 40, y: 50 },
      size: { width: 300, height: 200 },
    });

    expect(win('a2')).toMatchObject({ position: { x: 222, y: 111 }, size: { width: 512, height: 384 } });
  });

  it('retient la géométrie d\'avant agrandissement pour une fenêtre fermée agrandie', () => {
    open('a', { position: { x: 40, y: 50 }, size: { width: 300, height: 200 } });
    maximize('a');
    store().closeWindow('a');

    store().openWindow('a2', `${app('a')}-2`, 'Titre', null);

    expect(win('a2')).toMatchObject({
      position: { x: 40, y: 50 },
      size: { width: 300, height: 200 },
      isMaximized: false,
    });
  });

  it('ne partage pas la mémoire entre applications', () => {
    open('a');
    store().setWindowPosition('a', { x: 300, y: 300 });
    store().closeWindow('a');

    open('b');

    expect(win('b').position).toEqual({ x: 100, y: 100 });
  });

  it('décale en cascade la deuxième instance ouverte au même endroit', () => {
    open('a');
    store().setWindowPosition('a', { x: 300, y: 300 });
    store().closeWindow('a');

    store().openWindow('a2', `${app('a')}-2`, 'Titre', null);
    store().openWindow('a3', `${app('a')}-3`, 'Titre', null);

    expect(win('a2').position).toEqual({ x: 300, y: 300 });
    expect(win('a3').position).toEqual({ x: 330, y: 330 });
  });
});

describe('sélecteurs de la barre des tâches et du bureau', () => {
  beforeEach(() => {
    open('a');
    open('dialog', { buttons: { minimize: { visible: false, enabled: false } } });
    open('b');
  });

  it('donne un bouton de barre des tâches aux seules fenêtres réductibles', () => {
    expect(ids(selectTaskbarWindows(store().windows))).toEqual(['a', 'b']);
  });

  it('écarte une fenêtre dont le bouton Réduire est visible mais désactivé', () => {
    open('grise', { buttons: { minimize: { visible: true, enabled: false } } });

    expect(ids(selectTaskbarWindows(store().windows))).toEqual(['a', 'b']);
  });

  it('garde les boutons dans l\'ordre d\'ouverture, quel que soit l\'empilement', () => {
    store().bringToFront('a');

    expect(ids(selectTaskbarWindows(store().windows))).toEqual(['a', 'b']);
  });

  it('garde le bouton d\'une fenêtre réduite, mais la retire du bureau', () => {
    minimize('a');

    expect(ids(selectTaskbarWindows(store().windows))).toEqual(['a', 'b']);
    expect(ids(selectDesktopWindows(store().windows))).toEqual(['dialog', 'b']);
  });

  it('affiche encore sur le bureau une fenêtre en cours de réduction (animation)', () => {
    store().toggleMinimizeWindow('b');

    expect(ids(selectDesktopWindows(store().windows))).toEqual(['a', 'dialog', 'b']);
  });

  it('signale la fenêtre active au bouton correspondant', () => {
    const active = selectTaskbarWindows(store().windows).filter((w) => w.isActive);

    expect(ids(active)).toEqual(['b']);
  });
});
