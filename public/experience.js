(() => {
  'use strict';

  const hero = document.querySelector('.hero');
  const homeView = document.getElementById('home-view');
  const header = document.querySelector('.site-header');
  const preview = document.querySelector('.selected-preview');
  const choices = [...document.querySelectorAll('[data-preview]')];
  const images = [...document.querySelectorAll('[data-preview-image]')];
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let scheduledFrame = 0;

  function updateIntro() {
    scheduledFrame = 0;
    if (!hero || homeView.hidden) return;
    if (reducedMotion.matches) {
      hero.style.setProperty('--image-shift', '0px');
      return;
    }
    const travelled = Math.max(0, header.offsetHeight - hero.getBoundingClientRect().top);
    hero.style.setProperty('--image-shift', Math.min(70, travelled * .1).toFixed(1) + 'px');
  }

  function scheduleIntro() {
    if (!scheduledFrame) scheduledFrame = requestAnimationFrame(updateIntro);
  }

  function showPreview(kind) {
    if (!preview || !images.some(image => image.dataset.previewImage === kind)) return;
    preview.dataset.current = kind;
    choices.forEach(choice => { choice.dataset.active = String(choice.dataset.preview === kind); });
    images.forEach(image => {
      const active = image.dataset.previewImage === kind;
      image.classList.toggle('is-active', active);
      image.setAttribute('aria-hidden', String(!active));
    });
  }

  choices.forEach(choice => {
    choice.addEventListener('pointerenter', event => {
      if (event.pointerType !== 'touch') showPreview(choice.dataset.preview);
    });
    choice.addEventListener('focus', () => showPreview(choice.dataset.preview));
    choice.addEventListener('click', () => showPreview(choice.dataset.preview));
  });
  showPreview('photography');

  if ('IntersectionObserver' in window && !reducedMotion.matches) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -4% 0px', threshold: 0.04 });
    document.querySelectorAll('.work-section .panel-copy').forEach(element => {
      if (element.getBoundingClientRect().top < window.innerHeight * .96) return;
      element.classList.add('reveal-item');
      observer.observe(element);
      element.addEventListener('focusin', () => {
        element.classList.add('is-visible');
        observer.unobserve(element);
      }, { once: true });
    });
    reducedMotion.addEventListener('change', () => {
      if (!reducedMotion.matches) return;
      document.querySelectorAll('.reveal-item').forEach(element => element.classList.add('is-visible'));
      observer.disconnect();
    });
  }

  window.addEventListener('scroll', scheduleIntro, { passive: true });
  window.addEventListener('resize', scheduleIntro, { passive: true });
  window.addEventListener('hashchange', scheduleIntro);
  reducedMotion.addEventListener('change', scheduleIntro);
  scheduleIntro();
})();
