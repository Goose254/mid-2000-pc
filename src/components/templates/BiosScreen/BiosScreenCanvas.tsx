import React, { useRef, useEffect, useState } from 'react';
import BiosLogo from '../../../assets/bios-logo.png';
import BiosEnergyStarLogo from '../../../assets/bios-energy-star-logo.png';
import PostBeep from '../../../assets/sounds/post-beep.mp3';
import { BootStage } from '../../../App';

const BiosScreenCanvas: React.FC<{ onComplete: (bootStage: BootStage) => void }> = ({ onComplete }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const beepAudioRef = useRef<HTMLAudioElement | null>(null);

  // Refs pour les images (chargées une seule fois)
  const biosLogoRef = useRef<HTMLImageElement | null>(null);
  const biosEnergyStarLogoRef = useRef<HTMLImageElement | null>(null);

  // États
  const [currentLineIndex, setCurrentLineIndex] = useState(0);
  const [memoryTestProgress, setMemoryTestProgress] = useState(0);
  const [pauseLineReveal, setPauseLineReveal] = useState(false);
  const [enterSetup, setEnterSetup] = useState(false);

  // Mémoire totale installée (ex: 2Go = 2097152K)
  const totalMemory = 2097152;

  // Messages BIOS
  const biosMessages = [
    'ASUS A8N-SLI Premium ACPI BIOS Revision 1011-001',
    ' ',
    'Main Processor: AMD Athlon(tm) 64 Processor 4000+',
    { isMemoryTest: true }, // <= ligne qu'on va traiter en test
    'Memory information: DDR 400 Dual Channel, 128-bit',
    ' ',
    'Chipset Model: nForce 4',
    'Primary IDE Master   : PLEXTOR DVDR   PX-716AL 1.02',
    'Primary IDE Slave    : None',
    'Secondary IDE Master : CD-W524E 1.0E',
    'Secondary IDE Slave  : None'
  ];

  // Index de la ligne Memory
  const memoryTestLineIndex = biosMessages.findIndex(
    (line) => typeof line === 'object' && (line as { isMemoryTest: boolean }).isMemoryTest
  );

  // ---- useEffect pour charger les images ----
  useEffect(() => {
    const biosLogo = new Image();
    biosLogo.src = BiosLogo;
    biosLogoRef.current = biosLogo;

    const biosEnergyStarLogo = new Image();
    biosEnergyStarLogo.src = BiosEnergyStarLogo;
    biosEnergyStarLogoRef.current = biosEnergyStarLogo;

    // Charger le beep audio
    beepAudioRef.current = new Audio(PostBeep);
  }, []);

  // ---- useEffect pour le rendu du canvas ----
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Configuration du canvas
    canvas.width = 800;
    canvas.height = 600;
    ctx.font = "16px 'PerfectDOS'";
    ctx.fillStyle = '#888';
    ctx.textBaseline = 'top';

    const biosLogo = biosLogoRef.current;
    const biosEnergyStarLogo = biosEnergyStarLogoRef.current;

    if (!biosLogo || !biosEnergyStarLogo) return;

    // Fonction de rendu
    const render = () => {
      if (!biosLogo.complete || !biosEnergyStarLogo.complete) return;

      // Fond noir
      ctx.fillStyle = 'black';
      ctx.fillRect(0, 0, 800, 600);

      // Dessiner les logos
      ctx.drawImage(biosLogo, 20, 22, 21, 29);
      ctx.drawImage(biosEnergyStarLogo, 800 - 133 - 20, 20, 133, 84);

      // Texte en haut
      ctx.fillStyle = '#888';
      ctx.fillText("Phoenix - AwardBIOS v6.00PG, An Energy Star Ally", 44, 20);
      ctx.fillText("Copyright (C) 1984-2005 Phoenix Technologies, LTD", 44, 38);

      // Texte en bas
      if (enterSetup) {
        ctx.fillStyle = '#FFF';
        ctx.fillText("Entering SETUP...", 20, 600 - 38);
      } else {
        ctx.fillStyle = '#888';
        ctx.fillText("Press     to enter SETUP", 20, 600 - 38);
        ctx.fillStyle = '#FFF';
        ctx.fillText("DEL", 74, 600 - 38);
      }

      // Dessiner les lignes
      ctx.fillStyle = '#888';
      for (let i = 0; i < currentLineIndex; i++) {
        const line = biosMessages[i];
        let textToDraw = '';

        if (typeof line === 'object' && (line as { isMemoryTest: boolean }).isMemoryTest) {
          if (memoryTestProgress < totalMemory) {
            textToDraw = `Memory Testing: ${memoryTestProgress}K`;
          } else {
            textToDraw = `Memory Testing: ${totalMemory}K OK (Installed Memory: ${totalMemory}K)`;
          }
        } else {
          textToDraw = line as string;
        }

        ctx.fillText(textToDraw, 20, 94 + i * 18);
      }
    };

    // Rendu initial
    const initialRender = () => {
      if (biosLogo.complete && biosEnergyStarLogo.complete) {
        render();
      } else {
        requestAnimationFrame(initialRender);
      }
    };

    initialRender();

    // Re-rendre quand les états changent
    render();
  }, [currentLineIndex, memoryTestProgress, enterSetup, biosMessages, totalMemory]);

  // ---- useEffect pour l'animation des lignes ----
  useEffect(() => {
    if (pauseLineReveal) return;

    const lineInterval = setInterval(() => {
      setCurrentLineIndex((prev) => {
        if (prev >= biosMessages.length) {
          clearInterval(lineInterval);
          return prev;
        }

        const next = prev + (prev === 7 ? 4 : 1);
        return next;
      });
    }, 400);

    return () => clearInterval(lineInterval);
  }, [pauseLineReveal, biosMessages.length]);

  // ---- useEffect pour jouer le beep ----
  useEffect(() => {
    if (currentLineIndex === 1 && beepAudioRef.current) {
      beepAudioRef.current.play().catch((err) => {
        console.log('Erreur lors de la lecture audio:', err);
      });
    }
  }, [currentLineIndex]);

  // ---- useEffect pour gérer la pause lors du test mémoire ----
  useEffect(() => {
    if (memoryTestLineIndex !== -1 && currentLineIndex > memoryTestLineIndex) {
      setPauseLineReveal(true);
    }
  }, [currentLineIndex, memoryTestLineIndex]);

  // ---- useEffect pour le test mémoire ----
  useEffect(() => {
    if (!pauseLineReveal || currentLineIndex <= memoryTestLineIndex) return;

    const memInterval = setInterval(() => {
      setMemoryTestProgress((prevMem) => {
        const nextMem = prevMem + 8192;
        if (nextMem >= totalMemory) {
          clearInterval(memInterval);
          return totalMemory;
        }
        return nextMem;
      });
    }, 10);

    return () => clearInterval(memInterval);
  }, [pauseLineReveal, currentLineIndex, memoryTestLineIndex, totalMemory]);

  // ---- useEffect pour reprendre après le test mémoire ----
  useEffect(() => {
    if (memoryTestProgress >= totalMemory && pauseLineReveal) {
      setPauseLineReveal(false);
    }
  }, [memoryTestProgress, pauseLineReveal, totalMemory]);

  // ---- useEffect pour appeler onComplete quand tout est terminé ----
  useEffect(() => {
    if (currentLineIndex >= biosMessages.length && memoryTestProgress >= totalMemory) {
      const timer = setTimeout(() => {
        onComplete(enterSetup ? 'bios-setup' : 'windows-boot');
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [currentLineIndex, biosMessages.length, memoryTestProgress, totalMemory, enterSetup, onComplete]);

  // ---- useEffect pour la touche DEL ----
  useEffect(() => {
    const handleDelKey = (e: KeyboardEvent) => {
      if (e.code === 'Delete') {
        setEnterSetup(true);
      }
    };

    window.addEventListener('keydown', handleDelKey, true);
    return () => window.removeEventListener('keydown', handleDelKey);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      width={800}
      height={600}
      className="cursor-none"
      style={{ display: 'block' }}
    />
  );
};

export default BiosScreenCanvas;
