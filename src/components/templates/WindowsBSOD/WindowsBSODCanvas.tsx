import React, { useEffect, useRef } from 'react';

interface WindowsBSODCanvasProps {
  /** Nom du processus critique terminé (ex: csrss.exe). */
  processName: string;
  /** Appelé après quelques secondes pour enchaîner sur le redémarrage. */
  onComplete: () => void;
  /** Délai avant redémarrage (ms). */
  delayMs?: number;
}

// Résolution VGA authentique : dessinée à 640×480 puis étirée par le wrapper
// `Display` (ratio 4:3 + lissage = flou CRT de la police), comme les écrans BIOS.
const WIDTH = 640;
const HEIGHT = 480;

// Bloc de texte aligné à gauche, positionné en haut (et non centré) comme le
// vrai écran bleu de Windows XP.
const LEFT = 52;
const TOP = 72; // ligne de base de la première ligne
const LINE_HEIGHT = 14;
const FONT_SIZE = 12;
const BG = '#0000AA';

/**
 * Écran bleu de la mort (BSOD) Windows XP, rendu au canvas.
 *
 * Reproduit l'erreur système fatale `c000021a` provoquée par la terminaison
 * d'un processus système critique (csrss.exe, winlogon.exe, lsass.exe, ...).
 * Le composant est destiné à être enveloppé dans `<Display width={640}
 * height={480}>` (comme le BIOS) : le canvas est dessiné à 640×480 puis
 * agrandi par Display, ce qui donne le bon ratio d'écran et le léger flou de
 * la police. Après quelques secondes, la machine « redémarre » via
 * `onComplete` (retour au BIOS).
 */
export const WindowsBSODCanvas: React.FC<WindowsBSODCanvasProps> = ({
  processName,
  onComplete,
  delayMs = 5000,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = WIDTH;
    canvas.height = HEIGHT;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const lines = [
      'A problem has been detected and Windows has been shut down to prevent',
      'damage to your computer.',
      '',
      "If this is the first time you've seen this Stop error screen,",
      'restart your computer. If this screen appears again, follow',
      'these steps:',
      '',
      'Check to make sure any new hardware or software is properly installed.',
      'If this is a new installation, ask your hardware or software manufacturer',
      'for any Windows updates you might need.',
      '',
      'If problems continue, disable or remove any newly installed hardware',
      'or software. Disable BIOS memory options such as caching or shadowing.',
      'If you need to use Safe Mode to remove or disable components, restart',
      'your computer, press F8 to select Advanced Startup Options, and then',
      'select Safe Mode.',
      '',
      'Technical information:',
      '',
      '*** STOP: c000021a {Fatal System Error}',
      `The ${processName} system process terminated unexpectedly`,
      'with a status of 0xc0000005 (0x00000000 0x00000000).',
      '',
      'Beginning dump of physical memory',
      'Physical memory dump complete.',
      'Contact your system administrator or technical support group for further',
      'assistance.',
    ];

    ctx.fillStyle = BG;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    ctx.fillStyle = '#ffffff';
    ctx.font = `${FONT_SIZE}px "Lucida Console", "Consolas", monospace`;
    ctx.textBaseline = 'alphabetic';

    lines.forEach((line, i) => {
      if (line) ctx.fillText(line, LEFT, TOP + i * LINE_HEIGHT);
    });
  }, [processName]);

  useEffect(() => {
    const timer = setTimeout(onComplete, delayMs);
    return () => clearTimeout(timer);
  }, [onComplete, delayMs]);

  return <canvas ref={canvasRef} className="cursor-none" style={{ display: 'block' }} />;
};

export default WindowsBSODCanvas;
