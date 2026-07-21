import React, { useRef, useEffect } from "react";
import XPBootLogo from "../../../assets/xp-boot-logo.png";
import XPBootBar from "../../../assets/xp-boot-bar.png";
import XPBootCopyrightText from "../../../assets/xp-boot-copyright-text.png";
import XPBootMicrosoftLogo from "../../../assets/xp-boot-microsoft-logo.png";
import { BootStage } from "../../../App";
import styles from "./WindowsXPBootScreenCanvas.module.scss";

// Constantes de module : dimensions du canvas et paramètres de la barre de
// progression sont statiques, ils n'ont donc pas à figurer dans les
// dépendances du useEffect d'animation.

// Largeur/hauteur du canvas (vous pouvez adapter les dimensions voulues)
const WIDTH = 640;
const HEIGHT = 480;

// Paramètres pour la barre de progression
const PROGRESS_BAR_WIDTH = 118;
const PROGRESS_BAR_HEIGHT = 9;
const PROGRESS_BAR_X = (WIDTH - PROGRESS_BAR_WIDTH) / 2;
const PROGRESS_BAR_Y = HEIGHT * 0.75; // environ 80% vers le bas

/**
 * Ce composant dessine un écran de boot Windows XP sur un canvas :
 * - fond noir
 * - logo Windows XP centré
 * - barre de progression animée
 */
const WindowsXPBootScreenCanvas: React.FC<{ onComplete: (bootStage?: BootStage) => void }> = ({ onComplete }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    const startTime = performance.now();

    // Charger le logo
    const logo = new Image();
    logo.src = XPBootLogo;
    
    // Charger la barre de chargement
    const bar = new Image();
    bar.src = XPBootBar;
    
    // Charger le texte de copyright
    const copyrightText = new Image();
    copyrightText.src = XPBootCopyrightText;
    
    // Charger le logo Microsoft
    const microsoftLogo = new Image();
    microsoftLogo.src = XPBootMicrosoftLogo;

    let timeDiff = 0;

    // Fonction de dessin principale
    const draw = (timestamp: number) => {
      if (!ctx) return;
      if (!logo.complete || !bar.complete || !copyrightText.complete || !microsoftLogo.complete) {
        animationFrameId = requestAnimationFrame(draw);
        return;
      }

      // Dessiner la barre de progression
      // On va simuler un déplacement cyclique
      const cycleDuration = 2000; // en ms (durée d'un cycle du défilement)

      timeDiff += timestamp - startTime > cycleDuration ? Math.random() * 10 : 0;
      const elapsed = timestamp + timeDiff - startTime;

      // Effacer le canvas
      ctx.clearRect(0, 0, WIDTH, HEIGHT);

      // Dessiner le fond noir
      ctx.fillStyle = "black";
      ctx.fillRect(0, 0, WIDTH, HEIGHT);

      // Dessiner le logo Windows XP, centré
      const logoWidth = 250;  // adapter selon la taille de votre image
      const logoHeight = 150; // idem
      const logoX = (WIDTH - logoWidth) / 2;
      const logoY = (HEIGHT - logoHeight) / 2.5;
      if (logo.complete) {
        ctx.drawImage(logo, logoX, logoY, logoWidth, logoHeight);
      }

      // Dessiner le texte de copyright
      const copyrightTextWidth = 200;  // adapter selon la taille de votre image
      const copyrightTextHeight = 11; // idem
      const copyrightTextX = 20;
      const copyrightTextY = HEIGHT - copyrightTextHeight - 20;
      if (copyrightText.complete) {
        ctx.drawImage(copyrightText, copyrightTextX, copyrightTextY, copyrightTextWidth, copyrightTextHeight);
      }

      // Dessiner le logo Microsoft
      const microsoftLogoWidth = 73;  // adapter selon la taille de votre image
      const microsoftLogoHeight = 13; // idem
      const microsoftLogoX = WIDTH - microsoftLogoWidth - 20;
      const microsoftLogoY = HEIGHT - microsoftLogoHeight - 20;
      if (microsoftLogo.complete) {
        ctx.drawImage(microsoftLogo, microsoftLogoX, microsoftLogoY, microsoftLogoWidth, microsoftLogoHeight);
      }

      // Nombre total de pas
      const blockCount = 15;
      const blockWidth = 6;
      const blockSpacing = 2;
      // On récupère la progression linéaire sur [0, 1]
      const progress = (elapsed % cycleDuration) / cycleDuration;

      // On convertit la progression en un indice entier [0 .. blockCount-1]
      const steppedIndex = Math.floor(progress * (blockCount + 2));

      // On calcule la taille (en px) pour chaque bloc de progression
      const stepSize = PROGRESS_BAR_WIDTH / blockCount;

      // Offset X = indexEntier × tailleDunBloc - largeurDuBloc
      // (le "- blockWidth" évite que le bloc démarre tout de suite «dans» la barre)
      const offsetX = (steppedIndex + 1) * stepSize;

      // Fond de la barre
      ctx.fillStyle = "black";
      ctx.fillRect(PROGRESS_BAR_X, PROGRESS_BAR_Y, PROGRESS_BAR_WIDTH, PROGRESS_BAR_HEIGHT);

      // Dégradés des carrés de progression
      const firstGradient = ctx.createLinearGradient(PROGRESS_BAR_X + (blockWidth / 2), PROGRESS_BAR_Y + PROGRESS_BAR_HEIGHT, PROGRESS_BAR_X + (blockWidth / 2), PROGRESS_BAR_Y);
      firstGradient.addColorStop(0, 'rgba(40, 56, 196, 1)');
      firstGradient.addColorStop(0.33, 'rgba(40, 56, 196, 1)');
      firstGradient.addColorStop(0.44, 'rgba(88, 120, 236, 1)');
      firstGradient.addColorStop(0.55, 'rgba(132, 156, 240, 1)');
      firstGradient.addColorStop(0.77, 'rgba(132, 156, 240, 1)');
      firstGradient.addColorStop(0.87, 'rgba(88, 120, 227, 1)');
      firstGradient.addColorStop(1, 'rgba(40, 56, 196, 1)');
      
      const secondGradient = ctx.createLinearGradient(PROGRESS_BAR_X + (blockWidth / 2), PROGRESS_BAR_Y + PROGRESS_BAR_HEIGHT, PROGRESS_BAR_X + (blockWidth / 2), PROGRESS_BAR_Y);
      secondGradient.addColorStop(0, 'rgba(40, 56, 196, 1)');
      secondGradient.addColorStop(0.22, 'rgba(40, 56, 196, 1)');
      secondGradient.addColorStop(0.33, 'rgba(88, 120, 236, 1)');
      secondGradient.addColorStop(0.44, 'rgba(88, 120, 236, 1)');
      secondGradient.addColorStop(0.55, 'rgba(132, 156, 240, 1)');
      secondGradient.addColorStop(0.77, 'rgba(132, 156, 240, 1)');
      secondGradient.addColorStop(0.87, 'rgba(88, 120, 227, 1)');
      secondGradient.addColorStop(1, 'rgba(40, 56, 196, 1)');
      
      const thirdGradient = ctx.createLinearGradient(PROGRESS_BAR_X + (blockWidth / 2), PROGRESS_BAR_Y + PROGRESS_BAR_HEIGHT, PROGRESS_BAR_X + (blockWidth / 2), PROGRESS_BAR_Y);
      thirdGradient.addColorStop(0, 'rgba(40, 56, 196, 1)');
      thirdGradient.addColorStop(0.11, 'rgba(40, 56, 196, 1)');
      thirdGradient.addColorStop(0.22, 'rgba(88, 120, 236, 1)');
      thirdGradient.addColorStop(0.33, 'rgba(88, 120, 236, 1)');
      thirdGradient.addColorStop(0.44, 'rgba(132, 156, 240, 1)');
      thirdGradient.addColorStop(0.77, 'rgba(132, 156, 240, 1)');
      thirdGradient.addColorStop(0.87, 'rgba(88, 120, 227, 1)');
      thirdGradient.addColorStop(1, 'rgba(40, 56, 196, 1)');

      if (timestamp - startTime > cycleDuration) {
        // Déplacer le bloc à l'intérieur de la zone de la barre
        // cycle = la position repart à -blockWidth pour un enchaînement fluide
        const drawX = PROGRESS_BAR_X + offsetX - blockWidth;
        ctx.fillStyle = thirdGradient;
        ctx.fillRect(drawX, PROGRESS_BAR_Y, blockWidth, PROGRESS_BAR_HEIGHT);

        // On peut répéter le bloc pour plus de fluidité
        // (ici on dessine un 2e bloc "en avance" pour donner l'illusion d'un train de carrés).
        const secondBlockX = drawX - (blockWidth + blockSpacing);
        ctx.fillStyle = secondGradient;
        ctx.fillRect(secondBlockX, PROGRESS_BAR_Y, blockWidth, PROGRESS_BAR_HEIGHT);

        // On peut répéter le bloc pour plus de fluidité
        // (ici on dessine un 3e bloc "en avance" pour donner l'illusion d'un train de carrés).
        const thirdBlockX = drawX - (2 * (blockWidth + blockSpacing));
        ctx.fillStyle = firstGradient;
        ctx.fillRect(thirdBlockX, PROGRESS_BAR_Y, blockWidth, PROGRESS_BAR_HEIGHT); 
      }

      // Masque avant et après la barre
      ctx.fillStyle = "black";
      ctx.fillRect(PROGRESS_BAR_X - 30, PROGRESS_BAR_Y, 30, 9);
      ctx.fillRect(PROGRESS_BAR_X + PROGRESS_BAR_WIDTH, PROGRESS_BAR_Y, 20, 9);

    // Dessiner la barre de chargement
    const barWidth = 126;  // adapter selon la taille de votre image
    const barHeight = 15; // idem
    const barXOffset = 3.5;
    const barYOffset = 3;
    if (bar.complete) {
        ctx.drawImage(bar, PROGRESS_BAR_X - barXOffset, PROGRESS_BAR_Y - barYOffset, barWidth, barHeight);
    }

      // Boucler l’animation
      animationFrameId = requestAnimationFrame(draw);
    };

    // Lancer l’animation
    animationFrameId = requestAnimationFrame(draw);

    // Nettoyage quand le composant se démonte
    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      const windowsBootCanvas = document.getElementById("windows-boot-canvas");
      if (windowsBootCanvas) {
        windowsBootCanvas.style.opacity = '1';
      }
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => onComplete('windows-splash-screen'), 8000);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return <canvas id="windows-boot-canvas" ref={canvasRef} width={WIDTH} height={HEIGHT} className={`${styles.windowsBootCanvas} cursor-none`} />;
};

export default WindowsXPBootScreenCanvas;
