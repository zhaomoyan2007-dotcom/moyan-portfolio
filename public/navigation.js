(() => {
  'use strict';
  const panel = document.getElementById('navigation-panel');
  const scrim = document.querySelector('.menu-scrim');
  const main = document.getElementById('main');
  const toggles = [...document.querySelectorAll('[data-menu-toggle]')];
  let menuTrigger = null;

  function setMenu(open, restoreFocus = true) {
    panel.hidden = !open;
    scrim.hidden = !open;
    main.inert = open;
    document.body.classList.toggle('menu-open', open);
    toggles.forEach(button => button.setAttribute('aria-expanded', String(open)));
    if (open) {
      [...panel.querySelectorAll('a')].find(link => link.getClientRects().length)?.focus({preventScroll:true});
    } else if (restoreFocus && menuTrigger?.getClientRects().length) {
      menuTrigger.focus({preventScroll:true});
    }
  }
  toggles.forEach(button => button.addEventListener('click', () => {
    menuTrigger = button;
    setMenu(panel.hidden);
  }));
  scrim.addEventListener('click', () => setMenu(false));
  panel.addEventListener('click', event => {
    if (event.target.closest('a')) setMenu(false, false);
  });
  document.addEventListener('keydown', event => {
    if (panel.hidden) return;
    if (event.key === 'Escape') { event.preventDefault(); setMenu(false); }
    if (event.key !== 'Tab') return;
    const items = [...document.querySelectorAll('.site-header a,.site-header button,#navigation-panel a')]
      .filter(element => element.getClientRects().length && !element.disabled);
    const first = items[0];
    const last = items[items.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  });
  window.addEventListener('hashchange', () => { if (!panel.hidden) setMenu(false, false); });
  window.matchMedia('(max-width:760px)').addEventListener('change', () => { if (!panel.hidden) setMenu(false, false); });
})();
