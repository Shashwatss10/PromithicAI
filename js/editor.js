/* ===================================================================
   EDITOR.JS — Monaco Editor Integration
   AI Web App Builder v1.0
   =================================================================== */

(function () {
  'use strict';

  var editor = null;
  var isReady = false;
  var pendingCode = null;
  var CDN_BASE = 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.44.0/min/vs';

  /**
   * Load Monaco editor from CDN and initialize in the given container
   * @param {string|HTMLElement} container - DOM element ID or element
   * @param {object} options
   */
  function init(container, options) {
    options = options || {};
    var el = typeof container === 'string' ? document.getElementById(container) : container;
    if (!el) {
      console.warn('Monaco: container not found');
      return;
    }

    // Inject require.js loader if not present
    if (typeof window.require === 'undefined' || !window.require.config) {
      var script = document.createElement('script');
      script.src = CDN_BASE + '/loader.min.js';
      script.onload = function () {
        configureAndCreate(el, options);
      };
      script.onerror = function () {
        console.warn('Monaco: CDN load failed, using fallback textarea');
        createFallback(el, options);
      };
      document.head.appendChild(script);
    } else {
      configureAndCreate(el, options);
    }
  }

  function configureAndCreate(el, options) {
    try {
      window.require.config({ paths: { vs: CDN_BASE } });
      window.require(['vs/editor/editor.main'], function () {
        createEditor(el, options);
      });
    } catch (e) {
      console.warn('Monaco configure error:', e);
      createFallback(el, options);
    }
  }

  function createEditor(el, options) {
    var isDark = document.documentElement.getAttribute('data-theme') !== 'light';
    var theme = isDark ? 'vs-dark' : 'vs';

    try {
      editor = window.monaco.editor.create(el, {
        value: options.value || '',
        language: options.language || 'html',
        theme: theme,
        fontSize: options.fontSize || 13,
        fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
        fontLigatures: true,
        minimap: { enabled: false },
        scrollBeyondLastLine: false,
        wordWrap: 'on',
        lineNumbers: 'on',
        glyphMargin: false,
        folding: true,
        automaticLayout: true,
        tabSize: 2,
        insertSpaces: true,
        readOnly: options.readOnly || false,
        scrollbar: {
          verticalScrollbarSize: 6,
          horizontalScrollbarSize: 6,
        },
        overviewRulerLanes: 0,
        renderLineHighlight: 'line',
        bracketPairColorization: { enabled: true },
        padding: { top: 12, bottom: 12 },
      });

      isReady = true;

      // If code was queued before editor was ready
      if (pendingCode !== null) {
        setCode(pendingCode);
        pendingCode = null;
      }

      // Handle theme changes
      window.addEventListener('themeChanged', function (e) {
        if (editor && window.monaco) {
          window.monaco.editor.setTheme(
            e.detail.theme === 'light' ? 'vs' : 'vs-dark'
          );
        }
      });

      if (typeof options.onReady === 'function') {
        options.onReady(editor);
      }
    } catch (e) {
      console.warn('Monaco create error:', e);
      createFallback(el, options);
    }
  }

  /**
   * Fallback: simple textarea when Monaco CDN fails
   */
  function createFallback(el, options) {
    el.innerHTML = '';
    var textarea = document.createElement('textarea');
    textarea.id = 'monaco-fallback';
    textarea.className = 'monaco-fallback-textarea';
    textarea.style.cssText = [
      'width:100%',
      'height:100%',
      'background:var(--bg-code)',
      'color:var(--text-primary)',
      'border:none',
      'outline:none',
      'padding:16px',
      'font-family:var(--font-mono)',
      'font-size:13px',
      'line-height:1.7',
      'resize:none',
      'tab-size:2',
    ].join(';');
    textarea.placeholder = '// Generated code will appear here...';
    textarea.value = options.value || '';
    el.appendChild(textarea);

    // Expose a minimal editor-like API
    editor = {
      getValue: function () { return textarea.value; },
      setValue: function (val) { textarea.value = val; textarea.scrollTop = 0; },
      layout: function () {},
      dispose: function () {},
      _isFallback: true,
    };

    isReady = true;
    if (pendingCode !== null) {
      editor.setValue(pendingCode);
      pendingCode = null;
    }
  }

  /**
   * Set the code content in the editor
   */
  function setCode(code) {
    if (!isReady || !editor) {
      pendingCode = code;
      return;
    }
    try {
      if (editor._isFallback) {
        editor.setValue(code);
      } else {
        var model = editor.getModel();
        if (model) {
          model.setValue(code);
        }
        editor.setScrollPosition({ scrollTop: 0 });
      }
    } catch (e) {
      console.warn('Monaco setCode error:', e);
    }
  }

  /**
   * Get the current code content
   */
  function getCode() {
    if (!editor) return '';
    try {
      return editor.getValue();
    } catch (e) {
      return '';
    }
  }

  /**
   * Append text to the editor (for streaming)
   */
  function appendCode(text) {
    if (!isReady || !editor) return;
    try {
      if (editor._isFallback) {
        editor.setValue(editor.getValue() + text);
        var ta = document.getElementById('monaco-fallback');
        if (ta) ta.scrollTop = ta.scrollHeight;
      } else {
        var model = editor.getModel();
        if (!model) return;
        var lineCount = model.getLineCount();
        var lastCol = model.getLineMaxColumn(lineCount);
        var range = new window.monaco.Range(lineCount, lastCol, lineCount, lastCol);
        model.applyEdits([{ range: range, text: text }]);
        editor.revealLine(model.getLineCount());
      }
    } catch (e) { /* ignore edit errors */ }
  }

  /**
   * Clear editor content
   */
  function clear() {
    setCode('');
  }

  /**
   * Dispose editor
   */
  function dispose() {
    if (editor && typeof editor.dispose === 'function') {
      try { editor.dispose(); } catch (e) {}
    }
    editor = null;
    isReady = false;
  }

  window.EditorManager = {
    init: init,
    setCode: setCode,
    getCode: getCode,
    appendCode: appendCode,
    clear: clear,
    dispose: dispose,
    isReady: function () { return isReady; },
    getInstance: function () { return editor; },
  };
})();
