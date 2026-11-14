(() => {
  const hero = document.querySelector('.x5-hero, .b2b-hero');
  if (hero && document.documentElement.classList.contains('x5-reveal-enabled')) {
    requestAnimationFrame(() => requestAnimationFrame(() => hero.classList.add('is-entered')));
  }

  const parallaxItems = [...document.querySelectorAll('[data-parallax]')];
  if (document.documentElement.classList.contains('x5-parallax-enabled') && parallaxItems.length) {
    let parallaxFrame = 0;
    const updateParallax = () => {
      parallaxFrame = 0;
      const viewportHeight = window.innerHeight || 1;
      const strength = window.matchMedia('(max-width: 600px)').matches ? 8 : 14;
      parallaxItems.forEach(item => {
        const bounds = item.getBoundingClientRect();
        if (bounds.bottom < 0 || bounds.top > viewportHeight) {
          item.style.setProperty('--parallax-offset', '0px');
          return;
        }
        const range = (viewportHeight + bounds.height) / 2;
        const progress = Math.max(-1, Math.min(1, (bounds.top + bounds.height / 2 - viewportHeight / 2) / range));
        item.style.setProperty('--parallax-offset', `${-progress * strength}px`);
      });
    };
    const requestParallaxFrame = () => {
      if (!parallaxFrame) parallaxFrame = requestAnimationFrame(updateParallax);
    };
    window.addEventListener('scroll', requestParallaxFrame, { passive: true });
    window.addEventListener('resize', requestParallaxFrame, { passive: true });
    requestParallaxFrame();
  }

  const wordRevealItems = [...document.querySelectorAll('[data-word-reveal]')];
  if (wordRevealItems.length && document.documentElement.classList.contains('has-hero-entrance')) {
    wordRevealItems.forEach(item => {
      const walker = document.createTreeWalker(item, NodeFilter.SHOW_TEXT);
      const textNodes = [];
      while (walker.nextNode()) textNodes.push(walker.currentNode);
      let wordIndex = 0;
      const delayOffset = Number(item.dataset.wordRevealDelay) || 0;

      textNodes.forEach(textNode => {
        const parts = textNode.textContent.match(/(?:в|к|с|у|о|об|от|до|из|на|по|за|над|под|при|без|для|про|через|между)\u00a0[\p{L}\d]+|\s+|\S+/giu) || [];
        const fragment = document.createDocumentFragment();
        parts.forEach(part => {
          if (/^\s+$/.test(part)) {
            fragment.append(document.createTextNode(part));
            return;
          }
          const word = document.createElement('span');
          word.className = 'portfolio__word';
          word.style.setProperty('--hero-word-delay', `${delayOffset + 80 + wordIndex * 58}ms`);
          word.textContent = part;
          wordIndex += 1;
          fragment.append(word);
        });
        textNode.replaceWith(fragment);
      });
    });
  }

  const revealItems = [...document.querySelectorAll('[data-reveal]')];
  if (document.documentElement.classList.contains('x5-reveal-enabled') && revealItems.length) {
    revealItems.forEach(item => item.style.setProperty('--x5-reveal-delay', `${Number(item.dataset.revealDelay) || 0}ms`));
    const loadItems = revealItems.filter(item => item.dataset.reveal === 'load');
    requestAnimationFrame(() => loadItems.forEach(item => item.classList.add('is-visible')));

    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });

    revealItems.filter(item => item.dataset.reveal !== 'load').forEach(item => observer.observe(item));
  }

  const gallery = document.querySelector('[data-widget-gallery]');
  const track = gallery?.querySelector('[data-widget-track]');
  if (!gallery || !track) return;

  const move = direction => {
    const item = track.querySelector('.x5-widget-gallery__item');
    const gap = Number.parseFloat(getComputedStyle(track).columnGap) || 0;
    track.scrollBy({ left: direction * ((item?.getBoundingClientRect().width || track.clientWidth) + gap), behavior: 'smooth' });
  };

  gallery.querySelector('[data-widget-prev]')?.addEventListener('click', () => move(-1));
  gallery.querySelector('[data-widget-next]')?.addEventListener('click', () => move(1));

  let dragStart = null;
  let dragged = false;
  track.addEventListener('pointerdown', event => {
    if (event.button !== 0) return;
    dragStart = { x: event.clientX, scrollLeft: track.scrollLeft };
    dragged = false;
    track.classList.add('is-dragging');
    track.setPointerCapture(event.pointerId);
  });
  track.addEventListener('pointermove', event => {
    if (!dragStart) return;
    const distance = event.clientX - dragStart.x;
    if (Math.abs(distance) > 3) dragged = true;
    if (dragged) track.scrollLeft = dragStart.scrollLeft - distance;
  });
  const endDrag = () => {
    if (!dragStart) return;
    dragStart = null;
    track.classList.remove('is-dragging');
    if (dragged) requestAnimationFrame(() => { dragged = false; });
  };
  track.addEventListener('pointerup', endDrag);
  track.addEventListener('pointercancel', endDrag);
  track.addEventListener('lostpointercapture', endDrag);
})();
