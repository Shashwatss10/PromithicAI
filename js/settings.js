/* ===================================================================
   SETTINGS.JS — Settings & Configuration Manager
   AI Web App Builder v1.0
   =================================================================== */

(function () {
  'use strict';

  var STORAGE_KEY = 'aiwab-settings';

  var DEFAULTS = {
    provider: 'claude',
    claudeKey: '',
    openaiKey: '',
    theme: 'dark',
    agentMode: 'full',        // 'full' | 'simple'
    streamingEnabled: true,
    showConsole: true,
    autoPreview: true,
    fontSize: 14,
  };

  function safeGet() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      return raw ? Object.assign({}, DEFAULTS, JSON.parse(raw)) : Object.assign({}, DEFAULTS);
    } catch (e) {
      return Object.assign({}, DEFAULTS);
    }
  }

  function safeSet(settings) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch (e) { /* ignore */ }
  }

  var SettingsManager = {
    get: function (key) {
      var settings = safeGet();
      return key ? settings[key] : settings;
    },

    set: function (key, value) {
      var settings = safeGet();
      settings[key] = value;
      safeSet(settings);
      window.dispatchEvent(new CustomEvent('settingsChanged', {
        detail: { key: key, value: value, settings: settings }
      }));
    },

    setMany: function (obj) {
      var settings = safeGet();
      Object.assign(settings, obj);
      safeSet(settings);
      window.dispatchEvent(new CustomEvent('settingsChanged', {
        detail: { settings: settings }
      }));
    },

    reset: function () {
      safeSet(Object.assign({}, DEFAULTS));
      window.dispatchEvent(new CustomEvent('settingsChanged', {
        detail: { settings: Object.assign({}, DEFAULTS) }
      }));
    },

    getApiKey: function () {
      var settings = safeGet();
      var provider = settings.provider;
      if (provider === 'claude') return settings.claudeKey || '';
      if (provider === 'openai') return settings.openaiKey || '';
      return '';
    },

    hasApiKey: function () {
      return this.getApiKey().length > 10;
    },
  };

  // ── Init settings UI on the settings page ──
  function initSettingsPage() {
    // Provider cards
    var providerCards = document.querySelectorAll('.provider-card');
    providerCards.forEach(function (card) {
      card.addEventListener('click', function () {
        var provider = card.dataset.provider;
        SettingsManager.set('provider', provider);
        providerCards.forEach(function (c) { c.classList.remove('selected'); });
        card.classList.add('selected');
      });

      // Mark current
      if (card.dataset.provider === SettingsManager.get('provider')) {
        card.classList.add('selected');
      }
    });

    // API key inputs
    var claudeKeyInput = document.getElementById('claude-key-input');
    var openaiKeyInput = document.getElementById('openai-key-input');

    if (claudeKeyInput) {
      claudeKeyInput.value = SettingsManager.get('claudeKey');
      claudeKeyInput.addEventListener('input', function () {
        SettingsManager.set('claudeKey', claudeKeyInput.value.trim());
      });
    }

    if (openaiKeyInput) {
      openaiKeyInput.value = SettingsManager.get('openaiKey');
      openaiKeyInput.addEventListener('input', function () {
        SettingsManager.set('openaiKey', openaiKeyInput.value.trim());
      });
    }

    // Password toggles for API keys
    document.querySelectorAll('.password-toggle').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var targetId = btn.dataset.target;
        var input = document.getElementById(targetId);
        if (!input) return;
        var isHidden = input.type === 'password';
        input.type = isHidden ? 'text' : 'password';
        var eyeIcon = btn.querySelector('.eye-icon');
        var eyeOffIcon = btn.querySelector('.eye-off-icon');
        if (eyeIcon) eyeIcon.style.display = isHidden ? 'none' : '';
        if (eyeOffIcon) eyeOffIcon.style.display = isHidden ? '' : 'none';
      });
    });

    // Theme options
    var themeOptions = document.querySelectorAll('.theme-option');
    themeOptions.forEach(function (opt) {
      opt.addEventListener('click', function () {
        var theme = opt.dataset.theme;
        SettingsManager.set('theme', theme);
        if (window.ThemeManager) window.ThemeManager.set(theme);
      });
    });

    // Toggle settings
    document.querySelectorAll('[data-setting-toggle]').forEach(function (toggle) {
      var key = toggle.dataset.settingToggle;
      var input = toggle.querySelector('input[type="checkbox"]');
      if (input) {
        input.checked = SettingsManager.get(key) !== false;
        input.addEventListener('change', function () {
          SettingsManager.set(key, input.checked);
        });
      }
    });

    // Agent mode radio
    document.querySelectorAll('[data-agent-mode]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var mode = btn.dataset.agentMode;
        SettingsManager.set('agentMode', mode);
        document.querySelectorAll('[data-agent-mode]').forEach(function (b) {
          b.classList.toggle('active', b.dataset.agentMode === mode);
        });
      });
      btn.classList.toggle('active', btn.dataset.agentMode === SettingsManager.get('agentMode'));
    });

    // Sidebar nav smooth scroll
    document.querySelectorAll('.settings-nav-item[href]').forEach(function (link) {
      link.addEventListener('click', function (e) {
        e.preventDefault();
        var target = document.querySelector(link.getAttribute('href'));
        if (target) {
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
        document.querySelectorAll('.settings-nav-item').forEach(function (l) {
          l.classList.remove('active');
        });
        link.classList.add('active');
      });
    });
  }

  // Auto-init settings page if elements are found
  document.addEventListener('DOMContentLoaded', function () {
    if (document.querySelector('.settings-page')) {
      initSettingsPage();
    }
  });

  window.SettingsManager = SettingsManager;
})();
