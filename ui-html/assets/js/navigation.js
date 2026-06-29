/* ============================================================
   NEXUS AI — Navigation JS
   ============================================================ */

(function () {
  'use strict';

  /* ── Sidebar toggle (mobile) ─────────────────────────────── */
  function initSidebar() {
    const sidebar   = document.querySelector('.sidebar');
    const hamburger = document.querySelector('.hamburger');
    const overlay   = document.querySelector('.sidebar-overlay');

    if (!sidebar) return;

    function openSidebar() {
      sidebar.classList.add('is-open');
      if (overlay) overlay.classList.add('is-visible');
    }
    function closeSidebar() {
      sidebar.classList.remove('is-open');
      if (overlay) overlay.classList.remove('is-visible');
    }

    if (hamburger) hamburger.addEventListener('click', openSidebar);
    if (overlay)   overlay.addEventListener('click', closeSidebar);

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeSidebar();
    });
  }

  /* ── Active nav item ─────────────────────────────────────── */
  function setActiveNav() {
    const path  = window.location.pathname.split('/').pop() || 'index.html';
    const links = document.querySelectorAll('.nav-item');
    links.forEach(function (link) {
      const href = (link.getAttribute('href') || '').split('/').pop();
      if (href === path) {
        link.classList.add('nav-item--active');
      } else {
        link.classList.remove('nav-item--active');
      }
    });
  }

  /* ── Smooth scroll for anchor links ─────────────────────── */
  function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(function (a) {
      a.addEventListener('click', function (e) {
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
          e.preventDefault();
          target.scrollIntoView({ behavior: 'smooth' });
        }
      });
    });
  }

  /* ── Topbar search focus ─────────────────────────────────── */
  function initSearchShortcut() {
    document.addEventListener('keydown', function (e) {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        const input = document.querySelector('.topbar__search input');
        if (input) input.focus();
      }
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    initSidebar();
    setActiveNav();
    initSmoothScroll();
    initSearchShortcut();
  });
})();
