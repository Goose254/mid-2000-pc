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

// ---------------------------------------------------------------------------
// Enveloppe mémoire de la machine simulée (en Ko).
//
// Un seul point de vérité : `TOTAL_PHYSICAL_MEMORY_KB`. La mémoire physique
// totale, la limite de charge dédiée et toutes les valeurs dérivées
// (disponible, cache, charge dédiée) en découlent, de sorte que la barre
// d'état, l'onglet Performances et la somme des colonnes Processus restent
// cohérents entre eux.
// ---------------------------------------------------------------------------

/** Mémoire physique totale (Ko) = mémoire affichée par le BIOS (2 Go). */
export const TOTAL_PHYSICAL_MEMORY_KB = 2_097_152;

/** Mémoire physique totale exposée à l'onglet Performances. */
export const PHYSICAL_TOTAL_KO = TOTAL_PHYSICAL_MEMORY_KB;

/** Limite de la charge dédiée : alignée sur la mémoire physique (« / 2048 Mo »). */
export const COMMIT_LIMIT_KO = TOTAL_PHYSICAL_MEMORY_KB;

const OS_BASE_COMMIT_KO = 118_000; // charge dédiée de base (noyau + services) non comptée dans les working sets
const SYSTEM_CACHE_BASE_KO = 178_000;
const KERNEL_PAGED_BASE_KO = 41_400;
const KERNEL_NONPAGED_BASE_KO = 6_600;

/**
 * Catégorie d'arrêtabilité d'un processus (fidèle à Windows XP) :
 * - `protected` : non arrêtable (« Accès refusé »).
 * - `fatal`     : arrêt = plantage système (écran bleu / BSOD).
 * - `normal`    : arrêtable après avertissement.
 */
export type ProcessCategory = 'protected' | 'fatal' | 'normal';

export interface ProcessMetric {
  /** pid réel de l'instance (ou pid synthétique pour les processus système). */
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
  /** Catégorie d'arrêtabilité. */
  category: ProcessCategory;
  /** false pour les entrées protégées (processus inactif, System). */
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

type AccountKind = 'system' | 'service' | 'local' | 'network' | 'user';

interface ProcessProfile {
  memMin: number;
  memMax: number;
  cpuMax: number;
  account: AccountKind;
  threadsBase: number;
  handlesBase: number;
}

// Profils par nom d'image : bornes mémoire (Ko), UC max plausible et type de
// compte. Les valeurs restent modestes pour que la somme des UC laisse une
// large part au processus inactif (comportement fidèle à XP au repos).
const PROFILES: Record<string, ProcessProfile> = {
  'System': { memMin: 212, memMax: 288, cpuMax: 1, account: 'system', threadsBase: 52, handlesBase: 260 },
  'smss.exe': { memMin: 380, memMax: 520, cpuMax: 1, account: 'system', threadsBase: 3, handlesBase: 20 },
  'csrss.exe': { memMin: 3200, memMax: 5200, cpuMax: 2, account: 'system', threadsBase: 11, handlesBase: 320 },
  'winlogon.exe': { memMin: 2000, memMax: 3600, cpuMax: 1, account: 'system', threadsBase: 18, handlesBase: 420 },
  'services.exe': { memMin: 3000, memMax: 4600, cpuMax: 2, account: 'system', threadsBase: 15, handlesBase: 260 },
  'lsass.exe': { memMin: 1200, memMax: 2200, cpuMax: 1, account: 'system', threadsBase: 18, handlesBase: 360 },
  'svchost.exe': { memMin: 1900, memMax: 13_000, cpuMax: 3, account: 'service', threadsBase: 6, handlesBase: 60 },
  'spoolsv.exe': { memMin: 4000, memMax: 5600, cpuMax: 1, account: 'system', threadsBase: 10, handlesBase: 120 },
  'ctfmon.exe': { memMin: 2400, memMax: 3600, cpuMax: 2, account: 'user', threadsBase: 1, handlesBase: 40 },
  'alg.exe': { memMin: 3000, memMax: 3900, cpuMax: 1, account: 'local', threadsBase: 5, handlesBase: 90 },
  'wuauclt.exe': { memMin: 4000, memMax: 6000, cpuMax: 2, account: 'user', threadsBase: 5, handlesBase: 130 },
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

/**
 * Définition d'un processus système « de base » lancé au démarrage de Windows XP.
 * Ces processus sont synthétiques (non liés à une vraie fenêtre) : ils sont
 * toujours présents, sauf ceux que l'utilisateur a explicitement terminés.
 */
interface SystemProcessDef {
  pid: string;
  imageName: string;
  category: ProcessCategory;
  /** Compte forcé (prioritaire sur celui du profil). */
  account?: AccountKind;
}

/**
 * Liste authentique des processus lancés par défaut sous Windows XP, dans un
 * ordre plausible. `taskmgr.exe` et les applications de l'utilisateur ne
 * figurent PAS ici : ils proviennent des vraies instances fenêtrées.
 */
export const SYSTEM_PROCESSES: SystemProcessDef[] = [
  { pid: IDLE_PID, imageName: IDLE_IMAGE, category: 'protected', account: 'system' },
  { pid: 'system-4', imageName: 'System', category: 'protected', account: 'system' },
  { pid: 'smss-0', imageName: 'smss.exe', category: 'fatal', account: 'system' },
  { pid: 'csrss-0', imageName: 'csrss.exe', category: 'fatal', account: 'system' },
  { pid: 'winlogon-0', imageName: 'winlogon.exe', category: 'fatal', account: 'system' },
  { pid: 'services-0', imageName: 'services.exe', category: 'fatal', account: 'system' },
  { pid: 'lsass-0', imageName: 'lsass.exe', category: 'fatal', account: 'system' },
  { pid: 'svchost-0', imageName: 'svchost.exe', category: 'normal', account: 'system' },
  { pid: 'svchost-1', imageName: 'svchost.exe', category: 'normal', account: 'network' },
  { pid: 'svchost-2', imageName: 'svchost.exe', category: 'normal', account: 'local' },
  { pid: 'svchost-3', imageName: 'svchost.exe', category: 'normal', account: 'system' },
  { pid: 'svchost-4', imageName: 'svchost.exe', category: 'normal', account: 'local' },
  { pid: 'spoolsv-0', imageName: 'spoolsv.exe', category: 'normal', account: 'system' },
  { pid: 'explorer-shell', imageName: 'explorer.exe', category: 'normal', account: 'user' },
  { pid: 'ctfmon-0', imageName: 'ctfmon.exe', category: 'normal', account: 'user' },
  { pid: 'alg-0', imageName: 'alg.exe', category: 'normal', account: 'local' },
  { pid: 'wuauclt-0', imageName: 'wuauclt.exe', category: 'normal', account: 'user' },
];

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

/** Résout le nom de compte affiché à partir d'un type de compte et du pid. */
function accountToUserName(kind: AccountKind, pid: string, currentUserName: string): string {
  switch (kind) {
    case 'system':
      return SYSTEM_ACCOUNT;
    case 'local':
      return LOCAL_SERVICE;
    case 'network':
      return NETWORK_SERVICE;
    case 'service': {
      // Les instances svchost.exe sans compte explicite se répartissent de
      // façon stable entre les trois comptes de service, dérivées du pid.
      const accounts = [SYSTEM_ACCOUNT, LOCAL_SERVICE, NETWORK_SERVICE];
      return accounts[hashString(pid) % accounts.length];
    }
    case 'user':
    default:
      return currentUserName;
  }
}

/**
 * Construit la métrique d'un processus à partir d'un pid, d'un nom d'image et
 * d'une catégorie. Utilisé aussi bien pour les processus système synthétiques
 * que pour les vraies instances fenêtrées.
 */
function buildMetric(
  pid: string,
  imageName: string,
  category: ProcessCategory,
  accountOverride: AccountKind | undefined,
  currentUserName: string,
  tick: number
): ProcessMetric {
  const profile = PROFILES[imageName] ?? DEFAULT_PROFILE;

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
    userName: accountToUserName(accountOverride ?? profile.account, pid, currentUserName),
    cpu,
    memoryKo,
    threads,
    handles,
    category,
    killable: category !== 'protected',
  };
}

/**
 * Métriques système complètes à un instant donné.
 *
 * @param userInstances Instances d'applications réellement en cours (fenêtrées).
 * @param currentUserName Nom du compte connecté (colonne utilisateur).
 * @param tick Temps virtuel.
 * @param terminatedPids pids des processus système synthétiques déjà terminés.
 */
export function computeSystemMetrics(
  userInstances: AppInstance[],
  currentUserName: string,
  tick: number,
  terminatedPids: ReadonlySet<string> = new Set()
): SystemMetrics {
  // Processus système « de base » (hors processus inactif, traité à part) et
  // hors ceux que l'utilisateur a terminés.
  const baseProcesses = SYSTEM_PROCESSES.filter(
    (def) => def.pid !== IDLE_PID && !terminatedPids.has(def.pid)
  ).map((def) => buildMetric(def.pid, def.imageName, def.category, def.account, currentUserName, tick));

  // Applications réellement ouvertes par l'utilisateur (winmine.exe, taskmgr.exe,
  // explorer.exe si le Poste de travail est ouvert, ...). Toujours « normal ».
  const userProcesses = userInstances.map((instance) =>
    buildMetric(instance.pid, instance.appId, 'normal', undefined, currentUserName, tick)
  );

  const realProcesses = [...userProcesses, ...baseProcesses];

  const sumCpu = realProcesses.reduce((acc, p) => acc + p.cpu, 0);
  const cpuUsage = Math.min(99, sumCpu);

  // Processus inactif du système : absorbe l'UC restante (colonne UC → 100 %).
  // Protégé : jamais retiré de la liste.
  const idle: ProcessMetric = {
    pid: IDLE_PID,
    imageName: IDLE_IMAGE,
    userName: SYSTEM_ACCOUNT,
    cpu: 100 - cpuUsage,
    memoryKo: 28,
    threads: 1,
    handles: 0,
    category: 'protected',
    killable: false,
  };

  const allProcesses = [...realProcesses, idle];

  const sumWorkingSet = realProcesses.reduce((acc, p) => acc + p.memoryKo, 0);
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
