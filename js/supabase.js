/* ===================================================================
   SUPABASE.JS — Supabase Cloud DB Client
   PromithicAI v1.1
   Uses direct REST API — no extra library needed.
   =================================================================== */

(function () {
  'use strict';

  var SUPABASE_URL = 'https://xlzzxhpkyupjbqxuaksm.supabase.co';
  var SUPABASE_KEY = 'sb_publishable_0vtLXL7OtLfe_b6WC-bZrA_DrONRdMd';
  var REST_BASE    = SUPABASE_URL + '/rest/v1';

  /* ── Build request headers ───────────────────────────────────────── */
  function makeHeaders(extra) {
    var h = {
      'apikey':         SUPABASE_KEY,
      'Authorization':  'Bearer ' + SUPABASE_KEY,
      'Content-Type':   'application/json',
    };
    if (extra) {
      Object.keys(extra).forEach(function (k) { h[k] = extra[k]; });
    }
    return h;
  }

  /* ── Generic fetch helper ────────────────────────────────────────── */
  function sbFetch(url, opts) {
    return fetch(url, opts).then(function (res) {
      if (!res.ok) {
        return res.text().then(function (body) {
          throw new Error('Supabase error ' + res.status + ': ' + body);
        });
      }
      // 204 No Content → nothing to parse
      if (res.status === 204) return null;
      return res.json();
    });
  }

  /* ── Public DB API ───────────────────────────────────────────────── */
  var SupabaseDB = {

    /**
     * Save a build to the cloud.
     * @param {string} userId  Firebase UID
     * @param {object} item    { id, prompt, code, template, provider }
     */
    saveBuild: function (userId, item) {
      return sbFetch(REST_BASE + '/builds', {
        method:  'POST',
        headers: makeHeaders({ 'Prefer': 'return=minimal' }),
        body: JSON.stringify({
          id:       item.id,
          user_id:  userId,
          prompt:   item.prompt  || '',
          code:     item.code    || '',
          template: item.template || 'custom',
          provider: item.provider || 'claude',
        })
      });
    },

    /**
     * Fetch all builds for a user, newest first, max 30.
     * @param {string} userId
     * @returns {Promise<Array>}
     */
    getBuilds: function (userId) {
      var url = REST_BASE + '/builds'
        + '?user_id=eq.' + encodeURIComponent(userId)
        + '&order=created_at.desc'
        + '&limit=30'
        + '&select=id,user_id,prompt,code,template,provider,created_at';
      return sbFetch(url, {
        method:  'GET',
        headers: makeHeaders()
      });
    },

    /**
     * Delete a specific build.
     * @param {string} userId
     * @param {string} buildId
     */
    deleteBuild: function (userId, buildId) {
      var url = REST_BASE + '/builds'
        + '?id=eq.'      + encodeURIComponent(buildId)
        + '&user_id=eq.' + encodeURIComponent(userId);
      return sbFetch(url, {
        method:  'DELETE',
        headers: makeHeaders()
      });
    },

    /**
     * Delete all builds for a user.
     * @param {string} userId
     */
    clearBuilds: function (userId) {
      var url = REST_BASE + '/builds'
        + '?user_id=eq.' + encodeURIComponent(userId);
      return sbFetch(url, {
        method:  'DELETE',
        headers: makeHeaders()
      });
    }
  };

  window.SupabaseDB = SupabaseDB;

})();
