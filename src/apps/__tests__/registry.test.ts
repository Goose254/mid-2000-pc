import { describe, expect, it } from 'vitest';
import {
  APP_REGISTRY,
  StartMenuSlot,
  findAppByCommand,
  findAppByExecutable,
  getAppById,
  getDesktopShortcuts,
  getStartMenuShortcut,
  getStartMenuShortcuts,
  parseExecutableName,
} from '../registry';

describe('contenu du registre', () => {
  it('liste chaque application une seule fois', () => {
    const ids = APP_REGISTRY.map((app) => app.id);
    expect(ids).toEqual(['explorer.exe', 'notepad.exe', 'taskmgr.exe', 'nusrmgr.cpl', 'winmine.exe']);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('donne à chaque application un nom, quatre icônes et un exécutable', () => {
    for (const app of APP_REGISTRY) {
      expect(app.name).not.toBe('');
      expect(Object.keys(app.icons).sort()).toEqual(['large', 'medium', 'small', 'xsmall']);
      for (const icon of Object.values(app.icons)) expect(icon).toEqual(expect.any(String));
      expect(app.executables.length).toBeGreaterThan(0);
    }
  });

  it("n'attribue jamais le même nom d'exécutable à deux applications", () => {
    const executables = APP_REGISTRY.flatMap((app) => app.executables);
    expect(new Set(executables).size).toBe(executables.length);
  });

  it('déclare les noms d\'exécutable en minuscules, le premier étant l\'identifiant', () => {
    for (const app of APP_REGISTRY) {
      expect(app.executables[0]).toBe(app.id);
      for (const executable of app.executables) expect(executable).toBe(executable.toLowerCase());
    }
  });

  it('retrouve une application par son identifiant', () => {
    expect(getAppById('taskmgr.exe')?.name).toBe('Gestionnaire des tâches de Windows');
    expect(getAppById('inconnu.exe')).toBeUndefined();
  });
});

describe('recherche par nom d\'exécutable (Exécuter)', () => {
  it('lance chaque application du registre par chacun de ses exécutables', () => {
    for (const app of APP_REGISTRY) {
      for (const executable of app.executables) {
        expect(findAppByExecutable(executable)?.id).toBe(app.id);
        expect(findAppByCommand(executable)?.id).toBe(app.id);
      }
    }
  });

  it('trouve le Bloc-notes et les Comptes d\'utilisateurs', () => {
    expect(findAppByCommand('notepad.exe')?.id).toBe('notepad.exe');
    expect(findAppByCommand('nusrmgr.cpl')?.id).toBe('nusrmgr.cpl');
  });

  it('accepte « control » comme alias des Comptes d\'utilisateurs', () => {
    expect(findAppByCommand('control')?.id).toBe('nusrmgr.cpl');
    expect(findAppByCommand('control.exe')?.id).toBe('nusrmgr.cpl');
    expect(findAppByCommand('control userpasswords')?.id).toBe('nusrmgr.cpl');
  });

  it('ignore la casse, comme Windows XP', () => {
    expect(findAppByExecutable('NOTEPAD.EXE')?.id).toBe('notepad.exe');
    expect(findAppByExecutable('Notepad')?.id).toBe('notepad.exe');
    expect(findAppByCommand('TaskMgr.Exe')?.id).toBe('taskmgr.exe');
    expect(findAppByCommand('NUSRMGR.CPL')?.id).toBe('nusrmgr.cpl');
    expect(findAppByCommand('WinMine')?.id).toBe('winmine.exe');
  });

  it('rend l\'extension .exe facultative, mais pas les autres extensions', () => {
    expect(findAppByExecutable('explorer')?.id).toBe('explorer.exe');
    expect(findAppByExecutable('nusrmgr')).toBeUndefined();
  });

  it('ignore les espaces, le chemin, les guillemets et les arguments', () => {
    expect(findAppByCommand('  notepad  ')?.id).toBe('notepad.exe');
    expect(findAppByCommand('C:\\WINDOWS\\system32\\notepad.exe')?.id).toBe('notepad.exe');
    expect(findAppByCommand('C:/WINDOWS/system32/taskmgr.exe')?.id).toBe('taskmgr.exe');
    expect(findAppByCommand('"C:\\Program Files\\winmine.exe" /s')?.id).toBe('winmine.exe');
    expect(findAppByCommand('notepad C:\\Mes documents\\Bienvenue.txt')?.id).toBe('notepad.exe');
  });

  it('ne trouve rien pour un nom inconnu (message « Windows ne trouve pas... »)', () => {
    expect(findAppByCommand('calc.exe')).toBeUndefined();
    expect(findAppByCommand('calc')).toBeUndefined();
    expect(findAppByCommand('notepad.exe.exe')).toBeUndefined();
    expect(findAppByCommand('notepadx')).toBeUndefined();
    expect(findAppByExecutable('')).toBeUndefined();
    expect(findAppByCommand('')).toBeUndefined();
    expect(findAppByCommand('   ')).toBeUndefined();
  });

  it('extrait le nom d\'exécutable d\'une ligne de commande', () => {
    expect(parseExecutableName('Notepad.EXE')).toBe('notepad.exe');
    expect(parseExecutableName('"C:\\Program Files\\App.exe" --flag')).toBe('app.exe');
    expect(parseExecutableName('control userpasswords')).toBe('control');
    expect(parseExecutableName('')).toBeNull();
    expect(parseExecutableName('C:\\')).toBeNull();
  });
});

describe('raccourcis', () => {
  it('fournit les icônes du bureau dans l\'ordre du registre', () => {
    expect(getDesktopShortcuts().map((shortcut) => [shortcut.id, shortcut.appId, shortcut.label])).toEqual([
      ['my-computer', 'explorer.exe', 'Poste de travail'],
      ['my-documents', 'explorer.exe', 'Mes Documents'],
      ['recycle-bin', 'explorer.exe', 'Corbeille'],
      ['task-manager', 'taskmgr.exe', 'Gestionnaire des tâches'],
      ['minesweeper', 'winmine.exe', 'Démineur'],
    ]);
  });

  it('donne un identifiant unique à chaque icône du bureau (clé de position)', () => {
    const ids = getDesktopShortcuts().map((shortcut) => shortcut.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('retombe sur le nom et l\'icône 32×32 de l\'application', () => {
    const minesweeper = getDesktopShortcuts().find((shortcut) => shortcut.id === 'minesweeper');
    const app = getAppById('winmine.exe');
    expect(minesweeper?.label).toBe(app?.name);
    expect(minesweeper?.icon).toBe(app?.icons.medium);
  });

  it('transmet l\'emplacement à ouvrir aux raccourcis de l\'Explorateur', () => {
    const byId = Object.fromEntries(getDesktopShortcuts().map((shortcut) => [shortcut.id, shortcut.args]));
    expect(byId['my-computer']).toEqual({ location: { kind: 'computer' } });
    expect(byId['my-documents']).toEqual({ location: { kind: 'folder', path: 'C:\\Mes documents' } });
    expect(byId['recycle-bin']).toEqual({ location: { kind: 'trash' } });
    expect(byId['task-manager']).toBeUndefined();
  });

  it('attribue chaque emplacement du menu Démarrer à une seule application', () => {
    const slots: StartMenuSlot[] = ['my-documents', 'my-pictures', 'my-music', 'my-computer', 'control-panel'];
    expect(getStartMenuShortcuts().map((shortcut) => shortcut.id).sort()).toEqual([...slots].sort());
    for (const slot of slots) expect(getStartMenuShortcut(slot)).toBeDefined();
  });

  it('ouvre les Comptes d\'utilisateurs depuis « Panneau de configuration »', () => {
    const controlPanel = getStartMenuShortcut('control-panel');
    expect(controlPanel?.appId).toBe('nusrmgr.cpl');
    expect(controlPanel?.label).toBe('Panneau de configuration');
    expect(getStartMenuShortcut('my-pictures')?.args).toEqual({
      location: { kind: 'folder', path: 'C:\\Mes documents\\Mes images' },
    });
  });
});
