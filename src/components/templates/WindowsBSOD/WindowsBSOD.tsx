import React, { useEffect } from 'react';
import styles from './WindowsBSOD.module.scss';

interface WindowsBSODProps {
  /** Nom du processus critique terminé (ex: csrss.exe). */
  processName: string;
  /** Appelé après quelques secondes pour enchaîner sur le redémarrage. */
  onComplete: () => void;
  /** Délai avant redémarrage (ms). */
  delayMs?: number;
}

/**
 * Écran bleu de la mort (BSOD) Windows XP, plein écran.
 *
 * Reproduit l'erreur système fatale `c000021a` provoquée par la terminaison
 * d'un processus système critique (csrss.exe, winlogon.exe, lsass.exe, ...),
 * suivie d'un vidage de la mémoire physique. Après quelques secondes, la
 * machine « redémarre » via `onComplete` (retour au BIOS), en réutilisant la
 * machine à états de `App.tsx`.
 */
export const WindowsBSOD: React.FC<WindowsBSODProps> = ({ processName, onComplete, delayMs = 5000 }) => {
  useEffect(() => {
    const timer = setTimeout(onComplete, delayMs);
    return () => clearTimeout(timer);
  }, [onComplete, delayMs]);

  return (
    <div className={`${styles.bsod} cursor-none`}>
      <pre className={styles.text}>
{`A problem has been detected and Windows has been shut down to prevent damage
to your computer.

If this is the first time you've seen this Stop error screen,
restart your computer. If this screen appears again, follow
these steps:

Check to make sure any new hardware or software is properly installed.
If this is a new installation, ask your hardware or software manufacturer
for any Windows updates you might need.

If problems continue, disable or remove any newly installed hardware
or software. Disable BIOS memory options such as caching or shadowing.
If you need to use Safe Mode to remove or disable components, restart
your computer, press F8 to select Advanced Startup Options, and then
select Safe Mode.

Technical information:

*** STOP: c000021a {Fatal System Error}
The ${processName} system process terminated unexpectedly
with a status of 0xc0000005 (0x00000000 0x00000000).

Beginning dump of physical memory
Physical memory dump complete.
Contact your system administrator or technical support group for further
assistance.`}
      </pre>
    </div>
  );
};

export default WindowsBSOD;
