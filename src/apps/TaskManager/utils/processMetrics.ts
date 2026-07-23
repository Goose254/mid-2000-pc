import { AppInstance } from '@/common/types/appTemplate';

/**
 * Simulation crédible des métriques du Gestionnaire des tâches.
 *
 * Toutes les valeurs sont *déterministes* : elles ne dépendent que du pid du
 * processus et d'un compteur de « tick » (le temps virtuel piloté par
 * `taskManagerStore`). Deux composants qui recalculent avec les mêmes entrées
 * obtiennent donc exactement les mêmes chiffres, ce qui garantit la cohérence
 * entre l'onglet Processus, l'onglet Performances et la barre d'état.
 *
 * Le caractère « stable par processus » vient du hash du pid : la mémoire de
 * base, le compte utilisateur, le nombre de threads/handles ne bougent pas ;
 * seule une légère ondulation (fonction du tick) fait varier la mémoire et l'UC
 * de façon plausible dans le temps.
 */

// Processus inactif du système : ligne synthétique toujours présente qui
// absorbe le pourcentage d'UC non consommé (comme sous Windows XP).
export const IDLE_PID = '__system_idle__';
export const IDLE_IMAGE = 'Processus inactif du système';

// Comptes système utilisés dans la colonne « Nom de l'utilisateur ».
export const SYSTEM_ACCOUNT = 'SYSTEM';
export const LOCAL_SERVICE = 'SERVICE LOCAL';
export const NETWORK_SERVICE = 'SERVICE RÉSEAU';

// Enveloppe mémoire de la machine simulée (en Ko).
export const PHYSICAL_TOTAL_KO = 1_047_980; // ~1 Go de mémoire physique
export const COMMIT_LIMIT_KO = 2_097_152; // 2048 Mo de limite de charge dédiée
const OS_BASE_COMMIT_KO = 94_208; // ~92 Mo de charge dédiée de base (noyau + services)
const SYSTEM_CACHE_BASE_KO = 96_000;
const KERNEL_PAGED_BASE_KO = 31_400;
const KERNEL_NONPAGED_BASE_KO = 4_600;

export interface ProcessMetric {
  /** pid réel de l'instance (ou IDLE_PID pour le processus inactif). */
  pid: string;
  /** Nom de l'image affiché (ex: svchost.exe). */
  imageName: string;
  /** Compte propriétaire du processus. */
  userName: string;
  /** Pourcentage d'UC (0..100). */
  cpu: number;
  /** Utilisation mémoire (working set) en Ko. */
  memoryKo: number;
  /** Nombre de threads. */
  threads: number;
  /** Nombre de handles. */
  handles: number;
  /** false pour les entrées non terminables (processus inactif). */
  killable: boolean;
}

export interface SystemMetrics {
  processes: ProcessMetric[];
  /** UC utilisée globale (%). */
  cpuUsage: number;
  processCount: number;
  totalThreads: number;
  totalHandles: number;
  physicalTotalKo: number;
  physicalAvailableKo: number;
  systemCacheKo: number;
  /** Charge dédiée utilisée (Ko). */
  commitTotalKo: number;
  commitLimitKo: number;
  kernelPagedKo: number;
  kernelNonPagedKo: number;
}

interface ProcessProfile {
  memMin: number;
  memMax: number;
  cpuMax: number;
  account: 'system' | 'service' | 'local' | 'network' | 'user';
  threadsBase: number;
  handlesBase: number;
}

// Profils par nom d'image : bornes mémoire (Ko), UC max plausible et type de
// compte. Les valeurs restent modestes pour que la somme des UC laisse une
// large part au processus inactif (comportement fidèle à XP au repos).
const PROFILES: Record<string, ProcessProfile> = {
  'svchost.exe': { memMin: 1600, memMax: 5200, cpuMax: 3, account: 'service', threadsBase: 6, handlesBase: 60 },
  'ctfmon.exe': { memMin: 2400, memMax: 3600, cpuMax: 2, account: 'user', threadsBase: 1, handlesBase: 40 },
  'alg.exe': { memMin: 3000, memMax: 3900, cpuMax: 1, account: 'local', threadsBase: 5, handlesBase: 90 },
  'rundll32.exe': { memMin: 3200, memMax: 4600, cpuMax: 2, account: 'user', threadsBase: 2, handlesBase: 40 },
  'explorer.exe': { memMin: 14_000, memMax: 22_000, cpuMax: 5, account: 'user', threadsBase: 12, handlesBase: 300 },
  'taskmgr.exe': { memMin: 4200, memMax: 6400, cpuMax: 4, account: 'user', threadsBase: 3, handlesBase: 90 },
  'winmine.exe': { memMin: 2200, memMax: 3400, cpuMax: 2, account: 'user', threadsBase: 3, handlesBase: 60 },
};

const DEFAULT_PROFILE: ProcessProfile = {
  memMin: 3000,
  memMax: 9000,
  cpuMax: 4,
  account: 'user',
  threadsBase: 5,
  handlesBase: 80,
};

/** Hash déterministe 32 bits (FNV-1a). */
function hashString(str: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 0x01000193);
  }
  return h >>> 0;
}

/**
 * Onde pseudo-continue déterministe dans [0,1]. La combinaison de deux
 * fréquences et d'une phase propre au processus donne un profil « organique »
 * qui ne se répète pas visiblement à l'œil.
 */
function wave(seed: number, tick: number): number {
  const phase = ((seed % 1000) / 1000) * Math.PI * 2;
  const a = Math.sin(tick * 0.35 + phase);
  const b = Math.sin(tick * 0.11 + phase * 1.7);
  return (a * 0.6 + b * 0.4 + 1) / 2;
}

/** Résout le compte propriétaire à partir du profil et du pid. */
function resolveUserName(profile: ProcessProfile, pid: string, currentUserName: string): string {
  switch (profile.account) {
    case 'system':
      return SYSTEM_ACCOUNT;
    case 'local':
      return LOCAL_SERVICE;
    case 'network':
      return NETWORK_SERVICE;
    case 'service': {
      // Les instances svchost.exe se répartissent de façon stable entre les
      // trois comptes de service, dérivées du pid.
      const accounts = [SYSTEM_ACCOUNT, LOCAL_SERVICE, NETWORK_SERVICE];
      return accounts[hashString(pid) % accounts.length];
    }
    case 'user':
    default:
      return currentUserName;
  }
}

/** Métrique d'un processus à un instant (tick) donné. */
function buildProcessMetric(instance: AppInstance, currentUserName: string, tick: number): ProcessMetric {
  const imageName = instance.appId;
  const profile = PROFILES[imageName] ?? DEFAULT_PROFILE;
  const pid = instance.pid;

  // Mémoire : base stable (dérivée du pid) + ondulation ±3 %.
  const span = Math.max(1, profile.memMax - profile.memMin);
  const baseMemory = profile.memMin + (hashString(`${pid}:mem`) % span);
  const memoryKo = Math.round(baseMemory * (0.97 + 0.06 * wave(hashString(`${pid}:memw`), tick)));

  // UC : la plupart du temps proche de 0, avec de courtes montées (^3).
  const cpuWave = wave(hashString(`${pid}:cpu`), tick);
  const cpu = Math.round(profile.cpuMax * Math.pow(cpuWave, 3));

  const threads = profile.threadsBase + (hashString(`${pid}:thr`) % 12);
  const handles = profile.handlesBase + (hashString(`${pid}:hnd`) % 200);

  return {
    pid,
    imageName,
    userName: resolveUserName(profile, pid, currentUserName),
    cpu,
    memoryKo,
    threads,
    handles,
    killable: true,
  };
}

/** Métriques système complètes à un instant donné. */
export function computeSystemMetrics(
  instances: AppInstance[],
  currentUserName: string,
  tick: number
): SystemMetrics {
  const processes = instances.map((instance) => buildProcessMetric(instance, currentUserName, tick));

  const sumCpu = processes.reduce((acc, p) => acc + p.cpu, 0);
  const cpuUsage = Math.min(99, sumCpu);

  // Processus inactif du système : absorbe l'UC restante (colonne UC → 100 %).
  const idle: ProcessMetric = {
    pid: IDLE_PID,
    imageName: IDLE_IMAGE,
    userName: SYSTEM_ACCOUNT,
    cpu: 100 - cpuUsage,
    memoryKo: 28,
    threads: 1,
    handles: 0,
    killable: false,
  };

  const allProcesses = [idle, ...processes];

  const sumWorkingSet = processes.reduce((acc, p) => acc + p.memoryKo, 0);
  const commitTotalKo = Math.min(COMMIT_LIMIT_KO, OS_BASE_COMMIT_KO + sumWorkingSet);
  const physicalAvailableKo = Math.max(
    32_768,
    PHYSICAL_TOTAL_KO - (OS_BASE_COMMIT_KO + sumWorkingSet)
  );

  const systemCacheKo = Math.round(SYSTEM_CACHE_BASE_KO + 40_000 * wave(hashString('cache'), tick));
  const kernelPagedKo = Math.round(KERNEL_PAGED_BASE_KO + 2_400 * wave(hashString('kpaged'), tick));
  const kernelNonPagedKo = Math.round(KERNEL_NONPAGED_BASE_KO + 600 * wave(hashString('knonpaged'), tick));

  const totalThreads = allProcesses.reduce((acc, p) => acc + p.threads, 0);
  const totalHandles = allProcesses.reduce((acc, p) => acc + p.handles, 0);

  return {
    processes: allProcesses,
    cpuUsage,
    processCount: allProcesses.length,
    totalThreads,
    totalHandles,
    physicalTotalKo: PHYSICAL_TOTAL_KO,
    physicalAvailableKo,
    systemCacheKo,
    commitTotalKo,
    commitLimitKo: COMMIT_LIMIT_KO,
    kernelPagedKo,
    kernelNonPagedKo,
  };
}

/** Utilisation réseau simulée (%) : faible au repos, avec de brèves pointes. */
export function computeNetworkUsage(tick: number): number {
  const base = wave(hashString('net-base'), tick);
  const spike = Math.pow(wave(hashString('net-spike'), tick), 4);
  return Math.min(100, Math.round(base * 2 + spike * 20));
}

/** Métriques vides (état initial du store avant le premier tick). */
export function emptyMetrics(): SystemMetrics {
  return {
    processes: [],
    cpuUsage: 0,
    processCount: 0,
    totalThreads: 0,
    totalHandles: 0,
    physicalTotalKo: PHYSICAL_TOTAL_KO,
    physicalAvailableKo: PHYSICAL_TOTAL_KO,
    systemCacheKo: SYSTEM_CACHE_BASE_KO,
    commitTotalKo: OS_BASE_COMMIT_KO,
    commitLimitKo: COMMIT_LIMIT_KO,
    kernelPagedKo: KERNEL_PAGED_BASE_KO,
    kernelNonPagedKo: KERNEL_NONPAGED_BASE_KO,
  };
}

// ---------------------------------------------------------------------------
// Helpers de formatage (séparateur de milliers français)
// ---------------------------------------------------------------------------
const numberFormatter = new Intl.NumberFormat('fr-FR');

/** Formate un nombre en français : « 2 916 ». */
export function formatNumber(value: number): string {
  return numberFormatter.format(Math.round(value));
}

/** Formate une quantité de Ko : « 2 916 Ko ». */
export function formatKo(value: number): string {
  return `${numberFormatter.format(Math.round(value))} Ko`;
}

/** Formate une quantité de Ko en Mo : « 95 Mo ». */
export function formatMo(valueKo: number): string {
  return `${numberFormatter.format(Math.round(valueKo / 1024))} Mo`;
}

/** Formate un pourcentage d'UC sur deux chiffres : « 00 », « 07 ». */
export function formatCpu(cpu: number): string {
  return String(Math.round(cpu)).padStart(2, '0');
}
