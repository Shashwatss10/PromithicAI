/* ===================================================================
   HISTORY.JS — Build History Manager (localStorage + Supabase sync)
   PromithicAI v1.1
   =================================================================== */

(function () {
  'use strict';

  var STORAGE_KEY = 'aiwab-history';
  var MAX_ITEMS   = 30;

  /* ── localStorage helpers ────────────────────────────────────────── */
  function safeGet() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) { return []; }
  }

  function safeSet(items) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch (e) { /* ignore quota errors */ }
  }

  /* ── HTML escaping ───────────────────────────────────────────────── */
  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  /* ── Public HistoryManager API ───────────────────────────────────── */
  var HistoryManager = {

    getAll: function () {
      return safeGet();
    },

    /**
     * Add a new build. Saves to localStorage immediately.
     * If user is logged in, also saves to Supabase asynchronously.
     */
    add: function (item) {
      var items = safeGet();
      var newItem = {
        id:        Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
        prompt:    item.prompt   || '',
        code:      item.code     || '',
        template:  item.template || 'custom',
        timestamp: new Date().toISOString(),
        provider:  item.provider || 'Claude',
      };
      items.unshift(newItem);
      if (items.length > MAX_ITEMS) items = items.slice(0, MAX_ITEMS);
      safeSet(items);
      window.dispatchEvent(new CustomEvent('historyUpdated'));

      /* Cloud sync (fire-and-forget) */
      var user = window.currentUser;
      if (user && window.SupabaseDB) {
        window.SupabaseDB.saveBuild(user.uid, newItem)
          .catch(function (err) {
            console.warn('[History] Supabase save failed:', err.message);
          });
      }

      return newItem;
    },

    /**
     * Remove a build by id. Syncs to Supabase if logged in.
     */
    remove: function (id) {
      var items = safeGet().filter(function (i) { return i.id !== id; });
      safeSet(items);
      window.dispatchEvent(new CustomEvent('historyUpdated'));

      var user = window.currentUser;
      if (user && window.SupabaseDB) {
        window.SupabaseDB.deleteBuild(user.uid, id)
          .catch(function (err) {
            console.warn('[History] Supabase delete failed:', err.message);
          });
      }
    },

    /**
     * Clear all history. Syncs to Supabase if logged in.
     */
    clear: function () {
      safeSet([]);
      window.dispatchEvent(new CustomEvent('historyUpdated'));

      var user = window.currentUser;
      if (user && window.SupabaseDB) {
        window.SupabaseDB.clearBuilds(user.uid)
          .catch(function (err) {
            console.warn('[History] Supabase clear failed:', err.message);
          });
      }
    },

    getById: function (id) {
      return safeGet().find(function (i) { return i.id === id; }) || null;
    },

    formatTime: function (iso) {
      try {
        var d    = new Date(iso);
        var now  = new Date();
        var diff = now - d;
        if (diff < 60000)    return 'Just now';
        if (diff < 3600000)  return Math.floor(diff / 60000)   + 'm ago';
        if (diff < 86400000) return Math.floor(diff / 3600000) + 'h ago';
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      } catch (e) { return ''; }
    },

    /**
     * Pull builds from Supabase and overwrite localStorage cache.
     * Called automatically when user logs in.
     */
    syncFromCloud: function () {
      var user = window.currentUser;
      if (!user || !window.SupabaseDB) return;

      window.SupabaseDB.getBuilds(user.uid)
        .then(function (rows) {
          if (!rows || rows.length === 0) return;
          var mapped = rows.map(function (r) {
            return {
              id:        r.id,
              prompt:    r.prompt   || '',
              code:      r.code     || '',
              template:  r.template || 'custom',
              timestamp: r.created_at,
              provider:  r.provider || 'Claude',
            };
          });
          safeSet(mapped);
          window.dispatchEvent(new CustomEvent('historyUpdated'));
        })
        .catch(function (err) {
          console.warn('[History] Supabase sync failed:', err.message);
        });
    },

    /**
     * Render history items into a container element.
     * @param {HTMLElement} container
     * @param {function}    onSelect   Called with the selected item
     */
    renderTo: function (container, onSelect) {
      if (!container) return;
      var items = safeGet();

      if (items.length === 0) {
        container.innerHTML = [
          '<div class="history-empty">',
          '  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">',
          '    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>',
          '  </svg>',
          '  <p>No builds yet.<br>Type a prompt to get started!</p>',
          '</div>'
        ].join('');
        return;
      }

      container.innerHTML = items.map(function (item) {
        var shortPrompt = item.prompt.length > 42
          ? item.prompt.substring(0, 42) + '…'
          : item.prompt;
        return [
          '<div class="history-item" data-id="' + item.id + '" title="' + escapeHtml(item.prompt) + '">',
          '  <div class="history-icon">',
          '    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">',
          '      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"/>',
          '    </svg>',
          '  </div>',
          '  <div class="history-info">',
          '    <div class="history-prompt">' + escapeHtml(shortPrompt) + '</div>',
          '    <div class="history-time">' + HistoryManager.formatTime(item.timestamp) + '</div>',
          '  </div>',
          '  <button class="history-delete" data-delete-id="' + item.id + '" title="Delete">',
          '    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">',
          '      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>',
          '    </svg>',
          '  </button>',
          '</div>'
        ].join('');
      }).join('');

      /* Click to load item */
      container.querySelectorAll('.history-item').forEach(function (el) {
        el.addEventListener('click', function (e) {
          if (e.target.closest('.history-delete')) return;
          var item = HistoryManager.getById(el.dataset.id);
          if (item && typeof onSelect === 'function') {
            container.querySelectorAll('.history-item').forEach(function (i) {
              i.classList.remove('active');
            });
            el.classList.add('active');
            onSelect(item);
          }
        });
      });

      /* Delete button */
      container.querySelectorAll('.history-delete').forEach(function (btn) {
        btn.addEventListener('click', function (e) {
          e.stopPropagation();
          HistoryManager.remove(btn.dataset.deleteId);
          HistoryManager.renderTo(container, onSelect);
        });
      });
    }
  };

  /* ── Sync from cloud whenever user logs in ───────────────────────── */
  window.addEventListener('authStateChanged', function (e) {
    if (e.detail && e.detail.user) {
      HistoryManager.syncFromCloud();
    }
  });

  window.HistoryManager = HistoryManager;

})();
