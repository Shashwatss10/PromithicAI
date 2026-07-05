/* ===================================================================
   AUTH.JS — Firebase Auth State Manager & Navbar Updater
   PromithicAI v1.1
   =================================================================== */

(function () {
  'use strict';

  /* ── Helper: get initials from displayName or email ─────────────── */
  function getInitials(user) {
    if (!user) return '?';
    if (user.displayName && user.displayName.length > 0) {
      var parts = user.displayName.trim().split(/\s+/);
      if (parts.length >= 2) {
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
      }
      return parts[0][0].toUpperCase();
    }
    if (user.email) return user.email[0].toUpperCase();
    return '?';
  }

  /* ── Helper: get display name ────────────────────────────────────── */
  function getDisplayName(user) {
    if (!user) return '';
    if (user.displayName) return user.displayName.split(' ')[0]; // first name only
    if (user.email) return user.email.split('@')[0];
    return 'User';
  }

  /* ── Update all navbars on the page ─────────────────────────────── */
  function updateNavbarAuth(user) {
    var actionContainers = document.querySelectorAll('.navbar-actions');

    actionContainers.forEach(function (container) {
      var loginBtn  = container.querySelector('a[href="login.html"]');
      var signupBtn = container.querySelector('a[href="signup.html"]');

      if (user) {
        /* ── LOGGED IN: hide login/signup, show user badge ── */
        if (loginBtn)  loginBtn.style.display  = 'none';
        if (signupBtn) signupBtn.style.display = 'none';

        // Remove any stale badge from previous renders
        var stale = container.querySelector('.nav-user-badge');
        if (stale) stale.remove();
        var staleOut = container.querySelector('.nav-logout-btn');
        if (staleOut) staleOut.remove();

        /* Build badge */
        var badge = document.createElement('div');
        badge.className = 'nav-user-badge';
        badge.style.cssText = [
          'display:inline-flex',
          'align-items:center',
          'gap:8px',
          'background:var(--bg-card)',
          'border:1px solid var(--border-color)',
          'border-radius:999px',
          'padding:4px 14px 4px 4px',
          'font-size:.8rem',
          'color:var(--text-primary)',
          'font-weight:600',
          'cursor:default',
          'user-select:none',
          'transition:border-color .2s'
        ].join(';');

        var avatar = document.createElement('span');
        avatar.className = 'nav-avatar';
        avatar.style.cssText = [
          'width:28px',
          'height:28px',
          'border-radius:50%',
          'display:inline-flex',
          'align-items:center',
          'justify-content:center',
          'font-size:.7rem',
          'font-weight:800',
          'color:#fff',
          'flex-shrink:0',
          'background:linear-gradient(135deg,var(--accent-cyan),var(--accent-violet))',
          'background-size:cover',
          'background-position:center'
        ].join(';');

        /* Use Google profile photo if available */
        if (user.photoURL) {
          avatar.style.backgroundImage = 'url(' + user.photoURL + ')';
          avatar.textContent = '';
        } else {
          avatar.textContent = getInitials(user);
        }

        var nameSpan = document.createElement('span');
        nameSpan.textContent = getDisplayName(user);
        nameSpan.style.cssText = [
          'max-width:90px',
          'overflow:hidden',
          'text-overflow:ellipsis',
          'white-space:nowrap'
        ].join(';');

        badge.appendChild(avatar);
        badge.appendChild(nameSpan);

        /* Logout button */
        var logoutBtn = document.createElement('button');
        logoutBtn.className = 'btn btn-ghost btn-sm nav-logout-btn';
        logoutBtn.textContent = 'Log out';
        logoutBtn.style.marginLeft = '4px';
        logoutBtn.addEventListener('click', function () {
          if (!window.FirebaseAuth) return;
          logoutBtn.disabled = true;
          logoutBtn.textContent = 'Signing out…';
          window.FirebaseAuth.signOut()
            .then(function () {
              window.location.href = 'index.html';
            })
            .catch(function () {
              logoutBtn.disabled = false;
              logoutBtn.textContent = 'Log out';
            });
        });

        container.appendChild(badge);
        container.appendChild(logoutBtn);

      } else {
        /* ── LOGGED OUT: show login/signup, remove badge ── */
        if (loginBtn)  loginBtn.style.display  = '';
        if (signupBtn) signupBtn.style.display = '';

        var existingBadge  = container.querySelector('.nav-user-badge');
        var existingLogout = container.querySelector('.nav-logout-btn');
        if (existingBadge)  existingBadge.remove();
        if (existingLogout) existingLogout.remove();
      }
    });
  }

  /* ── Bootstrap Firebase auth listener ───────────────────────────── */
  function init() {
    if (!window.FirebaseAuth) {
      console.warn('[AuthManager] FirebaseAuth not loaded — skipping init.');
      return;
    }

    window.FirebaseAuth.onAuthStateChanged(function (user) {
      window.currentUser = user || null;
      updateNavbarAuth(user);
      // Notify other modules (history, etc.)
      window.dispatchEvent(new CustomEvent('authStateChanged', { detail: { user: user } }));
    });
  }

  /* ── Run after DOM is ready ──────────────────────────────────────── */
  document.addEventListener('DOMContentLoaded', init);

  /* ── Public API ──────────────────────────────────────────────────── */
  window.AuthManager = {
    getInitials:     getInitials,
    getDisplayName:  getDisplayName,
    updateNavbarAuth: updateNavbarAuth,
    init:            init
  };

  // Legacy shim so any v1.0 code calling window.updateNavbarAuth still works
  window.updateNavbarAuth = updateNavbarAuth;

})();
