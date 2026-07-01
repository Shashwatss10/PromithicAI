/* ===================================================================
   AUTH.JS — Mock Session Manager & Navbar Updater
   AI Web App Builder v1.0
   =================================================================== */

(function () {
  'use strict';

  var SESSION_KEY = 'aiwab-logged-in';
  var USER_EMAIL_KEY = 'aiwab-user-email';
  var USER_NAME_KEY = 'aiwab-user-name';

  var AuthManager = {
    isLoggedIn: function () {
      try { return localStorage.getItem(SESSION_KEY) === 'true'; } catch (e) { return false; }
    },
    getEmail: function () {
      try { return localStorage.getItem(USER_EMAIL_KEY) || ''; } catch (e) { return ''; }
    },
    getName: function () {
      try { return localStorage.getItem(USER_NAME_KEY) || ''; } catch (e) { return ''; }
    },
    logout: function () {
      try {
        localStorage.removeItem(SESSION_KEY);
        localStorage.removeItem(USER_EMAIL_KEY);
        localStorage.removeItem(USER_NAME_KEY);
      } catch (e) { /* ignore */ }
      if (window.AppRouter) {
        window.AppRouter.navigateTo('index.html');
      } else {
        window.location.href = 'index.html';
      }
    }
  };

  /**
   * Update navbar "Log in / Sign Up" buttons based on session state.
   * Replaces them with a user avatar badge + logout button when logged in.
   */
  function updateNavbarAuth() {
    var loggedIn = AuthManager.isLoggedIn();
    var name = AuthManager.getName() || AuthManager.getEmail() || 'User';
    var initial = name.charAt(0).toUpperCase();

    // Find all navbar action containers (supports multiple pages)
    var actionContainers = document.querySelectorAll('.navbar-actions');
    actionContainers.forEach(function (container) {
      var loginBtn = container.querySelector('a[href="login.html"]');
      var signupBtn = container.querySelector('a[href="signup.html"]');

      if (loggedIn) {
        // Hide login/signup buttons
        if (loginBtn) loginBtn.style.display = 'none';
        if (signupBtn) signupBtn.style.display = 'none';

        // Inject user badge + logout if not already present
        if (!container.querySelector('.nav-user-badge')) {
          var badge = document.createElement('div');
          badge.className = 'nav-user-badge';
          badge.style.cssText = [
            'display:inline-flex',
            'align-items:center',
            'gap:8px',
            'background:var(--bg-card)',
            'border:1px solid var(--border-color)',
            'border-radius:999px',
            'padding:4px 12px 4px 4px',
            'font-size:.8rem',
            'color:var(--text-primary)',
            'font-weight:600',
            'cursor:default',
            'user-select:none',
          ].join(';');

          var avatar = document.createElement('span');
          avatar.style.cssText = [
            'width:26px',
            'height:26px',
            'border-radius:50%',
            'background:linear-gradient(135deg,var(--accent-cyan),var(--accent-violet))',
            'display:inline-flex',
            'align-items:center',
            'justify-content:center',
            'font-size:.7rem',
            'font-weight:800',
            'color:#fff',
            'flex-shrink:0',
          ].join(';');
          avatar.textContent = initial;

          var nameSpan = document.createElement('span');
          nameSpan.textContent = name.split(' ')[0]; // first name only
          nameSpan.style.maxWidth = '80px';
          nameSpan.style.overflow = 'hidden';
          nameSpan.style.textOverflow = 'ellipsis';
          nameSpan.style.whiteSpace = 'nowrap';

          badge.appendChild(avatar);
          badge.appendChild(nameSpan);

          var logoutBtn = document.createElement('button');
          logoutBtn.className = 'btn btn-ghost btn-sm';
          logoutBtn.textContent = 'Log out';
          logoutBtn.style.marginLeft = '4px';
          logoutBtn.addEventListener('click', function () {
            AuthManager.logout();
          });

          container.appendChild(badge);
          container.appendChild(logoutBtn);
        }
      } else {
        // Ensure login/signup buttons are visible
        if (loginBtn) loginBtn.style.display = '';
        if (signupBtn) signupBtn.style.display = '';

        // Remove any injected badge
        var existingBadge = container.querySelector('.nav-user-badge');
        if (existingBadge) existingBadge.remove();
        var existingLogout = container.querySelector('.btn-logout-injected');
        if (existingLogout) existingLogout.remove();
      }
    });
  }

  // Run on DOMContentLoaded
  document.addEventListener('DOMContentLoaded', updateNavbarAuth);

  window.AuthManager = AuthManager;
  window.updateNavbarAuth = updateNavbarAuth;
})();
