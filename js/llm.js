/* ===================================================================
   LLM.JS — Live LLM Network Module
   PromithicAI v1.2 — "Bring Your Own Key" (BYOK)
   Supports: OpenAI (gpt-4o-mini, gpt-4o) · Anthropic (claude-3-5-sonnet)
   =================================================================== */

(function () {
  'use strict';

  /* ─────────────────────────────────────────
     Provider Endpoints & Models
     ───────────────────────────────────────── */
  var PROVIDERS = {
    openai: {
      endpoint: 'https://api.openai.com/v1/chat/completions',
      model: 'gpt-4o-mini',
      authHeader: function (key) { return 'Bearer ' + key; },
      buildBody: function (messages, stream) {
        return JSON.stringify({ model: PROVIDERS.openai.model, messages: messages, stream: stream, max_tokens: 4096 });
      },
      parseChunk: function (line) {
        if (!line.startsWith('data: ')) return null;
        var data = line.slice(6).trim();
        if (data === '[DONE]') return null;
        try {
          var parsed = JSON.parse(data);
          return parsed.choices && parsed.choices[0].delta && parsed.choices[0].delta.content
            ? parsed.choices[0].delta.content
            : null;
        } catch (e) { return null; }
      },
    },

    claude: {
      /* NOTE: Anthropic blocks direct browser fetch due to CORS policy.
         We use a well-known public CORS proxy (allorigins.win) as a passthrough.
         This is acceptable for a BYOK personal-use tool.
         For production SaaS, replace with a backend proxy.                     */
      endpoint: 'https://api.anthropic.com/v1/messages',
      proxyEndpoint: 'https://corsproxy.io/?' + encodeURIComponent('https://api.anthropic.com/v1/messages'),
      model: 'claude-3-5-sonnet-20241022',
      authHeader: function (key) { return key; },
      buildBody: function (messages, stream) {
        return JSON.stringify({
          model: PROVIDERS.claude.model,
          max_tokens: 4096,
          stream: stream,
          messages: messages,
        });
      },
      parseChunk: function (line) {
        if (!line.startsWith('data: ')) return null;
        var data = line.slice(6).trim();
        try {
          var parsed = JSON.parse(data);
          if (parsed.type === 'content_block_delta' && parsed.delta && parsed.delta.text) {
            return parsed.delta.text;
          }
          return null;
        } catch (e) { return null; }
      },
    },
  };

  /* ─────────────────────────────────────────
     Core: Streaming fetch (SSE reader)
     ───────────────────────────────────────── */
  async function streamFetch(provider, apiKey, messages, onChunk) {
    var cfg = PROVIDERS[provider];
    if (!cfg) throw new Error('Unknown provider: ' + provider);

    var endpoint = (provider === 'claude') ? cfg.proxyEndpoint : cfg.endpoint;

    var headers = {
      'Content-Type': 'application/json',
    };

    if (provider === 'openai') {
      headers['Authorization'] = cfg.authHeader(apiKey);
    } else if (provider === 'claude') {
      headers['x-api-key'] = apiKey;
      headers['anthropic-version'] = '2023-06-01';
    }

    var response = await fetch(endpoint, {
      method: 'POST',
      headers: headers,
      body: cfg.buildBody(messages, true),
    });

    if (!response.ok) {
      var errBody = '';
      try { errBody = await response.text(); } catch (e) {}
      throw new Error('API Error ' + response.status + ': ' + errBody.slice(0, 200));
    }

    var reader = response.body.getReader();
    var decoder = new TextDecoder();
    var buffer = '';

    while (true) {
      var _ref = await reader.read();
      var done = _ref.done;
      var value = _ref.value;
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      var lines = buffer.split('\n');
      buffer = lines.pop(); // keep incomplete line in buffer
      for (var i = 0; i < lines.length; i++) {
        var line = lines[i].trim();
        if (!line) continue;
        var token = cfg.parseChunk(line);
        if (token && typeof onChunk === 'function') {
          onChunk(token);
        }
      }
    }
    // flush remaining buffer
    if (buffer.trim()) {
      var token = cfg.parseChunk(buffer.trim());
      if (token && typeof onChunk === 'function') onChunk(token);
    }
  }

  /* ─────────────────────────────────────────
     Non-streaming fetch (used for plan & review)
     ───────────────────────────────────────── */
  async function simpleFetch(provider, apiKey, messages) {
    var cfg = PROVIDERS[provider];
    var endpoint = (provider === 'claude') ? cfg.proxyEndpoint : cfg.endpoint;

    var headers = { 'Content-Type': 'application/json' };
    if (provider === 'openai') {
      headers['Authorization'] = cfg.authHeader(apiKey);
    } else if (provider === 'claude') {
      headers['x-api-key'] = apiKey;
      headers['anthropic-version'] = '2023-06-01';
    }

    var response = await fetch(endpoint, {
      method: 'POST',
      headers: headers,
      body: cfg.buildBody(messages, false),
    });

    if (!response.ok) {
      var errBody = '';
      try { errBody = await response.text(); } catch (e) {}
      throw new Error('API Error ' + response.status + ': ' + errBody.slice(0, 200));
    }

    var json = await response.json();

    if (provider === 'openai') {
      return json.choices && json.choices[0].message && json.choices[0].message.content
        ? json.choices[0].message.content
        : '';
    } else if (provider === 'claude') {
      return json.content && json.content[0] && json.content[0].text
        ? json.content[0].text
        : '';
    }
    return '';
  }

  /* ─────────────────────────────────────────
     Public API
     ───────────────────────────────────────── */

  /**
   * PLANNER — Breaks down prompt into bullet point plan steps.
   * @returns {Promise<string[]>} Array of plan step strings.
   */
  async function generatePlan(prompt, provider, apiKey) {
    var systemPrompt =
      'You are a senior software architect. The user will give you a prompt for a web app they want to build. ' +
      'Break it down into exactly 4 concise bullet points (no more, no less). ' +
      'Each bullet should be a single short sentence describing one planning step. ' +
      'Output ONLY the 4 bullets, one per line, starting with "- ". No intro text, no conclusion.';

    var messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: 'Web app prompt: ' + prompt },
    ];

    // Claude uses user-only messages style for simplicity
    if (provider === 'claude') {
      messages = [{ role: 'user', content: systemPrompt + '\n\nWeb app prompt: ' + prompt }];
    }

    var raw = await simpleFetch(provider, apiKey, messages);
    var lines = raw.split('\n').map(function (l) { return l.replace(/^[-*•]\s*/, '').trim(); }).filter(Boolean);
    return lines.slice(0, 5);
  }

  /**
   * CODER — Generates the full HTML app using streaming.
   * @param {Function} onChunk - called with each streamed text token.
   */
  async function generateCodeStream(prompt, plan, provider, apiKey, onChunk) {
    var planText = plan.join('\n');
    var systemPrompt =
      'You are an expert full-stack web developer. Build a complete, beautiful, self-contained single-file web app. ' +
      'OUTPUT ONLY valid HTML — starting with <!DOCTYPE html> and nothing else before it. ' +
      'No markdown code fences, no explanation, no intro text. Just the raw HTML file. ' +
      'Use modern CSS (dark theme, gradient accents), embedded <style> and <script> tags. ' +
      'Make it fully functional and visually impressive.';

    var userContent =
      'User wants: ' + prompt + '\n\nArchitectural plan:\n' + planText +
      '\n\nNow generate the complete single-file HTML app:';

    var messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userContent },
    ];

    if (provider === 'claude') {
      messages = [{ role: 'user', content: systemPrompt + '\n\n' + userContent }];
    }

    await streamFetch(provider, apiKey, messages, onChunk);
  }

  /**
   * REVIEWER — Reviews the generated code and returns bullet points.
   * @returns {Promise<string[]>} Array of review note strings.
   */
  async function generateReview(code, provider, apiKey) {
    var systemPrompt =
      'You are a senior code reviewer. Review the following web app code and provide exactly 4 short review notes. ' +
      'Each note should confirm something works correctly or suggest a minor quality observation. ' +
      'Be positive and concise. Output ONLY the 4 bullets, one per line, starting with "✓ ". No intro text.';

    var codeSnippet = code.substring(0, 2000); // only send first 2k chars to save tokens
    var messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: 'Review this code:\n\n' + codeSnippet },
    ];

    if (provider === 'claude') {
      messages = [{ role: 'user', content: systemPrompt + '\n\nReview this code:\n\n' + codeSnippet }];
    }

    var raw = await simpleFetch(provider, apiKey, messages);
    var lines = raw.split('\n').map(function (l) { return l.replace(/^[✓*•-]\s*/, '').trim(); }).filter(Boolean);
    return lines.slice(0, 5);
  }

  /* ─────────────────────────────────────────
     Export
     ───────────────────────────────────────── */
  window.LLM = {
    generatePlan: generatePlan,
    generateCodeStream: generateCodeStream,
    generateReview: generateReview,
  };

})();
