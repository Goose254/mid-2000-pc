import {
  InstancePlugin,
  Elements,
} from 'overlayscrollbars';

/**
 * Plugin d’instance OverlayScrollbars pour injecter des flèches de scroll façon Windows XP.
 * NOTE : on utilise un "InstancePlugin" => `windowsXpArrowsPlugin`.
 */
export const WindowsXpArrowsPlugin: InstancePlugin<'windowsXpArrowsPlugin'> = {
  windowsXpArrowsPlugin: {
    instance(osInstance, event, _osStatic) {
      // On peut choisir la "vitesse" de scroll ici :
      const SCROLL_STEP = 20;

      // Récupération des éléments de l’instance OverlayScrollbars
      const { scrollbarHorizontal, scrollbarVertical, scrollOffsetElement } = osInstance.elements();

      // Tableau pour stocker nos éléments (pour un éventuel nettoyage)
      const createdElements: HTMLElement[] = [];

      /**
       * Injecte deux boutons flèches pour la scrollbar donnée (verticale ou horizontale).
       * @param scrollEls - l’objet { scrollbar, track, handle } de la scrollbar
       * @param axis - 'vertical' ou 'horizontal'
       */
      function injectArrowsForScrollbar(
        scrollEls: Elements['scrollbarHorizontal'] | Elements['scrollbarVertical'],
        axis: 'horizontal' | 'vertical'
      ) {
        if (!scrollEls || !scrollEls.scrollbar) return;

        // On récupère l’élément "piste" (par ex. .os-scrollbar-track) 
        // pour y insérer les flèches (ou on peut les insérer dans `root`, selon le style voulu).
        const track = scrollEls.track;

        // Crée deux boutons (start & end), ex. up/down ou left/right
        if (axis === 'vertical') {
          const upBtn = createArrowButton('up', () => scrollBy(0, -SCROLL_STEP));
          const downBtn = createArrowButton('down', () => scrollBy(0, +SCROLL_STEP));
          track.appendChild(upBtn);
          track.appendChild(downBtn);

          // On stocke pour les enlever plus tard si on veut
          createdElements.push(upBtn, downBtn);
        } else {
          const leftBtn = createArrowButton('left', () => scrollBy(-SCROLL_STEP, 0));
          const rightBtn = createArrowButton('right', () => scrollBy(+SCROLL_STEP, 0));
          track.appendChild(leftBtn);
          track.appendChild(rightBtn);
          createdElements.push(leftBtn, rightBtn);
        }
      }

      /**
       * Injecte deux boutons flèches pour la scrollbar donnée (verticale ou horizontale).
       * @param scrollEls - l’objet { scrollbar, track, handle } de la scrollbar
       * @param axis - 'vertical' ou 'horizontal'
       */
      function injectCornerElement(scrollEls: Elements['scrollbarHorizontal']) {
        const el = document.createElement('div');
        el.classList.add('os-scrollbar-corner');
        scrollEls.scrollbar.appendChild(el);

        // On stocke pour les enlever plus tard si on veut
        createdElements.push(el);
      }

      /**
       * Crée un bouton flèche `<div class="os-scrollbar-button ...">` + gestion d'événement clic.
       */
      function createArrowButton(direction: 'up' | 'down' | 'left' | 'right', onClick: () => void) {
        const btn = document.createElement('button');
        btn.classList.add('os-scrollbar-button', `os-scrollbar-button-${direction}`);
        btn.addEventListener('click', (evt) => {
          evt.preventDefault();
          onClick();
        });
        return btn;
      }

      /**
       * Défile le contenu, en modifiant `scrollOffsetElement.scrollLeft/Top`.
       * On pourrait faire un scroll "progressif" ou "smooth" si besoin.
       */
      function scrollBy(deltaX: number, deltaY: number) {
        scrollOffsetElement.scrollLeft += deltaX;
        scrollOffsetElement.scrollTop += deltaY;
        // Ou on pourrait faire un scroll lissé via:
        // scrollOffsetElement.scrollBy({ left: deltaX, top: deltaY, behavior: 'smooth' });
      }

      // Injecte les flèches si la scrollbar verticale existe
      if (scrollbarVertical?.scrollbar) {
        injectArrowsForScrollbar(scrollbarVertical, 'vertical');
      }
      // Injecte les flèches si la scrollbar horizontale existe
      if (scrollbarHorizontal?.scrollbar) {
        injectArrowsForScrollbar(scrollbarHorizontal, 'horizontal');
      }

      // Injecte les flèches si la scrollbar verticale existe
      if (scrollbarVertical?.scrollbar && scrollbarHorizontal?.scrollbar) {
        injectCornerElement(scrollbarHorizontal);
      }

      // BONUS : Si on veut nettoyer à la destruction, on peut écouter l’événement "destroyed"
      // et enlever nos boutons du DOM si besoin.
      event('destroyed', () => {
        createdElements.forEach((btn) => {
          btn.remove();
        });
      });

      // On peut retourner un objet si on souhaite exposer des méthodes.
      // Sinon, `void` ou rien du tout suffisent.
      return {
        // par ex. on pourrait rajouter un "destroy()" personnalisé, etc.
      };
    },
  },
};
