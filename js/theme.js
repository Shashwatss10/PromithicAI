/* ===================================================================
   THEME.JS — Dark/Light Mode Manager
   AI Web App Builder v1.0
   =================================================================== */

(function () {
  'use strict';

  const STORAGE_KEY = 'aiwab-theme';
  const DARK = 'dark';
  const LIGHT = 'light';

  /**
   * Get the saved theme or system preference
   */
  function getPreferredTheme() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === DARK || saved === LIGHT) return saved;
    // Fallback: default to dark (matches v1.0 design)
    return DARK;
  }

  /**
   * Apply theme to <html> element
   */
  function applyTheme(theme) {
    const html = document.documentElement;
    if (theme === LIGHT) {
      html.setAttribute('data-theme', 'light');
    } else {
      html.removeAttribute('data-theme');
    }
    // Persist
    try { localStorage.setItem(STORAGE_KEY, theme); } catch (e) { /* ignore */ }
    // Dispatch event for any listeners
    window.dispatchEvent(new CustomEvent('themeChanged', { detail: { theme } }));
  }

  /**
   * Toggle between dark and light
   */
  function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme') === 'light' ? LIGHT : DARK;
    applyTheme(current === DARK ? LIGHT : DARK);
  }

  /**
   * Get current theme
   */
  function getTheme() {
    return document.documentElement.getAttribute('data-theme') === 'light' ? LIGHT : DARK;
  }

  /**
   * Initialize theme on page load
   */
  function init() {
    // Apply early to prevent flash
    applyTheme(getPreferredTheme());

    // Attach toggle buttons once DOM is ready
    document.addEventListener('DOMContentLoaded', function () {
      const toggleBtns = document.querySelectorAll('.theme-toggle, [data-theme-toggle]');
      toggleBtns.forEach(function (btn) {
        btn.addEventListener('click', function () {
          toggleTheme();
        });
      });

      // Update theme options in settings page
      updateThemeOptions();

      // Listen for theme changes
      window.addEventListener('themeChanged', function (e) {
        updateThemeOptions();
        updateMonacoTheme(e.detail.theme);
      });
    });
  }

  /**
   * Update settings page theme option selection
   */
  function updateThemeOptions() {
    const current = getTheme();
    const options = document.querySelectorAll('.theme-option');
    options.forEach(function (opt) {
      const optTheme = opt.dataset.theme;
      opt.classList.toggle('selected', optTheme === current);
    });
  }

  /**
   * Update Monaco editor theme if it exists
   */
  function updateMonacoTheme(theme) {
    if (window.monaco) {
      try {
        window.monaco.editor.setTheme(theme === LIGHT ? 'vs' : 'vs-dark');
      } catch (e) { /* ignore */ }
    }
  }

  // Run immediately (before DOMContentLoaded) to prevent flash
  applyTheme(getPreferredTheme());

  // Expose to global scope
  window.ThemeManager = {
    init,
    toggle: toggleTheme,
    get: getTheme,
    set: applyTheme,
  };

  // Auto-init
  init();
})();
