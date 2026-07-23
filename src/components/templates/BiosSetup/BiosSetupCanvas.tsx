import React, { useRef, useEffect, useState, useCallback } from 'react';

/**
 * BIOS Setup façon Award/Phoenix (milieu des années 2000), rendu au canvas.
 *
 * Le composant reproduit l'« Award CMOS Setup Utility » : un menu principal à
 * deux colonnes de rubriques, des sous-menus remplis de champs éditables, la
 * modification des valeurs par +/-/PageUp/PageDown et les actions classiques
 * (Load Defaults, Set Password, Save & Exit…).
 *
 * Choix d'architecture :
 *  - Les données (menu principal + sous-menus + valeurs possibles) sont des
 *    constantes typées de module : elles ne changent jamais et n'ont donc pas à
 *    être recréées à chaque rendu.
 *  - L'état modifiable (valeurs choisies, horloge, saisie de mot de passe) vit
 *    dans des `useState`. Les valeurs d'enum sont mémorisées sous forme d'index
 *    dans un Record, ce qui découple l'état de l'utilisateur des définitions.
 *  - Le rendu est factorisé en fonctions pures de module qui reçoivent le
 *    contexte 2D et l'état à dessiner.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface FieldBase {
  id: string;
  label: string;
  /** Colonne d'affichage dans le sous-menu (0 = gauche, 1 = droite). */
  col?: 0 | 1;
  /** Nombre de lignes vides à insérer avant le champ (dans sa colonne). */
  gap?: number;
}

/** Champ à choix multiples : la valeur cycle parmi `options`. */
interface EnumField extends FieldBase {
  kind: 'enum';
  options: string[];
  /** Index appliqué par « Load Optimized Defaults ». */
  opt: number;
  /** Index appliqué par « Load Fail-Safe Defaults ». */
  fail: number;
}

/** Champ en lecture seule (valeur détectée / mesurée). */
interface DisplayField extends FieldBase {
  kind: 'display';
  value: string;
}

/** Champ date de l'horloge temps réel (ajustable). */
interface DateField extends FieldBase {
  kind: 'date';
}

/** Champ heure de l'horloge temps réel (ajustable). */
interface TimeField extends FieldBase {
  kind: 'time';
}

type BiosField = EnumField | DisplayField | DateField | TimeField;

interface SubMenu {
  id: string;
  title: string;
  fields: BiosField[];
  /** Abscisse de la valeur en colonne gauche. */
  leftValueX: number;
  /** Abscisse du libellé en colonne droite. */
  rightLabelX?: number;
  /** Abscisse de la valeur en colonne droite. */
  rightValueX?: number;
}

/** Nature d'une rubrique du menu principal. */
type MenuKind =
  | 'submenu'
  | 'load-failsafe'
  | 'load-optimized'
  | 'set-supervisor-pw'
  | 'set-user-pw'
  | 'save-exit'
  | 'exit-nosave';

interface MenuItem {
  label: string;
  description: string;
  kind: MenuKind;
  /** Identifiant du sous-menu associé (si kind === 'submenu'). */
  submenuId?: string;
}

/** Action déclenchée par une invite de confirmation Y/N. */
type ConfirmAction = 'exit' | 'load-optimized' | 'load-failsafe';

/** Invite modale affichée par-dessus l'écran courant. */
type Prompt =
  | { kind: 'confirm'; message: string; action: ConfirmAction }
  | { kind: 'password'; title: string };

/** Horloge temps réel du CMOS. */
interface Clock {
  y: number;
  mo: number; // 1-12
  d: number; // 1-31
  h: number;
  mi: number;
  s: number;
}

// ---------------------------------------------------------------------------
// Palette & constantes de mise en page (fidèles au bleu/jaune/rouge Award)
// ---------------------------------------------------------------------------

const COLORS = {
  bg: '#0000AA', // bleu Award
  border: '#FFFFFF',
  title: '#FFFFFF',
  label: '#FFFF55', // jaune (rubriques du menu principal)
  text: '#FFFFFF',
  highlight: '#AA0000', // rouge surbrillance
  highlightText: '#FFFFFF',
  help: '#FFFFFF',
  desc: '#FFFF55',
  shadow: '#000000',
} as const;

const WIDTH = 640;
const HEIGHT = 400;
const FONT = "16px 'PerfectDOS'";

const SUB_Y_START = 78;
const SUB_LINE_H = 16;
const SUB_LEFT_LABEL_X = 28;

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

// ---------------------------------------------------------------------------
// Fabriques de champs (réduisent le bruit dans les définitions de sous-menus)
// ---------------------------------------------------------------------------

type FieldExtra = Partial<Pick<FieldBase, 'col' | 'gap'>>;

const en = (
  id: string,
  label: string,
  options: string[],
  opt = 0,
  fail = opt,
  extra: FieldExtra = {},
): EnumField => ({ kind: 'enum', id, label, options, opt, fail, ...extra });

const disp = (
  id: string,
  label: string,
  value: string,
  extra: FieldExtra = {},
): DisplayField => ({ kind: 'display', id, label, value, ...extra });

// ---------------------------------------------------------------------------
// Données : sous-menus
// ---------------------------------------------------------------------------

const BOOT_DEVICES = ['Floppy', 'HDD-0', 'CD-ROM', 'LS120', 'ZIP100', 'USB-FDD', 'USB-HDD', 'LAN', 'Disabled'];

const SUBMENUS: SubMenu[] = [
  // -- Standard CMOS Features -------------------------------------------------
  {
    id: 'standard',
    title: 'Standard CMOS Features',
    leftValueX: 216,
    rightLabelX: 372,
    rightValueX: 516,
    fields: [
      { kind: 'date', id: 'date', label: 'Date (mm:dd:yy)' },
      { kind: 'time', id: 'time', label: 'Time (hh:mm:ss)' },
      disp('ide-pm', 'IDE Primary Master', 'ST3120026AS', { gap: 1 }),
      disp('ide-ps', 'IDE Primary Slave', 'None'),
      disp('ide-sm', 'IDE Secondary Master', 'PLEXTOR DVDR PX-716A'),
      disp('ide-ss', 'IDE Secondary Slave', 'None'),
      en('drive-a', 'Drive A', ['1.44M, 3.5 in.', '720K, 3.5 in.', '1.2M, 5.25 in.', '360K, 5.25 in.', 'None'], 0, 0, { gap: 1 }),
      en('drive-b', 'Drive B', ['None', '1.44M, 3.5 in.', '720K, 3.5 in.'], 0),
      en('video', 'Video', ['EGA/VGA', 'CGA 40', 'CGA 80', 'Mono'], 0, 0, { gap: 1 }),
      en('halt-on', 'Halt On', ['All Errors', 'No Errors', 'All, But Keyboard', 'All, But Diskette', 'All, But Disk/Key'], 2, 0),
      disp('base-mem', 'Base Memory', '640K', { col: 1 }),
      disp('ext-mem', 'Extended Memory', '2096128K', { col: 1 }),
      disp('total-mem', 'Total Memory', '2097152K', { col: 1 }),
    ],
  },

  // -- Advanced BIOS Features -------------------------------------------------
  {
    id: 'advbios',
    title: 'Advanced BIOS Features',
    leftValueX: 242,
    rightLabelX: 336,
    rightValueX: 536,
    fields: [
      en('virus', 'Virus Warning', ['Disabled', 'Enabled'], 0),
      en('l1', 'CPU Internal Cache', ['Enabled', 'Disabled'], 0, 1),
      en('l2', 'External Cache', ['Enabled', 'Disabled'], 0, 1),
      en('quickpost', 'Quick Power On Self Test', ['Enabled', 'Disabled'], 0, 1),
      en('boot1', 'First Boot Device', BOOT_DEVICES, 0, 1, { gap: 1 }),
      en('boot2', 'Second Boot Device', BOOT_DEVICES, 1, 8),
      en('boot3', 'Third Boot Device', BOOT_DEVICES, 2, 8),
      en('bootother', 'Boot Other Device', ['Enabled', 'Disabled'], 0, 1),
      en('swapfloppy', 'Swap Floppy Drive', ['Disabled', 'Enabled'], 0, 0, { gap: 1 }),
      en('floppyseek', 'Boot Up Floppy Seek', ['Enabled', 'Disabled'], 0, 0),
      en('numlock', 'Boot Up NumLock Status', ['On', 'Off'], 0, 0, { col: 1 }),
      en('gatea20', 'Gate A20 Option', ['Fast', 'Normal'], 0, 1, { col: 1 }),
      en('typematic', 'Typematic Rate Setting', ['Disabled', 'Enabled'], 0, 0, { col: 1 }),
      en('security', 'Security Option', ['Setup', 'System'], 0, 0, { col: 1, gap: 1 }),
      en('apic', 'APIC Mode', ['Enabled', 'Disabled'], 0, 1, { col: 1 }),
      en('mps', 'MPS Version Control', ['1.4', '1.1'], 0, 0, { col: 1 }),
      en('os2', 'OS Select DRAM > 64MB', ['Non-OS2', 'OS2'], 0, 0, { col: 1, gap: 1 }),
      en('smart', 'HDD S.M.A.R.T. Cap.', ['Disabled', 'Enabled'], 0, 0, { col: 1 }),
      en('logo', 'Full Screen LOGO Show', ['Enabled', 'Disabled'], 0, 1, { col: 1 }),
    ],
  },

  // -- Advanced Chipset Features ----------------------------------------------
  {
    id: 'chipset',
    title: 'Advanced Chipset Features',
    leftValueX: 300,
    fields: [
      en('dramtiming', 'DRAM Timing Selectable', ['By SPD', 'Manual'], 0),
      en('cas', 'CAS Latency Time', ['Auto', '2', '2.5', '3'], 0),
      en('rascas', 'RAS# to CAS# Delay', ['Auto', '2', '3', '4'], 0),
      en('rasprecharge', 'RAS# Precharge', ['Auto', '2', '3', '4'], 0),
      en('tras', 'Precharge Delay (tRAS)', ['Auto', '5', '6', '7', '8'], 0),
      en('bioscache', 'System BIOS Cacheable', ['Enabled', 'Disabled'], 0, 1, { gap: 1 }),
      en('vgacache', 'Video RAM Cacheable', ['Disabled', 'Enabled'], 0),
      en('agpaperture', 'AGP Aperture Size', ['128MB', '64MB', '256MB', '512MB'], 0, 1, { gap: 1 }),
      en('initdisplay', 'Init Display First', ['PCI Slot', 'PCIEx', 'AGP'], 1),
    ],
  },

  // -- Integrated Peripherals -------------------------------------------------
  {
    id: 'peripherals',
    title: 'Integrated Peripherals',
    leftValueX: 300,
    fields: [
      en('ide0', 'On-Chip IDE Channel0', ['Enabled', 'Disabled'], 0),
      en('ide1', 'On-Chip IDE Channel1', ['Enabled', 'Disabled'], 0),
      en('usb', 'USB Controller', ['Enabled', 'Disabled'], 0),
      en('usb2', 'USB 2.0 Controller', ['Enabled', 'Disabled'], 0),
      en('usbkb', 'USB Keyboard Support', ['Disabled', 'Enabled'], 0),
      en('ac97', 'AC97 Audio', ['Auto', 'Disabled'], 0, 0, { gap: 1 }),
      en('lan', 'Onboard LAN', ['Enabled', 'Disabled'], 0),
      en('serial1', 'Onboard Serial Port 1', ['3F8/IRQ4', '2F8/IRQ3', '3E8/IRQ4', '2E8/IRQ3', 'Disabled'], 0, 0, { gap: 1 }),
      en('parallel', 'Onboard Parallel Port', ['378/IRQ7', '278/IRQ5', '3BC/IRQ7', 'Disabled'], 0),
      en('parmode', 'Parallel Port Mode', ['ECP+EPP', 'SPP', 'EPP', 'ECP'], 0),
    ],
  },

  // -- Power Management Setup -------------------------------------------------
  {
    id: 'power',
    title: 'Power Management Setup',
    leftValueX: 300,
    fields: [
      en('acpi', 'ACPI Function', ['Enabled', 'Disabled'], 0),
      en('suspend', 'ACPI Suspend Type', ['S1(POS)', 'S3(STR)', 'S1&S3'], 0),
      en('pm', 'Power Management', ['User Define', 'Min Saving', 'Max Saving'], 0),
      en('videooff', 'Video Off Method', ['DPMS', 'Blank Screen', 'V/H SYNC+Blank'], 0),
      en('hddpower', 'HDD Power Down', ['Disabled', '1 Min', '5 Min', '10 Min', '15 Min'], 0),
      en('softoff', 'Soft-Off by PWR-BTTN', ['Instant-Off', 'Delay 4 Sec'], 0),
      en('wakepci', 'Wake-Up by PCI card', ['Disabled', 'Enabled'], 0, 0, { gap: 1 }),
      en('poweronring', 'Power On by Ring', ['Disabled', 'Enabled'], 0),
      en('acloss', 'Restore On AC Power Loss', ['Power Off', 'Power On', 'Last State'], 0),
    ],
  },

  // -- PnP/PCI Configurations -------------------------------------------------
  {
    id: 'pnp',
    title: 'PnP/PCI Configurations',
    leftValueX: 300,
    fields: [
      en('resetescd', 'Reset Configuration Data', ['Disabled', 'Enabled'], 0),
      en('resources', 'Resources Controlled By', ['Auto(ESCD)', 'Manual'], 0),
      disp('irqres', 'IRQ Resources', 'Press Enter'),
      en('palettesnoop', 'PCI/VGA Palette Snoop', ['Disabled', 'Enabled'], 0, 0, { gap: 1 }),
      en('intpin1', 'INT Pin 1 Assignment', ['Auto', '3', '4', '5', '7', '9', '10', '11'], 0),
      en('intpin2', 'INT Pin 2 Assignment', ['Auto', '3', '4', '5', '7', '9', '10', '11'], 0),
      en('payload', 'Maximum Payload Size', ['4096', '128', '256', '512', '1024', '2048'], 0, 0, { gap: 1 }),
    ],
  },

  // -- PC Health Status -------------------------------------------------------
  {
    id: 'health',
    title: 'PC Health Status',
    leftValueX: 220,
    rightLabelX: 352,
    rightValueX: 504,
    fields: [
      en('shutdowntemp', 'Shutdown Temperature', ['Disabled', '60C/140F', '65C/149F', '70C/158F'], 0),
      en('cpuwarn', 'CPU Warning Temp.', ['Disabled', '60C/140F', '70C/158F'], 0),
      en('smartfan', 'Smart FAN Control', ['Enabled', 'Disabled'], 0, 0, { gap: 1 }),
      disp('systemp', 'Current System Temp', '32C / 89F', { gap: 1 }),
      disp('cputemp', 'Current CPU Temp', '45C / 113F'),
      disp('cpufan', 'CPU FAN Speed', '3245 RPM'),
      disp('chassisfan', 'Chassis FAN Speed', '2100 RPM'),
      disp('vcore', 'Vcore', '1.42 V', { col: 1 }),
      disp('v33', '+3.3 V', '3.31 V', { col: 1 }),
      disp('v5', '+5 V', '5.05 V', { col: 1 }),
      disp('v12', '+12 V', '12.03 V', { col: 1 }),
      disp('vbat', 'Voltage Battery', '3.14 V', { col: 1 }),
    ],
  },

  // -- Frequency/Voltage Control ----------------------------------------------
  {
    id: 'freq',
    title: 'Frequency/Voltage Control',
    leftValueX: 280,
    fields: [
      en('cpuratio', 'CPU Clock Ratio', ['Auto', 'x10', 'x11', 'x12'], 0),
      disp('fsb', 'CPU Host Frequency', '200 MHz'),
      en('memfreq', 'Memory Frequency', ['Auto', 'DDR400', 'DDR333', 'DDR266'], 0, 0, { gap: 1 }),
      en('cpuvolt', 'CPU Voltage', ['Auto', '1.400V', '1.425V', '1.450V'], 0),
      en('memvolt', 'Memory Voltage', ['Auto', '2.6V', '2.7V', '2.8V'], 0),
      en('chipvolt', 'Chipset Voltage', ['Auto', '1.5V', '1.6V'], 0),
      en('spread', 'Spread Spectrum', ['Disabled', 'Enabled'], 0, 0, { gap: 1 }),
    ],
  },
];

const SUBMENU_BY_ID: Record<string, SubMenu> = Object.fromEntries(
  SUBMENUS.map((s) => [s.id, s]),
);

// ---------------------------------------------------------------------------
// Données : menu principal (deux colonnes)
// ---------------------------------------------------------------------------

const MAIN_MENU: MenuItem[][] = [
  [
    { label: 'Standard CMOS Features', description: 'Time, Date, Hard Disk Type...', kind: 'submenu', submenuId: 'standard' },
    { label: 'Advanced BIOS Features', description: 'Virus Protection, Boot Sequence...', kind: 'submenu', submenuId: 'advbios' },
    { label: 'Advanced Chipset Features', description: 'AT clock, DRAM timings...', kind: 'submenu', submenuId: 'chipset' },
    { label: 'Integrated Peripherals', description: 'Onboard I/O, IRQ, DMA Assignment...', kind: 'submenu', submenuId: 'peripherals' },
    { label: 'Power Management Setup', description: 'Sleep timer, Suspend timer...', kind: 'submenu', submenuId: 'power' },
    { label: 'PnP/PCI Configurations', description: 'IRQ Settings, Latency Timers...', kind: 'submenu', submenuId: 'pnp' },
    { label: 'PC Health Status', description: 'Temperatures, Fan Speeds, Voltages...', kind: 'submenu', submenuId: 'health' },
  ],
  [
    { label: 'Frequency/Voltage Control', description: 'Bus/CPU Clocks, Operating Voltages...', kind: 'submenu', submenuId: 'freq' },
    { label: 'Load Fail-Safe Defaults', description: 'Load BIOS Defaults except Standard CMOS SETUP', kind: 'load-failsafe' },
    { label: 'Load Optimized Defaults', description: 'Load Setup Defaults except Standard CMOS SETUP', kind: 'load-optimized' },
    { label: 'Set Supervisor Password', description: 'Change/Set/Disable Password', kind: 'set-supervisor-pw' },
    { label: 'Set User Password', description: 'Change/Set/Disable Password', kind: 'set-user-pw' },
    { label: 'Save & Exit Setup', description: 'Save Data to CMOS & Exit SETUP', kind: 'save-exit' },
    { label: 'Exit Without Saving', description: 'Abandon all Data & Exit SETUP', kind: 'exit-nosave' },
  ],
];

// ---------------------------------------------------------------------------
// Helpers purs (état & formatage)
// ---------------------------------------------------------------------------

/** Clé de mémorisation d'une valeur d'enum. */
const valueKey = (submenuId: string, fieldId: string) => `${submenuId}::${fieldId}`;

/** Construit le jeu de valeurs par défaut (optimized ou fail-safe). */
function buildValues(which: 'opt' | 'fail'): Record<string, number> {
  const values: Record<string, number> = {};
  for (const sub of SUBMENUS) {
    for (const field of sub.fields) {
      if (field.kind === 'enum') {
        values[valueKey(sub.id, field.id)] = which === 'opt' ? field.opt : field.fail;
      }
    }
  }
  return values;
}

const pad2 = (n: number) => n.toString().padStart(2, '0');

const isLeap = (y: number) => (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;

function daysInMonth(mo: number, y: number): number {
  return [31, isLeap(y) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][mo - 1];
}

function formatDate(c: Clock): string {
  const dow = new Date(c.y, c.mo - 1, c.d).getDay();
  return `${WEEKDAYS[dow]}, ${MONTHS[c.mo - 1]} ${pad2(c.d)} ${c.y}`;
}

function formatTime(c: Clock): string {
  return `${pad2(c.h)} : ${pad2(c.mi)} : ${pad2(c.s)}`;
}

/** Fait avancer l'horloge d'une seconde (cascade complète). */
function tickClock(c: Clock): Clock {
  const next = { ...c, s: c.s + 1 };
  if (next.s > 59) { next.s = 0; next.mi += 1; }
  if (next.mi > 59) { next.mi = 0; next.h += 1; }
  if (next.h > 23) { next.h = 0; next.d += 1; }
  if (next.d > daysInMonth(next.mo, next.y)) { next.d = 1; next.mo += 1; }
  if (next.mo > 12) { next.mo = 1; next.y += 1; }
  return next;
}

/** Ajuste le jour (champ Date) via +/-. */
function adjustDate(c: Clock, dir: 1 | -1): Clock {
  const max = daysInMonth(c.mo, c.y);
  let d = c.d + dir;
  if (d < 1) d = max;
  if (d > max) d = 1;
  return { ...c, d };
}

/** Ajuste les minutes (champ Time) via +/-. */
function adjustTime(c: Clock, dir: 1 | -1): Clock {
  let mi = c.mi + dir;
  if (mi < 0) mi = 59;
  if (mi > 59) mi = 0;
  return { ...c, mi };
}

// ---------------------------------------------------------------------------
// Helpers de mise en page des sous-menus
// ---------------------------------------------------------------------------

interface PositionedField {
  field: BiosField;
  col: number;
  y: number;
  labelX: number;
  valueX: number;
  selectable: boolean;
}

/** Calcule la position (x, y) de chaque champ d'un sous-menu. */
function layoutFields(sub: SubMenu): PositionedField[] {
  const rLabelX = sub.rightLabelX ?? 336;
  const rValueX = sub.rightValueX ?? 520;
  const cursors = [SUB_Y_START, SUB_Y_START];
  const out: PositionedField[] = [];

  for (const field of sub.fields) {
    const col = field.col ?? 0;
    if (field.gap) cursors[col] += field.gap * SUB_LINE_H;
    const y = cursors[col];
    cursors[col] += SUB_LINE_H;
    out.push({
      field,
      col,
      y,
      labelX: col === 0 ? SUB_LEFT_LABEL_X : rLabelX,
      valueX: col === 0 ? sub.leftValueX : rValueX,
      selectable: field.kind !== 'display',
    });
  }
  return out;
}

/** Liste ordonnée des champs sélectionnables (utilisée pour la navigation). */
function selectableFields(sub: SubMenu): PositionedField[] {
  return layoutFields(sub).filter((p) => p.selectable);
}

/** Renvoie le nouvel index sélectionné après un déplacement directionnel. */
function navigateFields(
  sub: SubMenu,
  currentIndex: number,
  dir: 'up' | 'down' | 'left' | 'right',
): number {
  const pos = selectableFields(sub);
  if (pos.length === 0) return 0;
  const cur = pos[currentIndex] ?? pos[0];
  const cols: PositionedField[][] = [
    pos.filter((p) => p.col === 0),
    pos.filter((p) => p.col === 1),
  ];

  let target = cur;
  if (dir === 'up' || dir === 'down') {
    const colList = cols[cur.col];
    const row = colList.indexOf(cur);
    const nextRow = dir === 'up'
      ? (row - 1 + colList.length) % colList.length
      : (row + 1) % colList.length;
    target = colList[nextRow];
  } else {
    const targetCol = dir === 'left' ? 0 : 1;
    const list = cols[targetCol];
    if (list.length > 0) {
      // On rejoint la ligne verticalement la plus proche dans la colonne visée.
      target = list.reduce(
        (best, p) => (Math.abs(p.y - cur.y) < Math.abs(best.y - cur.y) ? p : best),
        list[0],
      );
    }
  }
  return pos.indexOf(target);
}

/** Texte de valeur d'un champ, prêt à dessiner. */
function fieldValueText(
  field: BiosField,
  values: Record<string, number>,
  submenuId: string,
  clock: Clock,
): string {
  switch (field.kind) {
    case 'enum': {
      const idx = values[valueKey(submenuId, field.id)] ?? field.opt;
      return `[${field.options[idx]}]`;
    }
    case 'display':
      return field.value;
    case 'date':
      return formatDate(clock);
    case 'time':
      return formatTime(clock);
  }
}

// ---------------------------------------------------------------------------
// Rendu (fonctions pures)
// ---------------------------------------------------------------------------

/** Titre principal centré + bordure double commune à tous les écrans. */
function drawChrome(ctx: CanvasRenderingContext2D, subtitle?: string) {
  ctx.fillStyle = COLORS.bg;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  ctx.font = FONT;
  ctx.textBaseline = 'alphabetic';

  const title = 'CMOS Setup Utility - Copyright (C) 1984-2005 Award Software';
  ctx.fillStyle = COLORS.title;
  ctx.fillText(title, Math.round((WIDTH - ctx.measureText(title).width) / 2), 20);

  if (subtitle) {
    ctx.fillStyle = COLORS.title;
    ctx.fillText(subtitle, Math.round((WIDTH - ctx.measureText(subtitle).width) / 2), 48);
  }

  // Bordure double blanche.
  ctx.fillStyle = COLORS.border;
  ctx.fillRect(0, 30, WIDTH, 1);
  ctx.fillRect(0, 30, 2, HEIGHT - 35);
  ctx.fillRect(WIDTH - 2, 30, 2, HEIGHT - 35);
  ctx.fillRect(0, HEIGHT - 5, WIDTH, 1);

  ctx.fillRect(3, 32, WIDTH - 6, 1);
  ctx.fillRect(3, 32, 2, HEIGHT - 39);
  ctx.fillRect(WIDTH - 5, 32, 2, HEIGHT - 39);
  ctx.fillRect(3, HEIGHT - 7, WIDTH - 6, 1);
}

/** Dessine le menu principal (deux colonnes de rubriques). */
function drawMainMenu(ctx: CanvasRenderingContext2D, selCol: number, selRow: number) {
  drawChrome(ctx);

  const menuXStart = 25;
  const menuYStart = 70;
  const rowGap = 30;
  const colGap = 320;

  MAIN_MENU.forEach((column, colIndex) => {
    const baseX = menuXStart + colIndex * colGap;
    column.forEach((item, rowIndex) => {
      const y = menuYStart + rowIndex * rowGap;
      const selected = colIndex === selCol && rowIndex === selRow;
      const hasSub = item.kind === 'submenu';
      const labelX = baseX + 16;

      // Fond de la ligne (rouge si sélectionnée).
      ctx.fillStyle = selected ? COLORS.highlight : COLORS.bg;
      const rectX = hasSub ? baseX : labelX;
      ctx.fillRect(rectX, y - 14, ctx.measureText(item.label).width + (hasSub ? 16 : 0), 19);

      // Libellé (jaune, blanc si sélectionné).
      ctx.fillStyle = selected ? COLORS.highlightText : COLORS.label;
      ctx.fillText(item.label, labelX, y);

      // Triangle « ▶ » devant les rubriques à sous-menu.
      if (hasSub) {
        ctx.fillStyle = selected ? COLORS.highlightText : COLORS.label;
        const tri = new Path2D();
        tri.moveTo(baseX, y - 10);
        tri.lineTo(baseX + 8, y - 5);
        tri.lineTo(baseX, y);
        ctx.fill(tri);
      }
    });
  });

  // Description de la rubrique sélectionnée (centrée).
  const desc = MAIN_MENU[selCol][selRow].description;
  ctx.fillStyle = COLORS.desc;
  ctx.fillText(desc, Math.round((WIDTH - ctx.measureText(desc).width) / 2), 366);

  // Séparateurs et barre d'aide.
  ctx.fillStyle = COLORS.border;
  ctx.fillRect(3, HEIGHT - 70, WIDTH - 6, 1);
  ctx.fillRect(3, HEIGHT - 118, WIDTH - 6, 1);
  ctx.fillRect((WIDTH / 2) - 1, 32, 2, HEIGHT - 150);

  ctx.fillStyle = COLORS.help;
  ctx.fillText('Esc : Quit', 15, 303);
  ctx.fillText('F10 : Save & Exit Setup', 15, 320);
  ctx.fillText('↑↓→← : Select Item', (WIDTH / 2) + 15, 303);
  ctx.fillText('Enter : Select    F6/F7 : Defaults', (WIDTH / 2) + 15, 320);
}

/** Dessine un écran de sous-menu (colonnes label/valeur + surbrillance). */
function drawSubMenu(
  ctx: CanvasRenderingContext2D,
  sub: SubMenu,
  values: Record<string, number>,
  selectedIndex: number,
  clock: Clock,
) {
  drawChrome(ctx, sub.title);

  const positioned = layoutFields(sub);
  let navIndex = 0;
  for (const p of positioned) {
    const isSelected = p.selectable && navIndex === selectedIndex;
    const valueText = fieldValueText(p.field, values, sub.id, clock);

    if (isSelected) {
      // Barre de surbrillance couvrant le libellé et la valeur.
      const vWidth = ctx.measureText(valueText).width;
      const start = p.labelX - 4;
      const end = p.valueX + vWidth + 4;
      ctx.fillStyle = COLORS.highlight;
      ctx.fillRect(start, p.y - 12, end - start, 15);
    }

    ctx.fillStyle = isSelected ? COLORS.highlightText : COLORS.text;
    ctx.fillText(p.field.label, p.labelX, p.y);
    ctx.fillText(valueText, p.valueX, p.y);

    if (p.selectable) navIndex += 1;
  }

  // Barre d'aide (deux bandes) façon Award.
  ctx.fillStyle = COLORS.border;
  ctx.fillRect(3, 312, WIDTH - 6, 1);
  ctx.fillRect(3, 352, WIDTH - 6, 1);

  ctx.fillStyle = COLORS.help;
  ctx.fillText('↑↓→←:Move  Enter:Select  +/-/PU/PD:Value  F10:Save  ESC:Exit', 16, 332);
  ctx.fillText('F1:General Help    F5:Previous Values    F6:Fail-Safe    F7:Optimized', 16, 372);
}

/** Dessine une invite modale (confirmation Y/N ou saisie de mot de passe). */
function drawPrompt(ctx: CanvasRenderingContext2D, prompt: Prompt, passwordBuffer: string) {
  ctx.font = FONT;

  if (prompt.kind === 'confirm') {
    const text = prompt.message;
    const boxW = ctx.measureText(text).width + 44;
    const boxH = 48;
    const x = Math.round((WIDTH - boxW) / 2);
    const y = Math.round((HEIGHT - boxH) / 2);

    ctx.fillStyle = COLORS.shadow;
    ctx.fillRect(x + 6, y + 6, boxW, boxH);
    ctx.fillStyle = COLORS.bg;
    ctx.fillRect(x, y, boxW, boxH);
    ctx.fillStyle = COLORS.border;
    ctx.fillRect(x, y, boxW, 2);
    ctx.fillRect(x, y, 2, boxH);
    ctx.fillRect(x + boxW - 2, y, 2, boxH);
    ctx.fillRect(x, y + boxH - 2, boxW, 2);

    ctx.fillStyle = COLORS.desc;
    ctx.fillText(text, Math.round((WIDTH - ctx.measureText(text).width) / 2), y + 30);
    return;
  }

  // Saisie de mot de passe (masquée, purement cosmétique).
  const masked = '*'.repeat(passwordBuffer.length);
  const boxW = 260;
  const boxH = 66;
  const x = Math.round((WIDTH - boxW) / 2);
  const y = Math.round((HEIGHT - boxH) / 2);

  ctx.fillStyle = COLORS.shadow;
  ctx.fillRect(x + 6, y + 6, boxW, boxH);
  ctx.fillStyle = COLORS.bg;
  ctx.fillRect(x, y, boxW, boxH);
  ctx.fillStyle = COLORS.border;
  ctx.fillRect(x, y, boxW, 2);
  ctx.fillRect(x, y, 2, boxH);
  ctx.fillRect(x + boxW - 2, y, 2, boxH);
  ctx.fillRect(x, y + boxH - 2, boxW, 2);

  ctx.fillStyle = COLORS.desc;
  ctx.fillText(prompt.title, Math.round((WIDTH - ctx.measureText(prompt.title).width) / 2), y + 26);
  ctx.fillStyle = COLORS.text;
  const inputText = `${masked}_`;
  ctx.fillText(inputText, Math.round((WIDTH - ctx.measureText(inputText).width) / 2), y + 50);
}

// ---------------------------------------------------------------------------
// Composant
// ---------------------------------------------------------------------------

interface BiosSetupCanvasProps {
  onExit: () => void; // callback appelé quand l'utilisateur quitte le Setup
}

const INITIAL_CLOCK: Clock = { y: 2005, mo: 7, d: 21, h: 12, mi: 0, s: 0 };

const BiosSetupCanvas: React.FC<BiosSetupCanvasProps> = ({ onExit }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // --- Navigation ---
  const [mode, setMode] = useState<'main' | 'submenu'>('main');
  const [selCol, setSelCol] = useState(0);
  const [selRow, setSelRow] = useState(0);
  const [subId, setSubId] = useState('standard');
  const [subFieldIndex, setSubFieldIndex] = useState(0);

  // --- État modifiable ---
  const [fieldValues, setFieldValues] = useState<Record<string, number>>(() => buildValues('opt'));
  const [clock, setClock] = useState<Clock>(INITIAL_CLOCK);
  const [prompt, setPrompt] = useState<Prompt | null>(null);
  const [passwordBuffer, setPasswordBuffer] = useState('');

  /**
   * Rendu complet de l'écran courant (mémoïsé sur l'état affiché).
   */
  const drawScreen = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = WIDTH;
    canvas.height = HEIGHT;

    if (mode === 'submenu') {
      drawSubMenu(ctx, SUBMENU_BY_ID[subId], fieldValues, subFieldIndex, clock);
    } else {
      drawMainMenu(ctx, selCol, selRow);
    }

    if (prompt) drawPrompt(ctx, prompt, passwordBuffer);
  }, [mode, selCol, selRow, subId, subFieldIndex, prompt, fieldValues, passwordBuffer, clock]);

  /**
   * Applique un décalage de valeur (+1 / -1) au champ sélectionné du sous-menu.
   */
  const changeValue = useCallback((dir: 1 | -1) => {
    const sub = SUBMENU_BY_ID[subId];
    const pos = selectableFields(sub);
    const field = pos[subFieldIndex]?.field;
    if (!field) return;

    if (field.kind === 'enum') {
      const key = valueKey(sub.id, field.id);
      setFieldValues((prev) => {
        const cur = prev[key] ?? field.opt;
        const len = field.options.length;
        const next = dir > 0 ? (cur + 1) % len : (cur - 1 + len) % len;
        return { ...prev, [key]: next };
      });
    } else if (field.kind === 'date') {
      setClock((prev) => adjustDate(prev, dir));
    } else if (field.kind === 'time') {
      setClock((prev) => adjustTime(prev, dir));
    }
  }, [subId, subFieldIndex]);

  /** Active la rubrique sélectionnée du menu principal. */
  const activateMainItem = useCallback(() => {
    const item = MAIN_MENU[selCol][selRow];
    switch (item.kind) {
      case 'submenu':
        setSubId(item.submenuId as string);
        setSubFieldIndex(0);
        setMode('submenu');
        break;
      case 'load-failsafe':
        setPrompt({ kind: 'confirm', message: 'Load Fail-Safe Defaults (Y/N)? N', action: 'load-failsafe' });
        break;
      case 'load-optimized':
        setPrompt({ kind: 'confirm', message: 'Load Optimized Defaults (Y/N)? N', action: 'load-optimized' });
        break;
      case 'set-supervisor-pw':
      case 'set-user-pw':
        setPasswordBuffer('');
        setPrompt({ kind: 'password', title: 'Enter Password :' });
        break;
      case 'save-exit':
        setPrompt({ kind: 'confirm', message: 'SAVE to CMOS and EXIT (Y/N)? Y', action: 'exit' });
        break;
      case 'exit-nosave':
        setPrompt({ kind: 'confirm', message: 'Quit Without Saving (Y/N)? N', action: 'exit' });
        break;
    }
  }, [selCol, selRow]);

  /**
   * Gestion clavier. Le handler est mémoïsé sur l'état lu ; l'effet plus bas le
   * (ré)attache proprement à chaque changement (cleanup systématique => pas de
   * fuite de listeners).
   */
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    const key = e.key;

    // 1) Une invite est ouverte : elle capte tout le clavier.
    if (prompt) {
      e.preventDefault();
      if (prompt.kind === 'confirm') {
        if (key === 'y' || key === 'Y') {
          if (prompt.action === 'exit') onExit();
          else if (prompt.action === 'load-optimized') setFieldValues(buildValues('opt'));
          else if (prompt.action === 'load-failsafe') setFieldValues(buildValues('fail'));
          setPrompt(null);
        } else if (key === 'n' || key === 'N' || key === 'Escape') {
          setPrompt(null);
        }
      } else {
        // Saisie de mot de passe.
        if (key === 'Enter' || key === 'Escape') {
          setPrompt(null);
          setPasswordBuffer('');
        } else if (key === 'Backspace') {
          setPasswordBuffer((prev) => prev.slice(0, -1));
        } else if (key.length === 1) {
          setPasswordBuffer((prev) => (prev.length < 8 ? prev + key : prev));
        }
      }
      return;
    }

    // 2) Raccourcis globaux (menu principal comme sous-menu).
    if (key === 'F10') {
      e.preventDefault();
      setPrompt({ kind: 'confirm', message: 'SAVE to CMOS and EXIT (Y/N)? Y', action: 'exit' });
      return;
    }
    if (key === 'F6') {
      e.preventDefault();
      setPrompt({ kind: 'confirm', message: 'Load Fail-Safe Defaults (Y/N)? N', action: 'load-failsafe' });
      return;
    }
    if (key === 'F7') {
      e.preventDefault();
      setPrompt({ kind: 'confirm', message: 'Load Optimized Defaults (Y/N)? N', action: 'load-optimized' });
      return;
    }

    // 3) Navigation dans un sous-menu.
    if (mode === 'submenu') {
      const sub = SUBMENU_BY_ID[subId];
      if (key === 'Escape') {
        setMode('main');
      } else if (key === 'ArrowUp') {
        setSubFieldIndex((i) => navigateFields(sub, i, 'up'));
      } else if (key === 'ArrowDown') {
        setSubFieldIndex((i) => navigateFields(sub, i, 'down'));
      } else if (key === 'ArrowLeft') {
        setSubFieldIndex((i) => navigateFields(sub, i, 'left'));
      } else if (key === 'ArrowRight') {
        setSubFieldIndex((i) => navigateFields(sub, i, 'right'));
      } else if (key === '+' || key === '=' || key === 'PageUp') {
        changeValue(1);
      } else if (key === '-' || key === '_' || key === 'PageDown') {
        changeValue(-1);
      } else {
        return; // touche non gérée : on laisse passer
      }
      e.preventDefault();
      return;
    }

    // 4) Navigation dans le menu principal.
    const colLen = MAIN_MENU[selCol].length;
    if (key === 'ArrowUp') {
      setSelRow((r) => (r - 1 + colLen) % colLen);
    } else if (key === 'ArrowDown') {
      setSelRow((r) => (r + 1) % colLen);
    } else if (key === 'ArrowLeft') {
      setSelCol(0);
      setSelRow((r) => Math.min(r, MAIN_MENU[0].length - 1));
    } else if (key === 'ArrowRight') {
      setSelCol(1);
      setSelRow((r) => Math.min(r, MAIN_MENU[1].length - 1));
    } else if (key === 'Enter') {
      activateMainItem();
    } else if (key === 'Escape') {
      setPrompt({ kind: 'confirm', message: 'Quit Without Saving (Y/N)? N', action: 'exit' });
    } else {
      return;
    }
    e.preventDefault();
  }, [prompt, mode, subId, selCol, changeValue, activateMainItem, onExit]);

  // Attache/détache l'écoute clavier (re-attachée à chaque changement de handler).
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Redessine à chaque changement d'état affiché, et une fois la police prête.
  useEffect(() => {
    drawScreen();
    document.fonts?.ready.then(drawScreen);
  }, [drawScreen]);

  // Horloge temps réel : ne tourne que sur l'écran Standard CMOS, hors invite.
  useEffect(() => {
    if (mode !== 'submenu' || subId !== 'standard' || prompt) return;
    const id = window.setInterval(() => setClock((c) => tickClock(c)), 1000);
    return () => window.clearInterval(id);
  }, [mode, subId, prompt]);

  return (
    <canvas
      ref={canvasRef}
      width={WIDTH}
      height={HEIGHT}
      style={{ outline: 'none', display: 'block' }}
      className="cursor-none"
    />
  );
};

export default BiosSetupCanvas;
