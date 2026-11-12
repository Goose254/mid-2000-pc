import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { AppDefinition } from '@/apps/registry';
import type { AppImplementation } from '@/common/types/appTemplate';

/**
 * Le registre réel charge de vraies applications (composants React, styles) :
 * on le remplace ici par deux applications factices pour ne tester que le
 * lancement à la demande lui-même.
 */
const { definitions, initCalls, loads } = vi.hoisted(() => ({
  definitions: [] as AppDefinition[],
  initCalls: [] as { appName: string; pid: string; args: unknown }[],
  loads: { count: 0, fail: false },
}));

vi.mock('@/apps/registry', () => ({
  getAppById: (id: string) => definitions.find((app) => app.id === id),
}));

import { useAppsStore } from '../appsStore';

const icons = { large: 'l.png', medium: 'm.png', small: 's.png', xsmall: 'xs.png' };

const fakeImplementation: AppImplementation<never, unknown> = {
  MainWindow: () => null,
  init: function (pid, args) {
    initCalls.push({ appName: this.name, pid, args });
    return { killInstance: () => {} };
  },
};

const fakeApp = (id: string, multiInstance: boolean): AppDefinition => ({
  id,
  executables: [id],
  name: `Application ${id}`,
  icons,
  multiInstance,
  load: () => {
    loads.count++;
    return loads.fail
      ? Promise.reject(new Error('fichier introuvable'))
      : Promise.resolve(fakeImplementation);
  },
});

/** Laisse aboutir le chargement (promesse) déclenché par `launchApp`. */
const loaded = () => new Promise((resolve) => setTimeout(resolve, 0));

const apps = () => useAppsStore.getState();
const instancesOf = (appId: string) => apps().getInstancesByAppId(appId);

beforeEach(() => {
  definitions.length = 0;
  definitions.push(fakeApp('multi.exe', true), fakeApp('single.exe', false));
  initCalls.length = 0;
  loads.count = 0;
  loads.fail = false;
  useAppsStore.setState({
    instances: apps().instances.filter((instance) => !/^(multi|single)\.exe/.test(instance.appId)),
    pendingLaunches: 0,
  });
});

describe('launchApp', () => {
  it('refuse un identifiant absent du registre', () => {
    expect(apps().launchApp('inconnu.exe')).toBe(false);
    expect(apps().pendingLaunches).toBe(0);
    expect(loads.count).toBe(0);
  });

  it("n'ouvre rien tant que le code de l'application n'est pas chargé", async () => {
    expect(apps().launchApp('multi.exe')).toBe(true);

    // Chargement en cours : le bureau affiche le curseur d'attente, aucune
    // instance (donc aucune fenêtre) n'existe encore.
    expect(apps().pendingLaunches).toBe(1);
    expect(instancesOf('multi.exe')).toHaveLength(0);
    expect(initCalls).toHaveLength(0);

    await loaded();

    expect(apps().pendingLaunches).toBe(0);
    expect(instancesOf('multi.exe')).toHaveLength(1);
    expect(initCalls).toHaveLength(1);
  });

  it("démarre l'application avec la fiche du registre et les arguments de lancement", async () => {
    apps().launchApp('multi.exe', { path: 'C:\\Mes documents\\Bienvenue.txt' });
    await loaded();

    expect(initCalls[0].appName).toBe('Application multi.exe');
    expect(initCalls[0].args).toEqual({ path: 'C:\\Mes documents\\Bienvenue.txt' });
    expect(instancesOf('multi.exe')[0].pid).toBe(initCalls[0].pid);
  });

  it('crée une instance par lancement pour une application multi-instances', async () => {
    apps().launchApp('multi.exe');
    apps().launchApp('multi.exe');
    expect(apps().pendingLaunches).toBe(2);
    await loaded();

    expect(instancesOf('multi.exe')).toHaveLength(2);
    expect(apps().pendingLaunches).toBe(0);
  });

  it("ne crée qu'une instance d'une application à instance unique", async () => {
    apps().launchApp('single.exe');
    apps().launchApp('single.exe');
    await loaded();
    apps().launchApp('single.exe');
    await loaded();

    expect(instancesOf('single.exe')).toHaveLength(1);
    expect(initCalls).toHaveLength(1);
  });

  it('retire le curseur d\'attente et n\'ouvre rien si le chargement échoue', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    loads.fail = true;

    expect(apps().launchApp('multi.exe')).toBe(true);
    await loaded();

    expect(apps().pendingLaunches).toBe(0);
    expect(instancesOf('multi.exe')).toHaveLength(0);
    expect(consoleError).toHaveBeenCalledOnce();
    consoleError.mockRestore();
  });
});

describe('killInstance', () => {
  it("retire l'instance et appelle son contrôleur", async () => {
    apps().launchApp('multi.exe');
    await loaded();
    const [instance] = instancesOf('multi.exe');
    const kill = vi.spyOn(instance.control, 'killInstance');

    apps().killInstance(instance.pid);

    expect(kill).toHaveBeenCalledOnce();
    expect(instancesOf('multi.exe')).toHaveLength(0);
  });
});
