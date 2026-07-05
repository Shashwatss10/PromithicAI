/* ===================================================================
   STREAMING.JS — Token-by-Token Text Streamer
   PromithicAI v1.1
   =================================================================== */

(function () {
  'use strict';

  /**
   * Stream text into a target element character by character
   * @param {string} text - Text to stream
   * @param {HTMLElement} target - DOM element to append to
   * @param {object} options
   *   @param {number} options.delay - ms per character (default 12)
   *   @param {boolean} options.append - if true, appends to existing content (default false)
   *   @param {string} options.className - CSS class for each span
   *   @param {Function} options.onChar - callback per character
   *   @param {Function} options.onDone - callback when complete
   *   @param {Function} options.getAbort - function returning a boolean; if true, stops streaming
   * @returns {{ stop: Function, promise: Promise }}
   */
  function streamText(text, target, options) {
    options = options || {};
    var delay = typeof options.delay === 'number' ? options.delay : 12;
    var append = options.append !== false;
    var className = options.className || '';

    if (!target) {
      return { stop: function () {}, promise: Promise.resolve() };
    }

    if (!append) {
      target.textContent = '';
    }

    var stopped = false;
    var index = 0;
    var resolvePromise;

    var promise = new Promise(function (resolve) {
      resolvePromise = resolve;
    });

    function typeNext() {
      if (stopped || index >= text.length) {
        if (typeof options.onDone === 'function') options.onDone();
        if (resolvePromise) resolvePromise();
        return;
      }

      // Check external abort signal
      if (typeof options.getAbort === 'function' && options.getAbort()) {
        stopped = true;
        if (resolvePromise) resolvePromise();
        return;
      }

      var char = text[index];
      index++;

      if (className) {
        var span = document.createElement('span');
        if (className) span.className = className;
        span.textContent = char;
        target.appendChild(span);
      } else {
        target.textContent += char;
      }

      if (typeof options.onChar === 'function') {
        options.onChar(char, index);
      }

      // Auto-scroll target's parent if needed
      var scrollParent = target.closest('.streaming-console, .code-content, [data-scroll]');
      if (scrollParent) {
        scrollParent.scrollTop = scrollParent.scrollHeight;
      }

      setTimeout(typeNext, delay);
    }

    typeNext();

    return {
      stop: function () { stopped = true; },
      promise: promise
    };
  }

  /**
   * Stream text line by line into a console element
   * @param {string[]} lines - Array of log lines
   * @param {HTMLElement} container - Container element
   * @param {object} options
   *   @param {number} options.lineDelay - ms between lines (default 180)
   * @returns {{ stop: Function, promise: Promise }}
   */
  function streamLines(lines, container, options) {
    options = options || {};
    var lineDelay = typeof options.lineDelay === 'number' ? options.lineDelay : 180;

    var stopped = false;
    var index = 0;
    var resolvePromise;

    var promise = new Promise(function (resolve) {
      resolvePromise = resolve;
    });

    function addLine() {
      if (stopped || index >= lines.length) {
        if (typeof options.onDone === 'function') options.onDone();
        if (resolvePromise) resolvePromise();
        return;
      }

      var lineData = lines[index];
      index++;

      var span = document.createElement('span');
      span.className = 'console-line' + (lineData.type ? ' ' + lineData.type : '');

      var prefix = '';
      if (lineData.type === 'info')    prefix = '[INFO] ';
      else if (lineData.type === 'success') prefix = '[DONE] ';
      else if (lineData.type === 'warn')    prefix = '[WARN] ';
      else if (lineData.type === 'error')   prefix = '[ERR]  ';

      span.innerHTML = '<span class="console-prefix">' + prefix + '</span>' + escapeHtml(lineData.text || lineData);
      container.appendChild(span);
      container.scrollTop = container.scrollHeight;

      setTimeout(addLine, lineDelay);
    }

    addLine();

    return {
      stop: function () { stopped = true; },
      promise: promise
    };
  }

  /**
   * Simulate streaming code into a Monaco editor or textarea
   * Returns a promise that resolves when streaming is complete
   * @param {string} code - Code to stream
   * @param {Function} onToken - called with cumulative code string
   * @param {object} options
   * @returns {{ stop: Function, promise: Promise }}
   */
  function streamCode(code, onToken, options) {
    options = options || {};
    var chunkSize = options.chunkSize || 4;   // characters per tick
    var delay = options.delay || 8;            // ms per tick
    var stopped = false;
    var index = 0;
    var resolvePromise;

    var promise = new Promise(function (resolve) {
      resolvePromise = resolve;
    });

    function tick() {
      if (stopped || index >= code.length) {
        if (typeof options.onDone === 'function') options.onDone(code);
        if (resolvePromise) resolvePromise(code);
        return;
      }

      if (typeof options.getAbort === 'function' && options.getAbort()) {
        stopped = true;
        if (resolvePromise) resolvePromise(code.substring(0, index));
        return;
      }

      var end = Math.min(index + chunkSize, code.length);
      index = end;

      if (typeof onToken === 'function') {
        onToken(code.substring(0, index), index, code.length);
      }

      setTimeout(tick, delay);
    }

    tick();

    return {
      stop: function () { stopped = true; },
      promise: promise
    };
  }

  /**
   * Typewriter effect for headings (rewrites innerHTML char by char)
   * @param {HTMLElement} el - Element to typewrite into
   * @param {string[]} words - Array of words to cycle through
   * @param {object} options
   */
  function typewriterCycle(el, words, options) {
    if (!el || !words || words.length === 0) return;
    options = options || {};
    var typeDelay = options.typeDelay || 80;
    var deleteDelay = options.deleteDelay || 40;
    var pauseDelay = options.pauseDelay || 2000;

    var wordIndex = 0;
    var charIndex = 0;
    var isDeleting = false;

    function type() {
      var current = words[wordIndex % words.length];

      if (isDeleting) {
        charIndex--;
      } else {
        charIndex++;
      }

      el.textContent = current.substring(0, charIndex);

      var speed = isDeleting ? deleteDelay : typeDelay;

      if (!isDeleting && charIndex === current.length) {
        speed = pauseDelay;
        isDeleting = true;
      } else if (isDeleting && charIndex === 0) {
        isDeleting = false;
        wordIndex++;
        speed = 300;
      }

      setTimeout(type, speed);
    }

    type();
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  window.Streaming = {
    streamText: streamText,
    streamLines: streamLines,
    streamCode: streamCode,
    typewriterCycle: typewriterCycle,
  };
})();
