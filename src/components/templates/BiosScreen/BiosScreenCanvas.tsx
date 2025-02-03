import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import BiosLogo from '../../../assets/bios-logo.png';
import BiosEnergyStarLogo from '../../../assets/bios-energy-star-logo.png';
import PostBeep from '../../../assets/sounds/post-beep.mp3';
import { BootStage } from '../../../App';

const BiosScreenCanvas: React.FC<{ onComplete: (bootStage: BootStage) => void }> = ({ onComplete }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const beepAudioRef = useRef<HTMLAudioElement | null>(null);

  // 1) currentLineIndex gère le nombre de lignes révélées
  const [currentLineIndex, setCurrentLineIndex] = useState(0);

  // 2) memoryTestProgress gère la progression du test
  const [memoryTestProgress, setMemoryTestProgress] = useState(0);

  // 3) Ajout d'un état pour PAUSER ou reprendre l'affichage
  const [pauseLineReveal, setPauseLineReveal] = useState(false);
  
  // 4) Ajout d'un état pour entrer en mode SETUP à la fin du POST
  const [enterSetup, setEnterSetup] = useState(false);

  // Mémoire totale installée (ex: 2Go = 2097152K)
  const totalMemory = 2097152;

  // 4) Tableau BIOS, ligne Memory marquée avec un objet
  const biosMessages = useMemo(() => [
    'ASUS A8N-SLI Premium ACPI BIOS Revision 1011-001',
    ' ',
    'Main Processor: AMD Athlon(tm) 64 Processor 4000+',
    { isMemoryTest: true }, // <= ligne qu’on va traiter en test
    'Memory information: DDR 400 Dual Channel, 128-bit',
    ' ',
    'Chipset Model: nForce 4',
    'Primary IDE Master   : PLEXTOR DVDR   PX-716AL 1.02',
    'Primary IDE Slave    : None',
    'Secondary IDE Master : CD-W524E 1.0E',
    'Secondary IDE Slave  : None'
  ], []);

  // Chercher l'index de la ligne Memory
  const memoryTestLineIndex = biosMessages.findIndex(
    (line) => typeof line === 'object' && (line as { isMemoryTest: boolean }).isMemoryTest
  );

  // ---- Fonction pour dessiner (inspiré du code précédent) ----
  const renderLines = useCallback((
    ctx: CanvasRenderingContext2D,
    upToIndex: number,
    memoryTestProgressValue: number
  ) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Dessiner les logos
    const biosLogo = new Image();
    biosLogo.src = BiosLogo;
    const biosEnergyStarLogo = new Image();
    biosEnergyStarLogo.src = BiosEnergyStarLogo;

    if (!biosLogo.complete || !biosEnergyStarLogo.complete) {
      return;
    }

    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Pour éviter un clignotement si les images ne sont pas chargées : 
    // on peut vérifier biosLogo.complete pour dessiner quand c’est OK,
    // mais ci-dessous on dessine à chaque appel si l’image est complète.
    if (biosLogo.complete) {
      ctx.drawImage(biosLogo, 20, 22, 21, 29);
    }
    if (biosEnergyStarLogo.complete) {
      ctx.drawImage(biosEnergyStarLogo, 800 - 133 - 20, 20, 133, 84);
    }

    ctx.fillStyle = '#888';
    ctx.fillText("Phoenix - AwardBIOS v6.00PG, An Energy Star Ally", 44, 20);
    ctx.fillText("Copyright (C) 1984-2005 Phoenix Technologies, LTD", 44, 38);

    if (enterSetup) {
      ctx.fillStyle = '#FFF';
      ctx.fillText("Entering SETUP...", 20, 600 - 38);
    } else {
      ctx.fillText("Press     to enter SETUP", 20, 600 - 38);
  
      ctx.fillStyle = '#FFF';
      ctx.fillText("DEL", 74, 600 - 38);
    }

    // Ensuite, dessiner les lignes upToIndex
    ctx.fillStyle = '#888';
    for (let i = 0; i < upToIndex; i++) {
      const line = biosMessages[i];
      let textToDraw = '';

      if (typeof line === 'object' && (line as { isMemoryTest: boolean }).isMemoryTest) {
        // On gère la ligne dynamic
        if (memoryTestProgressValue < totalMemory) {
          textToDraw = `Memory Testing: ${memoryTestProgressValue}K`;
        } else {
          textToDraw = `Memory Testing: ${totalMemory}K OK (Installed Memory: ${totalMemory}K)`;
        }
      } else {
        // Ligne statique
        textToDraw = line as string;
      }

      drawLine(ctx, textToDraw, i, 20, 94);
    }
  }, [biosMessages, enterSetup]);

  const drawLine = (
    ctx: CanvasRenderingContext2D,
    text: string,
    lineNumber: number,
    x: number,
    yStart: number
  ) => {
    ctx.fillText(text, x, yStart + lineNumber * 18);
  };

  // ---- useEffect principal : configuration et lancement de l'affichage progressif ----
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Dimension du canvas
    canvas.width = 800;
    canvas.height = 600;

    ctx.font = "16px 'PerfectDOS'";
    ctx.fillStyle = '#888';
    ctx.textBaseline = 'top';

    // Interval pour dévoiler les lignes
    const lineInterval = setInterval(() => {
      // On ne bouge currentLineIndex que si la pause n’est PAS activée
      if (!pauseLineReveal) {
        setCurrentLineIndex((prev) => {
          const next = prev + (prev === 7 ? 4 : 1);

          // On redessine
          renderLines(ctx, next, memoryTestProgress);

          // Si on dépasse la fin, on arrête
          if (next >= biosMessages.length) {
            clearInterval(lineInterval);
            // eventuellement onComplete()
          }
          return next;
        });
      }
    }, 400);

    return () => clearInterval(lineInterval);
  }, [pauseLineReveal, memoryTestProgress, enterSetup, biosMessages.length, renderLines]); 
  // On inclut pauseLineReveal, memoryTestProgress pour redessiner quand ça change

  // ---- useEffect pour gérer la pause lorsque la ligne Memory est atteinte ----
  useEffect(() => {
    // Si on a dévoilé la ligne Memory => on met la pause
    if (memoryTestLineIndex !== -1 && currentLineIndex > memoryTestLineIndex) {
      setPauseLineReveal(true);
    }
  }, [currentLineIndex, memoryTestLineIndex]);

  // ---- useEffect pour incrémenter la mémoire pendant la pause ----
  useEffect(() => {
    // On démarre le test mémoire si la pause est active ET que la ligne Memory est révélée
    if (pauseLineReveal && currentLineIndex > memoryTestLineIndex) {
      const memInterval = setInterval(() => {
        setMemoryTestProgress((prevMem) => {
          const nextMem = prevMem + 8192; // +8 Mo par tick
          if (nextMem >= totalMemory) {
            clearInterval(memInterval);
            return totalMemory;
          }
          return nextMem;
        });
      }, 10); // vitesse du test mémoire (tweak possible)

      return () => clearInterval(memInterval);
    }
  }, [pauseLineReveal, currentLineIndex, memoryTestLineIndex, enterSetup]);

  // ---- useEffect pour savoir quand le test est terminé, on relance la suite ----
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // On redessine à chaque update du memoryTestProgress
    renderLines(ctx, currentLineIndex, memoryTestProgress);

    // Quand on atteint la fin du test
    if (memoryTestProgress >= totalMemory) {
      // On enlève la pause, donc la révélation des lignes reprend
      setPauseLineReveal(false);

      // Si on a déjà révélé toutes les lignes, onComplete()
      if (currentLineIndex >= biosMessages.length) {
        const timer = setTimeout(() => onComplete(enterSetup ? 'bios-setup' : 'windows-boot'), 1000);
        return () => clearTimeout(timer);
      }
    }
  }, [memoryTestProgress, currentLineIndex, enterSetup, onComplete, biosMessages.length, renderLines]);

  useEffect(() => {    
    // Charger/beep
    beepAudioRef.current = new Audio(PostBeep);

    if (currentLineIndex === 1) {
      beepAudioRef.current.play().catch((err) => {
        console.log('Erreur lors de la lecture audio:', err);
      });
    }
  }, [currentLineIndex])

  useEffect(() => {
    const handleDelKey = (e: KeyboardEvent) => {
      if (e.code === 'Delete') {
        setEnterSetup(true);
      }
    }
    window.addEventListener('keydown', handleDelKey, true);

    return () => {
      window.removeEventListener('keydown', handleDelKey);
    }
  }, [setEnterSetup])

  return <canvas ref={canvasRef} className="cursor-none" />;
};

export default BiosScreenCanvas;
