(() => {
  'use strict';

  const preview = document.querySelector('.selected-preview');
  const choices = [...document.querySelectorAll('[data-preview]')];
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  function showPreview(kind) {
    if (!preview) return;
    preview.dataset.current = kind;
    choices.forEach(choice => { choice.dataset.active = String(choice.dataset.preview === kind); });
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

})();
