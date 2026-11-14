const bindRussianPrepositions = (root) => {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      if (!node.parentElement || node.parentElement.closest('script,style,textarea,svg,canvas,[aria-hidden="true"]')) return NodeFilter.FILTER_REJECT;
      return /(^|[\s])(?:в|к|с|у|о|об|от|до|из|на|по|за|над|под|при|без|для|про|через|между)[\s]+[\p{L}\d]/iu.test(node.textContent)
        ? NodeFilter.FILTER_ACCEPT
        : NodeFilter.FILTER_REJECT;
    },
  });
  const textNodes = [];
  while (walker.nextNode()) textNodes.push(walker.currentNode);
  textNodes.forEach((node) => {
    node.textContent = node.textContent.replace(
      /(^|\s)(в|к|с|у|о|об|от|до|из|на|по|за|над|под|при|без|для|про|через|между)\s+(?=[\p{L}\d])/giu,
      '$1$2\u00a0',
    );
  });
};

bindRussianPrepositions(document.body);

const syncHoverPillTickerSpeed = () => {
  document.querySelectorAll('.hover-pill__ticker').forEach((ticker) => {
    const distance = ticker.scrollWidth / 2;
    if (distance > 0) ticker.style.setProperty('--ticker-duration', `${distance / 42}s`);
  });
};
syncHoverPillTickerSpeed();
document.fonts?.ready.then(syncHoverPillTickerSpeed);
window.addEventListener('resize', syncHoverPillTickerSpeed, { passive: true });

const topbar = document.querySelector('.topbar');
const caseHeaderHero = topbar?.classList.contains('x5-topbar')
  ? document.querySelector('.x5-hero, .b2b-hero')
  : null;
const desktopResumeLabel = document.querySelector('.topbar__cv .topbar__link-label span:last-child');
const topbarResumeLink = document.querySelector('.topbar__cv');
if (desktopResumeLabel) desktopResumeLabel.textContent = 'резюме';
topbarResumeLink?.setAttribute('aria-label', 'Смотреть резюме');
const mobileResumeLabel = document.querySelector('.topbar__cv .topbar__mobile-label');
const experienceResumeLabel = document.querySelector('.resume-button__label');
const footerResumeLabel = document.querySelector('.footer__actions a[href$=".pdf"]');
if (mobileResumeLabel) mobileResumeLabel.textContent = 'Смотреть резюме';
if (experienceResumeLabel) experienceResumeLabel.textContent = 'Посмотреть резюме';
if (footerResumeLabel) footerResumeLabel.textContent = 'Смотреть резюме';

const telegramLink = document.querySelector('.topbar__contact');
const telegramTile = document.querySelector('.telegram-icon');
const telegramAnimationContainer = document.querySelector('[data-telegram-animation]');
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const hero = document.querySelector('.hero');
const heroTitle = hero?.querySelector('h1');
const heroDescription = hero?.querySelector(':scope > p');

const revealGroups = [
  '.hero__intro',
  '.portfolio__heading .eyebrow, .portfolio__heading h2',
  '.portfolio__details>.tags, .portfolio__copy>p',
  '.projects .project',
  '.approach>.eyebrow, .approach h2',
  '.archive__heading .eyebrow, .archive__heading h2, .archive__board',
  '.experience__heading .eyebrow, .experience__heading h2',
  '.experience__item, .resume-button',
  '.concept-lab',
  '.footer__contact h2, .footer__contact>p, .footer__actions, .footer__signature',
];

if ('IntersectionObserver' in window && !prefersReducedMotion.matches) {
  document.documentElement.classList.add('has-scroll-reveal');
  document.documentElement.classList.add('has-hero-entrance');
  const initialEntranceTargets = [];
  const topbar = document.querySelector('.topbar');
  const showreelSection = document.querySelector('.showreel');
  const floatingNav = document.querySelector('.float-nav');
  topbar?.classList.add('is-entrance-pending');
  floatingNav?.classList.add('is-entrance-pending');

  const revealWords = (element, startDelay, stepDelay, wordClass = 'hero__word') => {
    if (!element) return;
    const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
    const textNodes = [];
    while (walker.nextNode()) textNodes.push(walker.currentNode);
    let wordIndex = 0;

    textNodes.forEach((textNode) => {
      const parts = textNode.textContent.match(/(?:в|к|с|у|о|об|от|до|из|на|по|за|над|под|при|без|для|про|через|между)\u00a0[\p{L}\d]+|\s+|\S+/giu) || [];
      const fragment = document.createDocumentFragment();
      parts.forEach((part) => {
        if (/^\s+$/.test(part)) {
          fragment.append(document.createTextNode(part));
          return;
        }
        const word = document.createElement('span');
        word.className = wordClass;
        word.style.setProperty('--hero-word-delay', `${startDelay + wordIndex * stepDelay}ms`);
        word.textContent = part;
        wordIndex += 1;
        fragment.append(word);
      });
      textNode.replaceWith(fragment);
    });
    return wordIndex;
  };

  const titleStartDelay = 220;
  const titleWordStep = 68;
  const titleWordCount = revealWords(heroTitle, titleStartDelay, titleWordStep);
  const descriptionStartDelay = titleStartDelay + Math.max(0, titleWordCount - 1) * titleWordStep + 100;
  const descriptionWordStep = 58;
  revealWords(heroDescription, descriptionStartDelay, descriptionWordStep);
  let heroDescriptionStarted = false;
  let showreelIsVisible = false;
  let showreelWasRevealed = false;
  const revealShowreelWhenReady = () => {
    if (!heroDescriptionStarted || !showreelIsVisible || showreelWasRevealed || !showreelSection) return;
    showreelWasRevealed = true;
    showreelSection.classList.add('is-scroll-revealed');
  };
  revealWords(document.querySelector('.portfolio__heading h2'), 80, 58, 'portfolio__word');
  revealWords(document.querySelector('.approach h2'), 80, 68, 'approach__word');
  revealWords(document.querySelector('.tefs-outcome__copy h2'), 80, 58, 'portfolio__word');
  if (showreelSection) {
    showreelSection.dataset.scrollReveal = '';
    showreelSection.style.setProperty('--scroll-reveal-delay', '200ms');
  }
  showreelSection?.addEventListener('transitionend', (event) => {
    if (event.target !== showreelSection || event.propertyName !== 'opacity') return;
    floatingNav?.classList.add('is-entrance-visible');
  });

  revealGroups.forEach((selector) => {
    const elements = document.querySelectorAll(selector);
    elements.forEach((element, index) => {
      element.dataset.scrollReveal = '';
      let delay = Math.min(index, 5) * 70;
      if (element.matches('.hero__intro')) delay += 120;
      element.style.setProperty('--scroll-reveal-delay', `${delay}ms`);
      if (element.closest('.hero')) initialEntranceTargets.push(element);
    });
  });

  const scrollRevealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      if (entry.target === showreelSection) {
        showreelIsVisible = true;
        observer.unobserve(entry.target);
        revealShowreelWhenReady();
        return;
      }
      entry.target.classList.add('is-scroll-revealed');
      observer.unobserve(entry.target);
    });
  }, {threshold:0.08, rootMargin:'0px 0px -4% 0px'});

  document.querySelectorAll('[data-scroll-reveal]').forEach((element) => {
    if (!element.closest('.hero') && !initialEntranceTargets.includes(element)) scrollRevealObserver.observe(element);
  });
  if (showreelSection) scrollRevealObserver.observe(showreelSection);
  requestAnimationFrame(() => requestAnimationFrame(() => {
    topbar?.classList.add('is-entrance-visible');
    hero?.classList.add('is-entrance-visible');
    if (window.matchMedia('(max-width: 600px)').matches) floatingNav?.classList.add('is-entrance-visible');
    initialEntranceTargets.forEach((element) => element.classList.add('is-scroll-revealed'));
    document.documentElement.classList.remove('js-motion-pending');
    window.setTimeout(() => {
      heroDescriptionStarted = true;
      revealShowreelWhenReady();
    }, descriptionStartDelay);
  }));
}

const b2bPreviewVideo = document.querySelector('[data-b2b-video-preview]');
const b2bVideoDialog = document.querySelector('[data-b2b-video-dialog]');
const b2bDialogVideo = b2bVideoDialog?.querySelector('video');
const b2bMobileVideoQuery = window.matchMedia('(max-width: 600px)');

if (b2bPreviewVideo && b2bVideoDialog && b2bDialogVideo) {
  const updateB2bVideoTrigger = () => {
    if (b2bMobileVideoQuery.matches) {
      b2bPreviewVideo.tabIndex = 0;
      b2bPreviewVideo.setAttribute('role', 'button');
      b2bPreviewVideo.setAttribute('aria-haspopup', 'dialog');
    } else {
      b2bPreviewVideo.removeAttribute('tabindex');
      b2bPreviewVideo.removeAttribute('role');
      b2bPreviewVideo.removeAttribute('aria-haspopup');
    }
  };

  const openB2bVideo = () => {
    if (!b2bMobileVideoQuery.matches || b2bVideoDialog.open) return;
    b2bPreviewVideo.pause();
    b2bDialogVideo.src = b2bPreviewVideo.currentSrc || b2bPreviewVideo.src;
    b2bDialogVideo.poster = b2bPreviewVideo.poster;
    b2bVideoDialog.showModal();
    b2bDialogVideo.currentTime = b2bPreviewVideo.currentTime || 0;
    b2bDialogVideo.play().catch(() => {});
  };

  const closeB2bVideo = () => {
    if (b2bVideoDialog.open) b2bVideoDialog.close();
  };

  updateB2bVideoTrigger();
  b2bMobileVideoQuery.addEventListener?.('change', updateB2bVideoTrigger);
  b2bPreviewVideo.addEventListener('click', openB2bVideo);
  b2bVideoDialog.closest('body')?.querySelector('[data-b2b-video-open]')?.addEventListener('click', openB2bVideo);
  b2bPreviewVideo.addEventListener('keydown', event => {
    if (!b2bMobileVideoQuery.matches || (event.key !== 'Enter' && event.key !== ' ')) return;
    event.preventDefault();
    openB2bVideo();
  });
  b2bVideoDialog.querySelector('[data-b2b-video-close]')?.addEventListener('click', closeB2bVideo);
  b2bVideoDialog.addEventListener('click', event => {
    if (event.target === b2bVideoDialog) closeB2bVideo();
  });
  b2bVideoDialog.addEventListener('close', () => {
    b2bDialogVideo.pause();
    b2bDialogVideo.removeAttribute('src');
    b2bDialogVideo.load();
    if (b2bMobileVideoQuery.matches) b2bPreviewVideo.play().catch(() => {});
  });
}

const b2bPriceImages = document.querySelectorAll('.b2b-price-card img');
const b2bImageDialog = document.querySelector('[data-b2b-image-dialog]');
const b2bDialogImage = b2bImageDialog?.querySelector('[data-b2b-image-dialog-img]');

if (b2bPriceImages.length && b2bImageDialog && b2bDialogImage) {
  const openB2bPriceImage = image => {
    if (!b2bMobileVideoQuery.matches || b2bImageDialog.open) return;
    b2bDialogImage.src = image.currentSrc || image.src;
    b2bDialogImage.alt = image.alt;
    b2bImageDialog.showModal();
  };

  b2bPriceImages.forEach(image => {
    image.tabIndex = 0;
    image.setAttribute('role', 'button');
    image.setAttribute('aria-haspopup', 'dialog');
    image.addEventListener('click', () => openB2bPriceImage(image));
    image.addEventListener('keydown', event => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      event.preventDefault();
      openB2bPriceImage(image);
    });
  });

  b2bImageDialog.querySelector('[data-b2b-image-close]')?.addEventListener('click', () => b2bImageDialog.close());
  b2bImageDialog.addEventListener('click', event => {
    if (event.target === b2bImageDialog) b2bImageDialog.close();
  });
  b2bImageDialog.addEventListener('close', () => b2bDialogImage.removeAttribute('src'));
}

const archiveShowAllButton = document.querySelector('[data-archive-show-all]');
archiveShowAllButton?.addEventListener('click', () => {
  const archive = archiveShowAllButton.closest('.archive');
  const isExpanded = archive.classList.toggle('is-expanded');
  archiveShowAllButton.setAttribute('aria-expanded', String(isExpanded));
  archiveShowAllButton.textContent = isExpanded ? 'Скрыть' : 'Показать все';
});

if (window.lottie && telegramLink && telegramTile && telegramAnimationContainer) {
  const telegramAnimation = window.lottie.loadAnimation({
    container: telegramAnimationContainer,
    renderer: 'svg',
    loop: true,
    autoplay: false,
    path: 'assets/icons/telegram.json',
  });
  let stopAfterCycle = false;
  let isActive = false;

  const playTelegramAnimation = () => {
    isActive = true;
    stopAfterCycle = false;
    if (!prefersReducedMotion.matches) telegramAnimation.play();
  };

  const resetTelegramAnimation = () => {
    isActive = false;
    stopAfterCycle = !prefersReducedMotion.matches && !telegramAnimation.isPaused;
    if (!stopAfterCycle) telegramAnimation.goToAndStop(0, true);
  };

  telegramAnimation.addEventListener('DOMLoaded', () => {
    telegramTile.classList.add('is-ready');
    telegramAnimation.goToAndStop(0, true);
  });

  telegramAnimation.addEventListener('loopComplete', () => {
    if (!stopAfterCycle) return;
    stopAfterCycle = false;
    telegramAnimation.goToAndStop(0, true);
  });

  telegramLink.addEventListener('mouseenter', playTelegramAnimation);
  telegramLink.addEventListener('focus', playTelegramAnimation);
  telegramLink.addEventListener('mouseleave', resetTelegramAnimation);
  telegramLink.addEventListener('blur', resetTelegramAnimation);
  prefersReducedMotion.addEventListener('change', (event) => {
    if (event.matches) {
      stopAfterCycle = false;
      telegramAnimation.goToAndStop(0, true);
    } else if (isActive) {
      telegramAnimation.play();
    }
  });
}

const showreelScreen = document.querySelector('[data-showreel-screen]');
const showreelToggle = showreelScreen?.querySelector('[data-showreel-toggle]');
const showreelDialog = document.querySelector('[data-showreel-dialog]');
const showreelFullVideo = showreelDialog?.querySelector('video');

if (showreelScreen && showreelToggle && showreelDialog && showreelFullVideo) {
  let showreelBounds;
  let showreelHalfWidth = 0;
  let showreelHalfHeight = 0;
  let showreelPointerFrame = 0;
  let showreelPointerX = 0;
  let showreelPointerY = 0;
  let showreelClientX = 0;
  let showreelClientY = 0;
  const measureShowreel = () => {
    showreelBounds = showreelScreen.getBoundingClientRect();
    showreelHalfWidth = showreelToggle.offsetWidth / 2;
    showreelHalfHeight = showreelToggle.offsetHeight / 2;
  };
  const moveShowreelCursor = () => {
    if (!showreelBounds) measureShowreel();
    showreelPointerX = Math.max(showreelHalfWidth, Math.min(showreelBounds.width - showreelHalfWidth, showreelClientX - showreelBounds.left));
    showreelPointerY = Math.max(showreelHalfHeight, Math.min(showreelBounds.height - showreelHalfHeight, showreelClientY - showreelBounds.top));
    showreelToggle.style.setProperty('--cursor-x', `${showreelPointerX}px`);
    showreelToggle.style.setProperty('--cursor-y', `${showreelPointerY}px`);
    showreelPointerFrame = 0;
  };

  const openShowreel = () => {
    if (showreelDialog.open) return;
    showreelDialog.showModal();
    showreelFullVideo.currentTime = 0;
    showreelFullVideo.play().catch(() => {});
  };

  const closeShowreel = () => {
    if (showreelDialog.open) showreelDialog.close();
  };

  showreelScreen.addEventListener('click', openShowreel);
  showreelDialog.querySelector('[data-showreel-close]')?.addEventListener('click', closeShowreel);
  showreelDialog.addEventListener('click', (event) => {
    if (event.target === showreelDialog) closeShowreel();
  });
  showreelDialog.addEventListener('close', () => {
    showreelFullVideo.pause();
    showreelFullVideo.currentTime = 0;
  });

  showreelScreen.addEventListener('pointerenter', (event) => {
    if (event.pointerType !== 'mouse') return;
    measureShowreel();
  });
  showreelScreen.addEventListener('pointermove', (event) => {
    if (event.pointerType !== 'mouse') return;
    showreelClientX = event.clientX;
    showreelClientY = event.clientY;
    if (!showreelPointerFrame) showreelPointerFrame = window.requestAnimationFrame(moveShowreelCursor);
    showreelScreen.classList.add('has-cursor-control');
  });
  showreelScreen.addEventListener('pointerleave', () => {
    showreelScreen.classList.remove('has-cursor-control');
    showreelBounds = null;
  });
  window.addEventListener('resize', () => {
    if (!showreelScreen.classList.contains('has-cursor-control')) return;
    measureShowreel();
    if (!showreelPointerFrame) showreelPointerFrame = window.requestAnimationFrame(moveShowreelCursor);
  }, { passive: true });
}

document.querySelectorAll('.project__media').forEach((media) => {
  const pill = media.querySelector('.project__hover-pill');
  if (!pill) return;
  let bounds;
  let halfWidth = 0;
  let halfHeight = 0;
  let pointerFrame = 0;
  let clientX = 0;
  let clientY = 0;
  let pillWidth = 0;
  const measure = () => {
    bounds = media.getBoundingClientRect();
    pillWidth = pill.offsetWidth;
    halfHeight = pill.offsetHeight / 2;
  };
  const movePill = () => {
    if (!bounds) measure();
    const pointerX = clientX - bounds.left;
    const gap = 22;
    let x = pointerX + gap;
    if (x + pillWidth > bounds.width - 12) x = Math.max(12, pointerX - pillWidth - gap);
    const y = Math.max(halfHeight, Math.min(bounds.height - halfHeight, clientY - bounds.top));
    pill.style.setProperty('--pill-x', `${x}px`);
    pill.style.setProperty('--pill-y', `${y}px`);
    pointerFrame = 0;
  };
  media.addEventListener('pointerenter', (event) => {
    if (event.pointerType !== 'mouse') return;
    measure();
  });
  media.addEventListener('pointermove', (event) => {
    if (event.pointerType !== 'mouse') return;
    clientX = event.clientX;
    clientY = event.clientY;
    if (!pointerFrame) pointerFrame = window.requestAnimationFrame(movePill);
    media.classList.add('is-hovering');
  });
  media.addEventListener('pointerleave', () => {
    media.classList.remove('is-hovering');
    bounds = null;
  });
});

const downloadLink = document.querySelector('.topbar__cv');
const downloadTile = document.querySelector('.download-icon');
const downloadAnimationContainer = document.querySelector('[data-download-animation]');

if (window.lottie && downloadLink && downloadTile && downloadAnimationContainer) {
  const downloadAnimation = window.lottie.loadAnimation({
    container: downloadAnimationContainer,
    renderer: 'svg',
    loop: false,
    autoplay: false,
    path: 'assets/icons/file-text.json',
  });
  let resetDownloadAfterPlay = false;

  const playDownloadAnimation = () => {
    resetDownloadAfterPlay = false;
    if (prefersReducedMotion.matches) return;
    downloadAnimation.playSegments([0, downloadAnimation.totalFrames], true);
  };

  const resetDownloadAnimation = () => {
    if (prefersReducedMotion.matches || downloadAnimation.isPaused) {
      downloadAnimation.goToAndStop(0, true);
    } else {
      resetDownloadAfterPlay = true;
    }
  };

  downloadAnimation.addEventListener('DOMLoaded', () => {
    downloadTile.classList.add('is-ready');
    downloadAnimation.goToAndStop(0, true);
  });

  downloadAnimation.addEventListener('complete', () => {
    if (!resetDownloadAfterPlay) return;
    resetDownloadAfterPlay = false;
    downloadAnimation.goToAndStop(0, true);
  });

  downloadLink.addEventListener('mouseenter', playDownloadAnimation);
  downloadLink.addEventListener('focus', playDownloadAnimation);
  downloadLink.addEventListener('mouseleave', resetDownloadAnimation);
  downloadLink.addEventListener('blur', resetDownloadAnimation);
  prefersReducedMotion.addEventListener('change', (event) => {
    if (event.matches) {
      resetDownloadAfterPlay = false;
      downloadAnimation.goToAndStop(0, true);
    }
  });
}

const tefsExternalLinks = [...document.querySelectorAll('[data-tefs-external-link]')];
if (window.lottie && tefsExternalLinks.length) {
  tefsExternalLinks.forEach((icon) => {
    const anchor = icon.closest('a');
    if (!anchor) return;
    const animation = window.lottie.loadAnimation({
      container: icon,
      renderer: 'svg',
      loop: false,
      autoplay: false,
      path: 'https://useanimations.com/icons/external-link.json',
    });
    const playAnimation = () => {
      if (!prefersReducedMotion.matches && animation.isPaused) {
        animation.playSegments([0, animation.totalFrames], true);
      }
    };
    anchor.addEventListener('mouseenter', playAnimation);
    anchor.addEventListener('focus', playAnimation);
  });
}

const tefsMotionVideo = document.querySelector('[data-tefs-motion-video]');
if (tefsMotionVideo) {
  const tefsMotionFrame = tefsMotionVideo.closest('.tefs-webpages__challenge') || tefsMotionVideo;
  const startTefsMotion = () => {
    if (!tefsMotionVideo.src) {
      tefsMotionVideo.src = tefsMotionVideo.dataset.src;
      tefsMotionVideo.load();
    }
    if (!prefersReducedMotion.matches) tefsMotionVideo.play().catch(() => {});
  };
  const frameRect = tefsMotionFrame.getBoundingClientRect();
  if (frameRect.top < window.innerHeight + 240 && frameRect.bottom > -240) startTefsMotion();
  if ('IntersectionObserver' in window) {
    const tefsMotionObserver = new IntersectionObserver(([entry], observer) => {
      if (!entry.isIntersecting) return;
      startTefsMotion();
      observer.disconnect();
    }, { rootMargin: '240px 0px' });
    tefsMotionObserver.observe(tefsMotionFrame);
  } else startTefsMotion();
}

let previousScrollY = window.scrollY;
let scrollFramePending = false;

topbar?.classList.toggle('is-scrolled', previousScrollY > 24);

const syncCaseTopbarVisibility = (scrollY) => {
  if (!caseHeaderHero || !topbar?.classList.contains('x5-topbar')) return false;
  const heroBottom = caseHeaderHero.getBoundingClientRect().bottom + scrollY;
  const active = scrollY >= heroBottom - 1;
  topbar.classList.toggle('is-active', active);
  if (!active) topbar.classList.remove('is-hidden');
  return active;
};

syncCaseTopbarVisibility(previousScrollY);
window.addEventListener('resize', () => syncCaseTopbarVisibility(window.scrollY), { passive: true });

window.addEventListener('scroll', () => {
  if (scrollFramePending) return;
  scrollFramePending = true;

  window.requestAnimationFrame(() => {
    const currentScrollY = window.scrollY;
    const scrollDelta = currentScrollY - previousScrollY;
    const wasCaseHeaderActive = topbar?.classList.contains('is-active') ?? false;
    const isCaseHeaderActive = syncCaseTopbarVisibility(currentScrollY);

    topbar?.classList.toggle('is-scrolled', currentScrollY > 24);

    if (caseHeaderHero && !isCaseHeaderActive) {
      topbar?.classList.remove('is-hidden');
    } else if (caseHeaderHero && !wasCaseHeaderActive && isCaseHeaderActive) {
      topbar?.classList.remove('is-hidden');
    } else if (currentScrollY < 80 || scrollDelta < -6) {
      topbar?.classList.remove('is-hidden');
    } else if (scrollDelta > 6) {
      topbar?.classList.add('is-hidden');
    }

    previousScrollY = currentScrollY;
    scrollFramePending = false;
  });
}, { passive: true });

const floatingNavLinks = [...document.querySelectorAll('.float-nav > a[href^="#"]')];
const floatingNavHashes = new Set(floatingNavLinks.map((link) => link.hash));
const floatingNavReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

if (floatingNavHashes.has(window.location.hash)) {
  history.replaceState(null, '', `${window.location.pathname}${window.location.search}`);
  window.scrollTo(0, 0);
}

floatingNavLinks.forEach((link) => {
  link.addEventListener('click', (event) => {
    const target = document.querySelector(link.hash);
    if (!target) return;
    event.preventDefault();
    target.scrollIntoView({ behavior: floatingNavReducedMotion.matches ? 'auto' : 'smooth', block: 'start' });
  });
});

const floatingNavSections = floatingNavLinks
  .map((link) => document.querySelector(link.getAttribute('href')))
  .filter(Boolean);

if ('IntersectionObserver' in window && floatingNavSections.length) {
  const activeFloatingSections = new Set();
  const floatingNavObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) activeFloatingSections.add(entry.target.id);
      else activeFloatingSections.delete(entry.target.id);
    });

    const current = floatingNavSections.find((section) => activeFloatingSections.has(section.id));
    floatingNavLinks.forEach((link) => {
      const active = current && link.hash === `#${current.id}`;
      link.classList.toggle('is-active', Boolean(active));
      if (active) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
  }, {
    rootMargin: window.matchMedia('(max-width: 600px)').matches ? '-15% 0px -70% 0px' : '-42% 0px -42% 0px',
    threshold: 0,
  });

  floatingNavSections.forEach((section) => floatingNavObserver.observe(section));
}

const archiveCards = [...document.querySelectorAll('[data-archive-card]')];
const desktopArchive = window.matchMedia('(min-width: 901px)');
const archiveBoard = document.querySelector('.archive__board');
const archiveWorld = document.querySelector('.archive__universe');
const archiveTile = document.querySelector('.archive__world');
const archivePeriodX = 2704;
const archivePeriodY = 1560;
const archiveViewStorageKey = 'vasiliy-romanov-portfolio-archive-view-v5';

const syncArchiveCopies = () => {
  if (!archiveWorld || !archiveTile) return;
  archiveWorld.querySelectorAll(':scope > .archive__tile--copy').forEach((copy) => copy.remove());
  if (!desktopArchive.matches) return;

  for (let row = 0; row < 3; row += 1) {
    for (let column = 0; column < 3; column += 1) {
      if (row === 1 && column === 1) continue;
      const tileCopy = archiveTile.cloneNode(true);
      tileCopy.classList.add('archive__tile--copy');
      tileCopy.setAttribute('aria-hidden', 'true');
      tileCopy.inert = true;
      tileCopy.style.left = `${column * archivePeriodX}px`;
      tileCopy.style.top = `${row * archivePeriodY}px`;
      archiveWorld.append(tileCopy);
    }
  }
};

syncArchiveCopies();
desktopArchive.addEventListener('change', syncArchiveCopies);

if (archiveBoard && desktopArchive.matches && !window.matchMedia('(prefers-reduced-motion: reduce)').matches && 'IntersectionObserver' in window) {
  const archiveHintObserver = new IntersectionObserver(([entry]) => {
    if (!entry.isIntersecting) return;
    archiveBoard.classList.add('has-nudge-hint');
    archiveHintObserver.disconnect();
  }, { threshold: 0.2 });
  archiveHintObserver.observe(archiveBoard);
}

if (archiveBoard && archiveWorld && archiveTile && desktopArchive.matches) {
  archiveCards.forEach((card, index) => {
    card.style.left = `${(index % 4) * 676}px`;
    card.style.top = `${Math.floor(index / 4) * 520}px`;
  });
  syncArchiveCopies();

  try {
    const savedView = JSON.parse(localStorage.getItem(archiveViewStorageKey) || 'null');
    if (savedView && Number.isFinite(savedView.left) && Number.isFinite(savedView.top)) {
      archiveWorld.style.left = `${savedView.left}px`;
      archiveWorld.style.top = `${savedView.top}px`;
    }
  } catch {
    // The board stays usable when local storage is disabled.
  }

  const wrap = (offset, period) => {
    const relativeOffset = ((offset + 2 * period) % period + period) % period;
    return relativeOffset - 2 * period;
  };
  const saveArchiveView = () => {
    try {
      localStorage.setItem(archiveViewStorageKey, JSON.stringify({
        left: archiveWorld.offsetLeft,
        top: archiveWorld.offsetTop,
      }));
    } catch {
      // Panning remains available when local storage is disabled.
    }
  };
  let panStart;
  archiveBoard.addEventListener('pointerdown', (event) => {
    if (!desktopArchive.matches || event.button !== 0) return;
    event.preventDefault();
    archiveBoard.closest('.archive')?.querySelector('.archive__drag-hint')?.classList.add('is-dismissed');
    panStart = {
      pointerId: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      left: archiveWorld.offsetLeft,
      top: archiveWorld.offsetTop,
    };
    archiveBoard.classList.add('is-panning');
    archiveBoard.setPointerCapture(event.pointerId);
  });

  archiveBoard.addEventListener('pointermove', (event) => {
    if (!panStart || event.pointerId !== panStart.pointerId) return;
    archiveBoard.classList.remove('has-nudge-hint');
    archiveWorld.style.left = `${wrap(panStart.left + event.clientX - panStart.x, archivePeriodX)}px`;
    archiveWorld.style.top = `${wrap(panStart.top + event.clientY - panStart.y, archivePeriodY)}px`;
  });

  const finishPanning = (event) => {
    if (!panStart || event.pointerId !== panStart.pointerId) return;
    panStart = null;
    archiveBoard.classList.remove('is-panning');
    if (archiveBoard.hasPointerCapture(event.pointerId)) archiveBoard.releasePointerCapture(event.pointerId);
    saveArchiveView();
  };

  archiveBoard.addEventListener('pointerup', finishPanning);
  archiveBoard.addEventListener('pointercancel', finishPanning);
}

const gameDialog = document.querySelector('.game-dialog');
const gameStart = document.querySelector('[data-game-start]');
const gameTarget = document.querySelector('[data-game-target]');
const gameScore = document.querySelector('[data-game-score]');
const gameTime = document.querySelector('[data-game-time]');
const gameResult = document.querySelector('[data-game-result]');
let gameClock = 15;
let gamePoints = 0;
let gameTimer;

function stopOfferGame() {
  window.clearInterval(gameTimer);
  gameTimer = undefined;
  if (gameTarget) gameTarget.hidden = true;
  if (gameStart) gameStart.hidden = false;
}

function moveOfferTarget() {
  if (!gameTarget) return;
  const field = gameTarget.parentElement;
  const maxX = Math.max(0, field.clientWidth - gameTarget.offsetWidth);
  const maxY = Math.max(0, field.clientHeight - gameTarget.offsetHeight);
  gameTarget.style.left = `${Math.random() * maxX}px`;
  gameTarget.style.top = `${Math.random() * maxY}px`;
  gameTarget.style.transform = 'none';
}

gameStart?.addEventListener('click', () => {
  stopOfferGame();
  gameClock = 15;
  gamePoints = 0;
  if (gameTime) gameTime.textContent = String(gameClock);
  if (gameScore) gameScore.textContent = String(gamePoints);
  if (gameResult) gameResult.textContent = '';
  gameStart.hidden = true;
  if (gameTarget) gameTarget.hidden = false;
  moveOfferTarget();
  gameTimer = window.setInterval(() => {
    gameClock -= 1;
    if (gameTime) gameTime.textContent = String(gameClock);
    if (gameClock <= 0) {
      stopOfferGame();
      if (gameResult) gameResult.textContent = `Время вышло. Поймано офферов: ${gamePoints}.`;
    }
  }, 1000);
});

gameTarget?.addEventListener('click', () => {
  if (!gameTimer) return;
  gamePoints += 1;
  if (gameScore) gameScore.textContent = String(gamePoints);
  moveOfferTarget();
});

document.querySelector('[data-open-game]')?.addEventListener('click', () => {
  gameDialog?.showModal();
});

document.querySelector('[data-close-game]')?.addEventListener('click', () => {
  stopOfferGame();
  gameDialog?.close();
});

gameDialog?.addEventListener('close', stopOfferGame);

const footer = document.querySelector('.footer');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
let footerVisibilityFrame = 0;

function updateFooterVisibility() {
  if (!footer) return;
  const footerBounds = footer.getBoundingClientRect();
  const footerIsVisible = footerBounds.top < window.innerHeight && footerBounds.bottom > 0;
  document.body.classList.toggle('footer-is-visible', footerIsVisible);
}

function scheduleFooterVisibility() {
  if (footerVisibilityFrame) return;
  footerVisibilityFrame = window.requestAnimationFrame(() => {
    footerVisibilityFrame = 0;
    updateFooterVisibility();
  });
}

if (footer) {
  updateFooterVisibility();
  window.addEventListener('scroll', scheduleFooterVisibility, { passive: true });
  window.addEventListener('resize', scheduleFooterVisibility, { passive: true });
}

document.querySelector('.to-top')?.addEventListener('click', (event) => {
  event.preventDefault();
  window.scrollTo({ top: 0, behavior: reducedMotion.matches ? 'auto' : 'smooth' });
  if (window.location.hash) history.replaceState(null, '', `${window.location.pathname}${window.location.search}`);
});

const dotNameCanvas = document.querySelector('[data-dot-text]');
if (dotNameCanvas) {
  const dotContext = dotNameCanvas.getContext('2d');
  const dotText = dotNameCanvas.dataset.dotText || '';
  const dotMotionOff = window.matchMedia('(prefers-reduced-motion: reduce)');
  let dotParticles = [];
  let dotPointer = { x: 0, y: 0, active: false };
  let dotFrame = 0;
  let dotCanvasWidth = 0;
  let dotCanvasHeight = 0;
  let dotPixelRatio = 1;
  let dotRadius = 1.15;

  function drawDotFrame() {
    dotFrame = 0;
    if (!dotContext || !dotCanvasWidth || !dotCanvasHeight) return;
    dotContext.clearRect(0, 0, dotCanvasWidth, dotCanvasHeight);
    dotContext.fillStyle = '#fff';
    dotContext.beginPath();
    let unsettled = false;
    const influenceRadius = 132;

    for (const particle of dotParticles) {
      let targetX = particle.originX;
      let targetY = particle.originY;
      if (dotPointer.active && !dotMotionOff.matches) {
        const dx = particle.originX - dotPointer.x;
        const dy = particle.originY - dotPointer.y;
        const distance = Math.hypot(dx, dy);
        if (distance > 0.01 && distance < influenceRadius) {
          const force = Math.pow(1 - distance / influenceRadius, 2) * 54;
          targetX += (dx / distance) * force;
          targetY += (dy / distance) * force;
        }
      }

      particle.velocityX = (particle.velocityX + (targetX - particle.x) * 0.14) * 0.76;
      particle.velocityY = (particle.velocityY + (targetY - particle.y) * 0.14) * 0.76;
      particle.x += particle.velocityX;
      particle.y += particle.velocityY;
      if (Math.abs(particle.x - targetX) > 0.1 || Math.abs(particle.y - targetY) > 0.1 || Math.abs(particle.velocityX) > 0.03 || Math.abs(particle.velocityY) > 0.03) unsettled = true;
      dotContext.moveTo(particle.x + dotRadius, particle.y);
      dotContext.arc(particle.x, particle.y, dotRadius, 0, Math.PI * 2);
    }

    dotContext.fill();
    if ((dotPointer.active && !dotMotionOff.matches) || unsettled) dotFrame = window.requestAnimationFrame(drawDotFrame);
  }

  function rebuildDotName() {
    if (!dotContext) return;
    const bounds = dotNameCanvas.getBoundingClientRect();
    if (bounds.width < 1 || bounds.height < 1) return;
    dotCanvasWidth = bounds.width;
    dotCanvasHeight = bounds.height;
    dotPixelRatio = Math.min(window.devicePixelRatio || 1, 2);
    dotNameCanvas.width = Math.round(dotCanvasWidth * dotPixelRatio);
    dotNameCanvas.height = Math.round(dotCanvasHeight * dotPixelRatio);
    dotContext.setTransform(dotPixelRatio, 0, 0, dotPixelRatio, 0, 0);

    const fontStyles = getComputedStyle(dotNameCanvas.parentElement);
    const mask = document.createElement('canvas');
    mask.width = Math.ceil(dotCanvasWidth);
    mask.height = Math.ceil(dotCanvasHeight);
    const maskContext = mask.getContext('2d', { willReadFrequently: true });
    if (!maskContext) return;

    const requestedSize = Number.parseFloat(fontStyles.fontSize) || 180;
    const trackingRatio = 0.07;
    let fontSize = requestedSize;
    const fontFamily = fontStyles.fontFamily || 'Arial, sans-serif';
    maskContext.textAlign = 'left';
    maskContext.textBaseline = 'middle';
    const getCharacterWidths = () => {
      maskContext.font = `${fontStyles.fontWeight || 800} ${fontSize}px ${fontFamily}`;
      return Array.from(dotText, (character) => maskContext.measureText(character).width);
    };
    let characterWidths = getCharacterWidths();
    let tracking = -fontSize * trackingRatio;
    let textWidth = characterWidths.reduce((sum, width) => sum + width, 0) + Math.max(0, characterWidths.length - 1) * tracking;
    if (textWidth > dotCanvasWidth - 12) {
      fontSize *= (dotCanvasWidth - 12) / textWidth;
      characterWidths = getCharacterWidths();
      tracking = -fontSize * trackingRatio;
      textWidth = characterWidths.reduce((sum, width) => sum + width, 0) + Math.max(0, characterWidths.length - 1) * tracking;
    }
    maskContext.fillStyle = '#fff';
    let textX = (dotCanvasWidth - textWidth) / 2;
    for (let index = 0; index < characterWidths.length; index += 1) {
      const character = Array.from(dotText)[index];
      maskContext.fillText(character, textX, dotCanvasHeight / 2);
      textX += characterWidths[index] + tracking;
    }

    const pixels = maskContext.getImageData(0, 0, mask.width, mask.height).data;
    const spacing = Math.max(4.5, Math.min(6, fontSize / 34));
    const nextParticles = [];
    for (let y = spacing / 2; y < mask.height; y += spacing) {
      for (let x = spacing / 2; x < mask.width; x += spacing) {
        if (pixels[(Math.floor(y) * mask.width + Math.floor(x)) * 4 + 3] > 100) {
          nextParticles.push({ originX: x, originY: y, x, y, velocityX: 0, velocityY: 0 });
        }
      }
    }
    dotParticles = nextParticles;
    if (dotFrame) window.cancelAnimationFrame(dotFrame);
    dotFrame = window.requestAnimationFrame(drawDotFrame);
  }

  dotNameCanvas.addEventListener('pointermove', (event) => {
    if (event.pointerType === 'touch') return;
    const bounds = dotNameCanvas.getBoundingClientRect();
    dotPointer = { x: event.clientX - bounds.left, y: event.clientY - bounds.top, active: true };
    if (!dotFrame) dotFrame = window.requestAnimationFrame(drawDotFrame);
  });
  dotNameCanvas.addEventListener('pointerleave', () => {
    dotPointer.active = false;
    if (!dotFrame) dotFrame = window.requestAnimationFrame(drawDotFrame);
  });
  window.addEventListener('blur', () => {
    dotPointer.active = false;
    if (!dotFrame) dotFrame = window.requestAnimationFrame(drawDotFrame);
  });
  if ('ResizeObserver' in window) new ResizeObserver(rebuildDotName).observe(dotNameCanvas);
  else window.addEventListener('resize', rebuildDotName, { passive: true });
  document.fonts?.load('800 180px Manrope').then(rebuildDotName).catch(rebuildDotName);
  if (!document.fonts) rebuildDotName();
}

const conceptStage = document.querySelector('[data-concept-stage]');
if (conceptStage) {
  const conceptCarousel = conceptStage.querySelector('[data-concept-carousel]');
  const conceptMedia = [
    {src:'assets/concepts/video/home.webm', type:'video'},
    {src:'assets/concepts/concept-bathroom.webp', type:'image'},
    {src:'assets/concepts/video/account-opening.webm', type:'video'},
    {src:'assets/concepts/video/device-page.webm', type:'video'},
    {src:'assets/concepts/video/full-short-animation.webm', type:'video'},
    {src:'assets/concepts/concept-keys.webp', type:'image'},
    {src:'assets/concepts/video/new-animation.webm', type:'video'},
    {src:'assets/concepts/video/t-cinema.webm', type:'video'},
    {src:'assets/concepts/concept-fine.webp', type:'image'},
    {src:'assets/concepts/video/web-full-animation.webm', type:'video'},
  ];
  const conceptCards = [];
  const reducedConceptMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let conceptRunning = false;
  let conceptActivatedAt = 0;
  let conceptPausedElapsed = 0;
  let conceptFrame = 0;

  const conceptEaseOut = (value) => 1 - Math.pow(1 - Math.max(0, Math.min(1, value)), 3);
  const conceptEaseInOut = (value) => {
    const t = Math.max(0, Math.min(1, value));
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  };
  const conceptBackOut = (value) => {
    const t = Math.max(0, Math.min(1, value));
    const c1 = 1.7;
    return 1 + (c1 + 1) * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
  };

  conceptStage.querySelectorAll('[data-concept-line]').forEach((line, lineIndex) => {
    const text = line.textContent || '';
    const startDelay = lineIndex === 0 ? 0.4 : 0.93;
    const stagger = (lineIndex === 0 ? 1.3 : 1.1) / 30;
    line.replaceChildren(...Array.from(text, (character, index) => {
      const letter = document.createElement('span');
      letter.className = 'concept-lab__letter';
      letter.textContent = character === ' ' ? '\u00a0' : character;
      letter.style.animationDelay = `${startDelay + index * stagger}s`;
      return letter;
    }));
  });

  conceptMedia.forEach((asset, index) => {
    const card = document.createElement('div');
    card.className = 'concept-lab__card';
    card.setAttribute('aria-hidden', 'true');
    const media = document.createElement(asset.type === 'video' ? 'video' : 'img');
    media.src = asset.src;
    if (asset.type === 'video') {
      media.muted = true;
      media.loop = true;
      media.playsInline = true;
      media.preload = 'none';
      media.setAttribute('muted', '');
      media.setAttribute('playsinline', '');
    } else {
      media.alt = '';
      media.loading = 'lazy';
      media.decoding = 'async';
    }
    card.append(media);
    conceptCarousel.append(card);
    conceptCards.push({element:card,media,asset,index});
  });

  function pauseConceptVideos() {
    for (const card of conceptCards) {
      if (card.asset.type === 'video' && !card.media.paused) card.media.pause();
    }
  }

  function renderConceptCarousel(elapsed, allowVideoPlayback) {
    const carouselStart = 1.48;
    if (elapsed < carouselStart) {
      conceptCarousel.style.opacity = '0';
      pauseConceptVideos();
      return;
    }

    const galleryTime = elapsed - carouselStart;
    const galleryFrame = galleryTime * 30;
    conceptCarousel.style.opacity = String(conceptEaseInOut(galleryFrame / 12));

    const introSpin = 24 / 30;
    const introHold = 15 / 30;
    const moveDuration = 18 / 30;
    const holdDuration = 15 / 30;
    const lap = galleryTime < introSpin
      ? 2 * conceptEaseOut(galleryTime / introSpin)
      : galleryTime < introSpin + introHold
        ? 2
        : (() => {
          const afterIntro = galleryTime - introSpin - introHold;
          const stepDuration = moveDuration + holdDuration;
          const step = Math.floor(afterIntro / stepDuration);
          const withinStep = afterIntro % stepDuration;
          return 2 + step + (withinStep < moveDuration ? conceptEaseInOut(withinStep / moveDuration) : 1);
        })();

    const stageWidth = conceptStage.clientWidth;
    const stageHeight = conceptStage.clientHeight;
    const isCompactStage = window.matchMedia('(max-width: 900px)').matches;
    const scale = isCompactStage
      ? Math.min(stageWidth * 0.66 / 510, stageHeight * 0.49 / 580)
      : Math.min(stageWidth / 1920, stageHeight / 1080);
    const firstVirtualIndex = Math.floor(lap) - 4;

    for (const card of conceptCards) {
      const virtualIndex = card.index + Math.ceil((firstVirtualIndex - card.index) / conceptMedia.length) * conceptMedia.length;
      const slot = virtualIndex - lap;
      const depth = Math.abs(slot);
      const insideStage = depth <= 4.5;
      const entryDelay = depth * 1.2;
      const entry = conceptEaseOut((galleryFrame - entryDelay) / 15);
      const cardScale = 0.94 - Math.min(depth, 4) * 0.035;

      card.element.style.width = `${510 * scale}px`;
      card.element.style.height = `${580 * scale}px`;
      card.element.style.zIndex = String(Math.round(10 + depth * 20));
      card.element.style.visibility = insideStage ? 'visible' : 'hidden';
      card.element.style.opacity = insideStage ? String(entry) : '0';
      card.element.style.transform = `translate(-50%, -50%) translate3d(${-slot * 435 * scale}px, ${-slot * 285 * scale}px, 0) rotate(${slot * 2.2}deg) scale(${cardScale})`;

      if (card.asset.type === 'video') {
        const shouldPlay = allowVideoPlayback && insideStage && depth < 2.8 && galleryFrame > entryDelay;
        if (shouldPlay && card.media.paused) {
          const playResult = card.media.play();
          playResult?.catch(() => {});
        } else if (!shouldPlay && !card.media.paused) {
          card.media.pause();
        }
      }
    }
  }

  function animateConcepts(now) {
    conceptFrame = 0;
    if (!conceptRunning) return;
    const elapsed = conceptPausedElapsed + (now - conceptActivatedAt) / 1000;
    renderConceptCarousel(elapsed, true);
    conceptFrame = window.requestAnimationFrame(animateConcepts);
  }

  function startConcepts() {
    conceptStage.classList.add('is-active');
    if (reducedConceptMotion.matches) {
      renderConceptCarousel(2.2, false);
      return;
    }
    if (conceptRunning) return;
    conceptActivatedAt = performance.now();
    conceptRunning = true;
    conceptFrame = window.requestAnimationFrame(animateConcepts);
  }

  function stopConcepts() {
    if (!conceptRunning) return;
    conceptPausedElapsed += (performance.now() - conceptActivatedAt) / 1000;
    conceptRunning = false;
    if (conceptFrame) window.cancelAnimationFrame(conceptFrame);
    conceptFrame = 0;
    pauseConceptVideos();
  }

  if ('IntersectionObserver' in window) {
    const conceptObserver = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) startConcepts();
      else stopConcepts();
    }, {threshold:0.08});
    conceptObserver.observe(conceptStage);
  } else {
    startConcepts();
  }

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stopConcepts();
    else if (conceptStage.getBoundingClientRect().bottom > 0 && conceptStage.getBoundingClientRect().top < window.innerHeight) startConcepts();
  });
  window.addEventListener('resize', () => {
    if (!conceptRunning) renderConceptCarousel(conceptPausedElapsed, false);
  }, {passive:true});
}

const conceptHelixStage = document.querySelector('[data-helix-stage]');
if (conceptHelixStage) {
  const gallery = conceptHelixStage.querySelector('[data-helix-gallery]');
  const media = [
    ['assets/concepts/video/home.webm','video'],
    ['assets/concepts/concept-bathroom.webp','image'],
    ['assets/concepts/video/account-opening.webm','video'],
    ['assets/concepts/video/device-page.webm','video'],
    ['assets/concepts/video/full-short-animation.webm','video'],
    ['assets/concepts/concept-keys.webp','image'],
    ['assets/concepts/video/new-animation.webm','video'],
    ['assets/concepts/video/t-cinema.webm','video'],
    ['assets/concepts/concept-fine.webp','image'],
    ['assets/concepts/video/web-full-animation.webm','video'],
  ];
  const cards = media.map(([src,type], index) => {
    const card = document.createElement('figure');
    card.className = 'concept-helix__card';
    card.tabIndex = 0;
    card.setAttribute('aria-label', `Концепт ${String(index + 1).padStart(2,'0')}`);
    const item = document.createElement(type === 'video' ? 'video' : 'img');
    item.src = src;
    if (type === 'video') {
      item.muted = true;
      item.loop = true;
      item.playsInline = true;
      item.preload = 'none';
      item.setAttribute('muted','');
      item.setAttribute('playsinline','');
    } else {
      item.alt = '';
      item.loading = 'lazy';
      item.decoding = 'async';
    }
    item.addEventListener(type === 'video' ? 'loadeddata' : 'load', () => card.classList.add('is-media-ready'), {once:true});
    item.addEventListener('error', () => card.classList.remove('is-media-ready'));
    card.append(item);
    gallery.append(card);
    return {card,item,type,index};
  });
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const compact = matchMedia('(max-width: 900px)');
  const mobileCards = [...cards.slice(0,4), cards[5]];
  let active = false;
  let frame = 0;
  let phase = 0;
  let hoverIndex = null;
  let idlePhase = 0;
  let lastFrameTime = 0;
  let lastInteraction = performance.now();
  let mobileFrame = 0;
  const noteInteraction = () => { lastInteraction = performance.now(); };

  const pauseVideos = () => cards.forEach(({item,type}) => { if (type === 'video' && !item.paused) item.pause(); });
  function renderMobile() {
    mobileFrame = 0;
    if (!active || !compact.matches || document.hidden) return;
    const rect = conceptHelixStage.getBoundingClientRect();
    const range = Math.max(1, conceptHelixStage.offsetHeight - innerHeight);
    const progress = Math.max(0, Math.min(1, -rect.top / range));
    const mobilePhase = progress * mobileCards.length;
    const bounds = gallery.getBoundingClientRect();
    const cardHeight = Math.min(bounds.width * 0.88, 510) * 580 / 510;
    const travel = Math.min(bounds.height * 0.34 + cardHeight * 0.25, innerHeight * 0.58);
    const stackStep = Math.min(14, innerHeight * 0.016);
    const activeIndex = Math.min(mobileCards.length - 1, Math.floor(mobilePhase));
    const transition = Math.max(0, Math.min(1, mobilePhase - activeIndex));
    cards.forEach((entry) => {
      const {card,item,type} = entry;
      const mobileIndex = mobileCards.indexOf(entry);
      if (mobileIndex < 0) {
        card.style.display = 'none';
        card.style.opacity = '0';
        card.style.visibility = 'hidden';
        card.style.pointerEvents = 'none';
        if (type === 'video' && !item.paused) item.pause();
        return;
      }
      card.style.display = '';
      const stackDepth = mobileIndex - activeIndex;
      const isFront = mobileIndex === activeIndex;
      const isLast = mobileIndex === mobileCards.length - 1;
      const visible = stackDepth >= 0 && (!(isFront && transition >= 1) || isLast) && card.classList.contains('is-media-ready');
      card.style.width = `${Math.min(bounds.width * 0.88, 510)}px`;
      card.style.height = `min(${cardHeight}px, 52svh)`;
      card.style.opacity = visible ? '1' : '0';
      card.style.visibility = visible ? 'visible' : 'hidden';
      card.style.zIndex = String(isFront ? 120 : 100 - stackDepth);
      card.style.pointerEvents = isFront ? (isLast || transition < 0.95 ? 'auto' : 'none') : 'none';
      const y = isFront ? (isLast ? 0 : transition * travel) : stackDepth * stackStep - transition * stackStep;
      const scale = 1 - stackDepth * 0.012;
      card.style.transform = `translate3d(-50%,calc(-50% + ${y}px),0) scale(${scale})`;
      if (type === 'video') {
        const shouldPlay = stackDepth >= 0 && (isFront || stackDepth === 1 && transition > 0.45) && (isLast || transition < 1);
        if (shouldPlay && item.paused) item.play().catch(() => {});
        else if (!shouldPlay && !item.paused) item.pause();
      }
    });
  }
  const requestMobileRender = () => {
    if (active && compact.matches && !mobileFrame && !document.hidden) mobileFrame = requestAnimationFrame(renderMobile);
  };
  const requestRender = () => {
    if (active && !frame && !document.hidden && !compact.matches && !reduced.matches) frame = requestAnimationFrame(render);
  };
  function render() {
    frame = 0;
    if (!active || document.hidden || compact.matches || reduced.matches) return;
    const now = performance.now();
    const delta = lastFrameTime ? Math.min((now - lastFrameTime) / 1000, 0.05) : 0;
    lastFrameTime = now;
    if (hoverIndex === null && now - lastInteraction > 900) idlePhase = Math.min(cards.length * 0.5, idlePhase + delta * 0.16);
    const rect = conceptHelixStage.getBoundingClientRect();
    const range = Math.max(1, conceptHelixStage.offsetHeight - innerHeight);
    const scrollPhase = Math.max(0, Math.min(1, -rect.top / range)) * cards.length + idlePhase;
    const target = hoverIndex === null
      ? scrollPhase
      : hoverIndex + Math.round((phase - hoverIndex) / cards.length) * cards.length;
    phase += (target - phase) * 0.11;
    if (Math.abs(target - phase) < 0.001) phase = target;

    const bounds = gallery.getBoundingClientRect();
    const radiusX = Math.min(bounds.width * 0.25, 420);
    const radiusZ = Math.min(bounds.height * 0.38, 390);
    const rowGap = Math.min(bounds.height * 0.16, 150);
    const cardWidth = Math.min(bounds.width * 0.22, 360);
    cards.forEach(({card,item,type,index}) => {
      card.style.display = '';
      const slot = ((index - phase + cards.length / 2) % cards.length + cards.length) % cards.length - cards.length / 2;
      const angle = slot * Math.PI / 4;
      const x = Math.sin(angle) * radiusX;
      const y = slot * rowGap;
      const z = Math.cos(angle) * radiusZ;
      const depth = Math.abs(slot);
      const sizeScale = Math.max(0.52, 1 - depth * 0.075);
      const visible = depth < 7.15;
      card.style.width = `${cardWidth}px`;
      card.style.height = `${cardWidth * 580 / 510}px`;
      card.style.opacity = visible ? String(Math.min(1, Math.max(0, (7.2 - depth) / 1))) : '0';
      card.style.visibility = visible ? 'visible' : 'hidden';
      card.style.zIndex = String(Math.round(10 + z));
      card.style.pointerEvents = visible ? 'auto' : 'none';
      card.style.transform = `translate3d(calc(-50% + ${x}px),calc(-50% + ${y}px),${z}px) rotateY(${Math.sin(angle) * -22}deg) scale(${sizeScale})`;
      if (type === 'video') {
        if (visible && depth < 2.75 && item.paused) item.play().catch(() => {});
        else if ((!visible || depth >= 2.75) && !item.paused) item.pause();
      }
    });
    frame = requestAnimationFrame(render);
  }

  cards.forEach(({card,index}) => {
    card.addEventListener('pointerenter', (event) => { if (event.pointerType !== 'touch') { noteInteraction(); hoverIndex = index; requestRender(); } });
    card.addEventListener('focus', () => { noteInteraction(); hoverIndex = index; requestRender(); });
    card.addEventListener('blur', () => { noteInteraction(); hoverIndex = null; requestRender(); });
  });
  gallery.addEventListener('pointerleave', () => { noteInteraction(); hoverIndex = null; requestRender(); });
  const update = () => {
    if (compact.matches) {
      if (frame) cancelAnimationFrame(frame);
      frame = 0;
      if (document.hidden) pauseVideos();
      else requestMobileRender();
    } else if (reduced.matches || document.hidden) {
      if (frame) cancelAnimationFrame(frame);
      frame = 0;
      pauseVideos();
    } else requestRender();
  };
  addEventListener('scroll', () => { hoverIndex = null; noteInteraction(); compact.matches ? requestMobileRender() : requestRender(); }, {passive:true});
  addEventListener('resize', update, {passive:true});
  document.addEventListener('visibilitychange', update);
  reduced.addEventListener?.('change', update);
  compact.addEventListener?.('change', update);
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(([entry]) => {
      active = entry.isIntersecting;
      if (active) update();
      else { if (frame) cancelAnimationFrame(frame); frame = 0; pauseVideos(); }
    }, {threshold:0,rootMargin:'120px 0px'}).observe(conceptHelixStage);
  } else { active = true; update(); }
}

const tefsCampaignTimeline = document.querySelector('[data-tefs-timeline]');
if (tefsCampaignTimeline) {
  const stages = [...tefsCampaignTimeline.querySelectorAll('.tefs-creatives__stage')];
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let enteredAt = 0;
  let timer = 0;
  let visible = false;

  const updateCampaignTimeline = () => {
    const elapsed = reducedMotion.matches || !enteredAt ? 0 : performance.now() - enteredAt;
    const activeIndex = 9 + Math.min(8, Math.floor((elapsed % 21600) / 2400));
    stages.forEach((stage, index) => {
      const distance = Math.abs(index - activeIndex);
      const opacity = [1, .32, .18, .09, .035][distance] ?? 0;
      stage.style.opacity = String(opacity);
    });
  };

  const setTimelineVisible = (isVisible) => {
    visible = isVisible;
    tefsCampaignTimeline.classList.toggle('is-active', visible && !reducedMotion.matches);
    if (visible) {
      if (!enteredAt) enteredAt = performance.now();
      updateCampaignTimeline();
      if (!reducedMotion.matches && !timer) timer = window.setInterval(updateCampaignTimeline, 120);
    }
    if ((!visible || reducedMotion.matches) && timer) {
      window.clearInterval(timer);
      timer = 0;
    }
  };

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(([entry]) => setTimelineVisible(entry.isIntersecting), { threshold: .05 }).observe(tefsCampaignTimeline);
  } else setTimelineVisible(true);
  reducedMotion.addEventListener?.('change', () => setTimelineVisible(visible));
}

const tefsPage = document.querySelector('.tefs-page');
if (tefsPage && !prefersReducedMotion.matches && 'IntersectionObserver' in window) {
  const tefsHero = tefsPage.querySelector('.tefs-hero');
  const tefsRevealGroups = [
    ['.tefs-overview > h2', 0],
    ['.tefs-facts > div', 90],
    ['.tefs-contribution > h3, .tefs-contribution > ol > li', 90],
    ['.tefs-outcome__copy', 0],
    ['.tefs-webpages .tefs-section__heading', 0],
    ['.tefs-webpages__grid > *', 100],
    ['.tefs-metrics__artwork, .tefs-metrics__number, .tefs-metrics__caption', 90],
    ['.tefs-mobile-pages__screen', 75],
    ['.tefs-creatives .tefs-section__heading', 0],
    ['.tefs-creatives__feature-row > *', 100],
    ['.tefs-creatives__showcase', 180],
    ['.tefs-reflection > p, .tefs-reflection h2, .tefs-reflection .tefs-outcome__actions', 100],
    ['.tefs-page .x5-related__heading, .tefs-page .x5-related__grid', 120],
  ];

  const revealTargets = [];
  tefsRevealGroups.forEach(([selector, delayStep]) => {
    tefsPage.querySelectorAll(selector).forEach((element, index) => {
      element.dataset.tefsReveal = '';
      element.style.setProperty('--tefs-reveal-delay', `${Math.min(index, 5) * delayStep}ms`);
      revealTargets.push(element);
    });
  });

  if (tefsHero) {
    requestAnimationFrame(() => requestAnimationFrame(() => tefsHero.classList.add('is-entered')));
    const browser = tefsHero.querySelector('.tefs-hero__browser');
    let frame = 0;
    const updateHeroScreen = () => {
      frame = 0;
      if (!browser) return;
      const bounds = tefsHero.getBoundingClientRect();
      const scrollDistance = Math.max(0, -bounds.top - 160);
      const progress = Math.max(0, Math.min(1, scrollDistance / 480));
      browser.style.setProperty('--tefs-browser-y', `${progress * 72}px`);
      browser.style.setProperty('--tefs-browser-rotate', `${16 * (1 - progress)}deg`);
    };
    const requestHeroUpdate = () => {
      if (!frame) frame = requestAnimationFrame(updateHeroScreen);
    };
    window.addEventListener('scroll', requestHeroUpdate, { passive: true });
    window.addEventListener('resize', requestHeroUpdate, { passive: true });
    requestHeroUpdate();
  }

  const tefsRevealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      observer.unobserve(entry.target);
    });
  }, { threshold: .1, rootMargin: '0px 0px -5% 0px' });
  revealTargets.forEach(element => tefsRevealObserver.observe(element));
}
