import React, { useRef, useEffect, useState } from 'react';
import BiosLogo from '../../../assets/bios-logo.png';
import BiosEnergyStarLogo from '../../../assets/bios-energy-star-logo.png';
import PostBeep from '../../../assets/sounds/post-beep.mp3';

// Définissez ici le composant qui va gérer l'effet BIOS
const BiosScreenCanvas: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
  // Référence vers l'élément canvas
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Une référence vers l'objet Audio (si vous voulez un beep à un moment précis)
  const beepAudioRef = useRef<HTMLAudioElement | null>(null);

  // État pour savoir combien de lignes on a déjà « affiché »
  const [currentLineIndex, setCurrentLineIndex] = useState(0);

  // Liste des lignes à « simuler » (textes du BIOS)
  // Vous pouvez ajuster la longueur, le contenu et l'ordre
  const biosMessages = [
    'ASUS A8N-SLI Premium ACPI BIOS Revision 1011-001',
    ' ',
    'Main Processor: AMD Athlon(tm) 64 Processor 4000+',
    'Memory Testing: 2097152K OK (Installed Memory: 2097152K)',
    'Memory information: DDR 400 Dual Channel, 128-bit',
    ' ',
    'Chipset Model: nForce 4',
    'Primary IDE Master   : PLEXTOR DVDR   PX-716AL 1.02',
    'Primary IDE Slave    : None',
    'Secondary IDE Master : CD-W524E 1.0E',
    'Secondary IDE Slave  : None'
  ];

  // Fonction de dessin sur le canvas
  const drawLine = (
    ctx: CanvasRenderingContext2D,
    text: string,
    lineNumber: number,
    x: number,
    yStart: number
  ) => {
    ctx.fillText(text, x, yStart + lineNumber * 18); 
    // 20 = l'espacement vertical entre lignes (à adapter)
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Configuration initiale du canvas
    canvas.width = 800;
    canvas.height = 600;

    // Fond noir façon BIOS
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Charger le logo
    const biosLogo = new Image();
    biosLogo.src = BiosLogo;

    // Charger le logo Energy Star
    const biosEnergyStarLogo = new Image();
    biosEnergyStarLogo.src = BiosEnergyStarLogo;

    beepAudioRef.current = new Audio(PostBeep);
    
    // Exemple : on joue le beep au montage ou à un moment précis
    beepAudioRef.current.play().catch((err) => {
      console.log('Erreur lors de la lecture audio:', err);
    });

    // Configuration du texte (en utilisant la police PerfectDOS que vous avez importée)
    // Assurez-vous que la police soit bien chargée par le navigateur
    // p.ex. via un @font-face dans un fichier CSS global.
    ctx.font = "16px 'PerfectDOS'";
    ctx.fillStyle = '#888';
    ctx.textBaseline = 'top';

    // Fonction qui dessine la/les ligne(s) déjà affichée(s)
    const renderLines = (upToIndex: number) => {
      // Nettoyer le fond
      ctx.fillStyle = 'black';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Dessiner le logo du BIOS
      const biosLogoWidth = 21;  // adapter selon la taille de votre image
      const biosLogoHeight = 29; // idem
      const biosLogoX = 20;
      const biosLogoY = 22;
      if (biosLogo.complete) {
        ctx.drawImage(biosLogo, biosLogoX, biosLogoY, biosLogoWidth, biosLogoHeight);
      }
      
      // Dessiner le logo Energy Star
      const biosEnergyStarLogoWidth = 133;  // adapter selon la taille de votre image
      const biosEnergyStarLogoHeight = 84; // idem
      const biosEnergyStarLogoX = 800 - biosEnergyStarLogoWidth - 20;
      const biosEnergyStarLogoY = 20;
      if (biosEnergyStarLogo.complete) {
        ctx.drawImage(biosEnergyStarLogo, biosEnergyStarLogoX, biosEnergyStarLogoY, biosEnergyStarLogoWidth, biosEnergyStarLogoHeight);
      }

      ctx.fillStyle = '#888';
      ctx.fillText("Phoenix - AwardBIOS v6.00PG, An Energy Star Ally", 44, 20);
      ctx.fillText("Copyright (C) 1984-2005 Phoenix Technologies, LTD", 44, 38);
      ctx.fillText("Press     to enter SETUP", 20, 600 - 38);
      
      ctx.fillStyle = '#FFF';
      ctx.fillText("DEL", 74, 600 - 38); 

      // Redessiner toutes les lignes jusqu'à upToIndex
      ctx.fillStyle = '#888';
      for (let i = 0; i < upToIndex; i++) {
        drawLine(ctx, biosMessages[i], i, 20, 94);
      }
    };

    // Affiche progressif: on va «dévoiler» une ligne toutes les x millisecondes
    // Ici par exemple, une ligne s’affiche toutes les 800 ms
    const lineInterval = setInterval(() => {
      setCurrentLineIndex((prevIndex) => {
        const newIndex = prevIndex + 1;
        if (newIndex <= biosMessages.length) {
          renderLines(newIndex);
          return newIndex;
        } else {
          // Toutes les lignes sont affichées, on arrête l’intervalle
          onComplete();
          clearInterval(lineInterval);
          return prevIndex;
        }
      });
    }, 700);

    // Nettoyage si le composant se démonte (éviter les effets pendants)
    return () => {
      clearInterval(lineInterval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onComplete]);

  // Pour ajouter un curseur clignotant (après l’affichage complet),
  // on pourrait déclencher un useEffect supplémentaire dès que 
  // currentLineIndex === biosMessages.length, etc.

  return (
    <canvas ref={canvasRef} />
  );
};

export default BiosScreenCanvas;
