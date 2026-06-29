/* ============================================================
   NEXUS AI — App JS (modals, tabs, dropdowns, toggles)
   ============================================================ */

(function () {
  'use strict';

  /* ── Modal ───────────────────────────────────────────────── */
  function initModals() {
    document.querySelectorAll('[data-modal-open]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        const id = btn.getAttribute('data-modal-open');
        const modal = document.getElementById(id);
        if (modal) modal.classList.add('is-open');
      });
    });
    document.querySelectorAll('[data-modal-close]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        btn.closest('.modal-backdrop').classList.remove('is-open');
      });
    });
    document.querySelectorAll('.modal-backdrop').forEach(function (backdrop) {
      backdrop.addEventListener('click', function (e) {
        if (e.target === backdrop) backdrop.classList.remove('is-open');
      });
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        document.querySelectorAll('.modal-backdrop.is-open').forEach(function (m) {
          m.classList.remove('is-open');
        });
      }
    });
  }

  /* ── Tabs ────────────────────────────────────────────────── */
  function initTabs() {
    document.querySelectorAll('[data-tab-group]').forEach(function (group) {
      const tabs    = group.querySelectorAll('[data-tab]');
      const panels  = group.querySelectorAll('[data-tab-panel]');

      tabs.forEach(function (tab) {
        tab.addEventListener('click', function () {
          const target = tab.getAttribute('data-tab');
          tabs.forEach(function (t) { t.classList.remove('tab--active'); });
          panels.forEach(function (p) { p.classList.add('hidden'); });
          tab.classList.add('tab--active');
          const panel = group.querySelector('[data-tab-panel="' + target + '"]');
          if (panel) panel.classList.remove('hidden');
        });
      });
    });
  }

  /* ── Accordion ───────────────────────────────────────────── */
  function initAccordion() {
    document.querySelectorAll('.accordion-item').forEach(function (item) {
      const trigger = item.querySelector('.accordion-trigger');
      if (!trigger) return;
      trigger.addEventListener('click', function () {
        item.classList.toggle('is-open');
      });
    });
  }

  /* ── Toggle switch ───────────────────────────────────────── */
  function initToggles() {
    document.querySelectorAll('[data-toggle-btn]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        btn.classList.toggle('is-on');
        const knob = btn.querySelector('.toggle-knob');
        if (knob) {
          if (btn.classList.contains('is-on')) {
            knob.style.transform = 'translateX(20px)';
            knob.style.background = 'white';
            btn.style.background = 'var(--neon-blue)';
          } else {
            knob.style.transform = 'translateX(0)';
            knob.style.background = 'rgba(255,255,255,0.4)';
            btn.style.background = 'rgba(255,255,255,0.1)';
          }
        }
      });
    });
  }

  /* ── Proposal modal helper ───────────────────────────────── */
  window.openProposalModal = function () {
    const m = document.getElementById('proposalModal');
    if (m) m.classList.add('is-open');
  };
  window.closeProposalModal = function () {
    const m = document.getElementById('proposalModal');
    if (m) m.classList.remove('is-open');
  };

  /* ── NFT Achievement detail ──────────────────────────────── */
  window.openAchievement = function (data) {
    const modal = document.getElementById('achievementModal');
    if (!modal) return;
    modal.querySelector('.ach-icon').textContent   = data.icon;
    modal.querySelector('.ach-title').textContent  = data.title;
    modal.querySelector('.ach-sub').textContent    = data.subtitle;
    modal.querySelector('.ach-desc').textContent   = data.desc;
    modal.querySelector('.ach-rarity').textContent = data.rarity;
    modal.querySelector('.ach-tier').textContent   = data.tier;
    modal.classList.add('is-open');
  };

  document.addEventListener('DOMContentLoaded', function () {
    initModals();
    initTabs();
    initAccordion();
    initToggles();
  });
})();
