/* ============================================================
   NEXUS AI — Animations JS
   ============================================================ */

(function () {
  'use strict';

  /* ── Spotlight cursor follow ─────────────────────────────── */
  function initSpotlight() {
    const spotlights = document.querySelectorAll('.spotlight');
    if (!spotlights.length) return;
    document.addEventListener('mousemove', function (e) {
      spotlights.forEach(function (s) {
        s.style.left = (e.clientX - 200) + 'px';
        s.style.top  = (e.clientY - 200) + 'px';
      });
    });
  }

  /* ── Card mouse-follow glow ──────────────────────────────── */
  function initCardGlow() {
    document.querySelectorAll('.glass-card, .spotlight-card').forEach(function (card) {
      card.addEventListener('mousemove', function (e) {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        card.style.setProperty('--mouse-x', x + 'px');
        card.style.setProperty('--mouse-y', y + 'px');
        card.style.background =
          'radial-gradient(400px circle at ' + x + 'px ' + y + 'px, rgba(255,255,255,0.03), transparent), ' +
          'rgba(17, 18, 20, 0.8)';
      });
      card.addEventListener('mouseleave', function () {
        card.style.background = 'rgba(17, 18, 20, 0.8)';
      });
    });
  }

  /* ── Terminal typing animation ────────────────────────────── */
  function initTerminal(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    const textEl = container.querySelector('.terminal-text');
    if (!textEl) return;

    const commands = [
      'tail -f /var/log/syslog',
      'nexus-status --all',
      'deploy-smart-contract --v7',
      'check-quorum NIP-08',
    ];

    let cmdIdx = 0, charIdx = 0, isDeleting = false;

    function type() {
      const cmd = commands[cmdIdx];
      if (isDeleting) {
        textEl.textContent = cmd.substring(0, charIdx - 1);
        charIdx--;
      } else {
        textEl.textContent = cmd.substring(0, charIdx + 1);
        charIdx++;
      }
      let speed = isDeleting ? 50 : 150;
      if (!isDeleting && charIdx === cmd.length) { speed = 2000; isDeleting = true; }
      else if (isDeleting && charIdx === 0)      { isDeleting = false; cmdIdx = (cmdIdx + 1) % commands.length; speed = 500; }
      setTimeout(type, speed);
    }
    type();
  }

  /* ── Live log appender ────────────────────────────────────── */
  function initLiveLogs() {
    const containers = document.querySelectorAll('[data-live-log]');
    if (!containers.length) return;

    const messages = [
      ['INIT_SEQUENCE::SUCCESS', 'emerald'],
      ['Syncing with mainnet...', ''],
      ['Peer handshaking initiated.', ''],
      ['Executing automated strategy.', 'blue'],
      ['New neural path mapped.', 'purple'],
    ];

    containers.forEach(function (container) {
      setInterval(function () {
        const [msg, color] = messages[Math.floor(Math.random() * messages.length)];
        const time = new Date().toLocaleTimeString('en-US', { hour12: false });
        const p = document.createElement('p');
        p.innerHTML = '<span style="color:var(--on-surface-variant)">[' + time + ']</span> ' +
          '<span style="color:' + (color === 'emerald' ? '#34d399' : color === 'blue' ? 'var(--neon-blue)' : color === 'purple' ? 'var(--neon-purple)' : 'var(--on-surface)') + '">' + msg + '</span>';
        p.style.opacity = '0';
        p.style.transition = 'opacity 0.3s';
        container.appendChild(p);
        setTimeout(function () { p.style.opacity = '1'; }, 50);
        if (container.children.length > 20) container.removeChild(container.firstChild);
        container.scrollTop = container.scrollHeight;
      }, 3000);
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    initSpotlight();
    initCardGlow();
    initTerminal('terminal');
    initLiveLogs();
  });
})();
