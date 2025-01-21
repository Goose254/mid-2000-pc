import React, { useRef, useEffect, useState } from 'react';

interface BiosSetupCanvasProps {
  onExit: () => void; // callback appelé quand l’utilisateur veut quitter le Setup
}

const BiosSetupCanvas: React.FC<BiosSetupCanvasProps> = ({ onExit }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // --- États pour la navigation ---
  // Onglet sélectionné dans le menu principal
  const [selectedMenuXIndex, setSelectedMenuXIndex] = useState(0);
  const [selectedMenuYIndex, setSelectedMenuYIndex] = useState(0);

  // Exemple d’onglets et leurs options
  const menus = [
    [
      {
        label: 'Stardand CMOS Features',
        submenu: ['test'],
      },
      {
        label: 'Advanced BIOS Features',
        submenu: ['test'],
      },
      {
        label: 'Advanced Chipset Features',
        submenu: ['test'],
      },
      {
        label: 'Integrated Peripherials',
        submenu: ['test'],
      },
      {
        label: 'Power Management Setup',
        submenu: ['test'],
      },
      {
        label: 'PnP/PCI Configurations',
        submenu: ['test'],
      },
      {
        label: 'PC Health Status',
        submenu: ['test'],
      }
    ],
    [
      {
        label: 'Frequency/Voltage Control',
        submenu: ['test'],
      },
      {
        label: 'Load Fail-Safe Defaults',
      },
      {
        label: 'Load Optimized Defaults',
      },
      {
        label: 'Set Supervisor Password',
      },
      {
        label: 'Set User Password',
      },
      {
        label: 'Save & Exit Setup',
      },
      {
        label: 'Exit Without Saving',
      }
    ],
  ];

  /**
   * 1) Dessine l’écran du Setup dans le canvas
   */
  const drawSetupScreen = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Dimensions et style
    const width = canvas.width;
    const height = canvas.height;

    // --- Fond bleu ---
    ctx.fillStyle = '#00A'; // Bleu un peu "criard"
    ctx.fillRect(0, 0, width, height);

    // --- Nom du BIOS en haut ---
    ctx.fillStyle = 'white';
    ctx.font = "16px 'PerfectDOS'";
    ctx.fillText("CMOS Setup Utility - Copyright (C) 1984-2005 Award Software", 135, 20);

    // --- Dessin des onglets ---
    // Ex: [Main] [Advanced] [Power] [Boot] [Exit]
    const menuXStart = 30;
    const menuYStart = 80;
    let currentX = menuXStart;
    let currentY = menuYStart;

    menus.forEach((column, menuXIndex) => {
      column.forEach((menu, menuYIndex) => {
        const label = menu.label;
        let textColor = '#FF5';
        // Onglet sélectionné => surbrillance
        if (menuXIndex === selectedMenuXIndex && menuYIndex === selectedMenuYIndex) {
          ctx.fillStyle = '#A00';
        } else {
          ctx.fillStyle = '#00A'; // un autre bleu
        }
        // Dessiner un rectangle (larg ~ 100 px, haut 24 px)
        if (menu.submenu) {
          ctx.fillRect(currentX, currentY - 14, ctx.measureText(label).width + (menu.submenu ? 16 : 0), 20);
        } else {
          ctx.fillRect(currentX + 16, currentY - 14, ctx.measureText(label).width + (menu.submenu ? 16 : 0), 20);
        }
  
        // Dessiner le texte du label
        if (menuXIndex === selectedMenuXIndex && menuYIndex === selectedMenuYIndex) {
          textColor = 'white';
        }
        ctx.fillStyle = textColor;
        ctx.fillText(label, currentX + 16, currentY);

        // Dessiner un triangle devant le texte du menu s'il y a un sous-menu
        if (menu.submenu) {
          const trianglePath = new Path2D();

          trianglePath.moveTo(currentX, currentY - 10);
          trianglePath.lineTo(currentX + 8, currentY - 5);
          trianglePath.lineTo(currentX, currentY);

          ctx.fill(trianglePath);
        }
  
        currentY += 35; // espace entre onglets
      });
      currentX += 400;
      currentY = menuYStart;
    });

    // --- Dessin d’une barre de statut en bas (ex: "F1 Help, ESC Exit, etc.") ---
    ctx.fillStyle = 'white';
    ctx.fillText("Esc : Quit", 15, 485);
    ctx.fillText("F10 : Save & Exit Setup", 15, 505);
    ctx.fillText("\u2191 \u2193 \u2190 \u2192    : Select Item", (width / 2) + 15, 485);

    ctx.fillStyle = '#FFF';
    ctx.fillRect(0, 30, width, 1)
    ctx.fillRect(0, 30, 2, height - 35)
    ctx.fillRect(width - 2, 30, 2, height - 35)
    ctx.fillRect(0, height - 5, width, 1)

    ctx.fillRect(3, 32, width - 6, 1)
    ctx.fillRect(3, 32, 2, height - 39)
    ctx.fillRect(width - 5, 32, 2, height - 39)
    ctx.fillRect(3, height - 7, width - 6, 1)

    ctx.fillRect(3, height - 80, width - 6, 1)
    ctx.fillRect(3, height - 140, width - 6, 1)
    ctx.fillRect((width / 2) - 1, 32, 2, 428)
  };

  /**
   * 2) Gère les touches clavier pour la navigation
   */
  const handleKeyDown = (e: KeyboardEvent) => {
    const key = e.key;

    if (key === 'ArrowLeft') {
      // Onglet précédent
      setSelectedMenuXIndex((prev) => (prev > 0 ? prev - 1 : menus.length - 1));
      e.preventDefault();
    } else if (key === 'ArrowRight') {
      // Onglet suivant
      setSelectedMenuXIndex((prev) => (prev < menus.length - 1 ? prev + 1 : 0));
      e.preventDefault();
    } else if (key === 'ArrowUp') {
      // Option précédente
      setSelectedMenuYIndex((prev) => (prev > 0 ? prev - 1 : menus[selectedMenuXIndex].length - 1));
      e.preventDefault();
    } else if (key === 'ArrowDown') {
      // Option suivante
      setSelectedMenuYIndex((prev) => (prev < menus[selectedMenuXIndex].length - 1 ? prev + 1 : 0));
      e.preventDefault();
    } else if (key === 'Enter') {
      // Valider l’option
      // Pour l’exemple, on va juste faire un console.log
      // On peut imaginer ouvrir un sous-menu, changer un paramètre, etc.
      e.preventDefault();
    } else if (key === 'Escape') {
      // Quitter le Setup
      onExit();
      e.preventDefault();
    }
  };

  /**
   * 3) useEffect pour initialiser le canvas et brancher l'écoute clavier
   */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Dimensions fixées par ex.
    canvas.width = 800;
    canvas.height = 600;

    // Fonction de dessin initial
    drawSetupScreen();

    // Ajout listener clavier
    window.addEventListener('keydown', handleKeyDown);

    // Nettoyage
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * 4) useEffect pour redessiner quand l’état change
   */
  useEffect(() => {
    drawSetupScreen();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMenuXIndex, selectedMenuYIndex]);

  return <canvas ref={canvasRef} style={{ outline: 'none' }} />;
};

export default BiosSetupCanvas;
