/* ===================================================================
   HERO 3D — Agent Orbit Visualization
   PromithicAI v2.0 — WebGL/Three.js Free Implementation
   Lightweight canvas-based 3D orbit animation
   =================================================================== */

(function () {
  'use strict';

  /* ── Bail out for reduced motion or no canvas support ── */
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  var canvas = document.getElementById('agent-canvas');
  if (!canvas) return;

  var ctx = canvas.getContext('2d', { alpha: true, antialias: true });
  if (!ctx) return;

  /* ── Configuration ── */
  var CONFIG = {
    core: {
      radius: 40,
      pulseSpeed: 0.8,
      pulseAmount: 0.15
    },
    agents: [
      {
        id: 'planner',
        name: 'Planner',
        color: '#00d4ff',
        glow: 'rgba(0, 212, 255, 0.6)',
        orbitRadius: 160,
        orbitSpeed: 0.00035,
        angleOffset: 0,
        size: 14,
        pulsePhase: 0
      },
      {
        id: 'coder',
        name: 'Coder',
        color: '#7c3aed',
        glow: 'rgba(124, 58, 237, 0.6)',
        orbitRadius: 160,
        orbitSpeed: 0.00055,
        angleOffset: 2.094, // 120°
        size: 14,
        pulsePhase: 2.094
      },
      {
        id: 'reviewer',
        name: 'Reviewer',
        color: '#10b981',
        glow: 'rgba(16, 185, 129, 0.6)',
        orbitRadius: 160,
        orbitSpeed: 0.00045,
        angleOffset: 4.188, // 240°
        size: 14,
        pulsePhase: 4.188
      }
    ],
    connections: {
      maxDistance: 280,
      baseOpacity: 0.15,
      pulseOpacity: 0.4
    },
    particles: {
      count: 60,
      maxSize: 2,
      minSize: 0.5,
      speed: 0.0002
    }
  };

  /* ── State ── */
  var width = 0;
  var height = 0;
  var centerX = 0;
  var centerY = 0;
  var time = 0;
  var animationId = null;
  var particles = [];
  var mouseX = 0;
  var mouseY = 0;
  var targetMouseX = 0;
  var targetMouseY = 0;
  var isVisible = false;

  /* ── Resize Handler ── */
  function resize() {
    var container = canvas.parentElement;
    if (!container) return;

    var rect = container.getBoundingClientRect();
    var dpr = Math.min(window.devicePixelRatio || 1, 2);

    width = Math.floor(rect.width);
    height = Math.floor(rect.height);

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';

    ctx.scale(dpr, dpr);

    centerX = width / 2;
    centerY = height / 2;

    /* Update agent orbit radii based on container size */
    var maxRadius = Math.min(width, height) * 0.45;
    CONFIG.agents.forEach(function (agent) {
      agent.orbitRadius = Math.min(agent.orbitRadius, maxRadius);
    });

    /* Regenerate particles */
    initParticles();
  }

  /* ── Particle System ── */
  function initParticles() {
    particles = [];
    for (var i = 0; i < CONFIG.particles.count; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * CONFIG.particles.speed * width,
        vy: (Math.random() - 0.5) * CONFIG.particles.speed * height,
        size: Math.random() * (CONFIG.particles.maxSize - CONFIG.particles.minSize) + CONFIG.particles.minSize,
        opacity: Math.random() * 0.4 + 0.1,
        color: Math.random() > 0.6 ? '#00d4ff' : (Math.random() > 0.3 ? '#7c3aed' : '#10b981')
      });
    }
  }

  function updateParticles(deltaTime) {
    var maxDim = Math.max(width, height);
    particles.forEach(function (p) {
      p.x += p.vx * deltaTime;
      p.y += p.vy * deltaTime;

      /* Subtle attraction to center */
      var dx = centerX - p.x;
      var dy = centerY - p.y;
      var dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > 0) {
        var force = 0.00001 * maxDim / (dist * dist);
        p.vx += dx * force * deltaTime;
        p.vy += dy * force * deltaTime;
      }

      /* Wrap around */
      if (p.x < -50) p.x = width + 50;
      if (p.x > width + 50) p.x = -50;
      if (p.y < -50) p.y = height + 50;
      if (p.y < -50) p.y = height + 50;
    });
  }

  function drawParticles() {
    particles.forEach(function (p) {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.opacity;
      ctx.fill();
    });
    ctx.globalAlpha = 1;
  }

  /* ── Core Drawing ── */
  function drawCore(t) {
    var pulse = Math.sin(t * CONFIG.core.pulseSpeed) * CONFIG.core.pulseAmount + 1;
    var radius = CONFIG.core.radius * pulse;

    /* Outer glow rings */
    for (var i = 3; i >= 0; i--) {
      var ringRadius = radius + i * 12;
      var opacity = 0.03 * (4 - i) / 4;
      ctx.beginPath();
      ctx.arc(centerX, centerY, ringRadius * pulse, 0, Math.PI * 2);
      ctx.strokeStyle = '#00d4ff';
      ctx.globalAlpha = opacity;
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    /* Core body */
    var gradient = ctx.createRadialGradient(
      centerX, centerY, 0,
      centerX, centerY, radius
    );
    gradient.addColorStop(0, 'rgba(10, 14, 26, 1)');
    gradient.addColorStop(0.5, 'rgba(0, 212, 255, 0.15)');
    gradient.addColorStop(1, 'rgba(0, 212, 255, 0.05)');

    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.fillStyle = gradient;
    ctx.fill();

    /* Core border */
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(0, 212, 255, 0.4)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    /* Inner highlight */
    ctx.beginPath();
    ctx.arc(centerX - radius * 0.2, centerY - radius * 0.2, radius * 0.3, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0, 212, 255, 0.1)';
    ctx.fill();
  }

  /* ── Agent Drawing ── */
  function getAgentPosition(agent, t) {
    var angle = t * agent.orbitSpeed + agent.angleOffset;
    var x = centerX + Math.cos(angle) * agent.orbitRadius;
    var y = centerY + Math.sin(angle) * agent.orbitRadius;
    return { x: x, y: y, angle: angle };
  }

  function drawAgent(agent, pos, t, isActive) {
    var pulse = Math.sin(t * 2 + agent.pulsePhase) * 0.1 + 1;
    var size = agent.size * pulse;

    /* Orbit path */
    ctx.beginPath();
    ctx.arc(centerX, centerY, agent.orbitRadius, 0, Math.PI * 2);
    ctx.strokeStyle = agent.color;
    ctx.globalAlpha = 0.08;
    ctx.lineWidth = 1;
    ctx.setLineDash([8, 12]);
    ctx.stroke();
    ctx.setLineDash([]);

    /* Connection to core */
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(pos.x, pos.y);
    ctx.strokeStyle = agent.color;
    ctx.globalAlpha = 0.12;
    ctx.lineWidth = 1;
    ctx.stroke();

    /* Agent glow */
    var glowRadius = size * 4;
    var glowGrad = ctx.createRadialGradient(pos.x, pos.y, 0, pos.x, pos.y, glowRadius);
    glowGrad.addColorStop(0, agent.glow);
    glowGrad.addColorStop(1, 'transparent');

    ctx.beginPath();
    ctx.arc(pos.x, pos.y, glowRadius, 0, Math.PI * 2);
    ctx.fillStyle = glowGrad;
    ctx.globalAlpha = 0.6;
    ctx.fill();

    /* Agent body */
    var agentGrad = ctx.createRadialGradient(
      pos.x - size * 0.3, pos.y - size * 0.3, 0,
      pos.x, pos.y, size
    );
    agentGrad.addColorStop(0, '#ffffff');
    agentGrad.addColorStop(0.5, agent.color);
    agentGrad.addColorStop(1, agent.color + 'cc');

    ctx.beginPath();
    ctx.arc(pos.x, pos.y, size, 0, Math.PI * 2);
    ctx.fillStyle = agentGrad;
    ctx.globalAlpha = 1;
    ctx.fill();

    /* Agent border */
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, size, 0, Math.PI * 2);
    ctx.strokeStyle = '#ffffff';
    ctx.globalAlpha = 0.4;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    /* Active indicator */
    if (isActive) {
      var ringRadius = size + 6 + Math.sin(t * 3) * 3;
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, ringRadius, 0, Math.PI * 2);
      ctx.strokeStyle = agent.color;
      ctx.globalAlpha = 0.6;
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }

  /* ── Connection Lines Between Agents ── */
  function drawConnections(agents, positions, t) {
    for (var i = 0; i < agents.length; i++) {
      for (var j = i + 1; j < agents.length; j++) {
        var pos1 = positions[i];
        var pos2 = positions[j];

        var dx = pos2.x - pos1.x;
        var dy = pos2.y - pos1.y;
        var dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < CONFIG.connections.maxDistance) {
          var opacity = CONFIG.connections.baseOpacity +
            Math.sin(t * 1.5 + i + j) * CONFIG.connections.pulseOpacity;
          opacity = Math.max(0.05, Math.min(0.5, opacity));

          var grad = ctx.createLinearGradient(pos1.x, pos1.y, pos2.x, pos2.y);
          grad.addColorStop(0, agents[i].color);
          grad.addColorStop(0.5, '#ffffff');
          grad.addColorStop(1, agents[j].color);

          ctx.beginPath();
          ctx.moveTo(pos1.x, pos1.y);
          ctx.lineTo(pos2.x, pos2.y);
          ctx.strokeStyle = grad;
          ctx.globalAlpha = opacity;
          ctx.lineWidth = 1.5;
          ctx.stroke();
        }
      }
    }
  }

  /* ── Data Flow Particles ── */
  var dataParticles = [];

  function spawnDataParticle(fromAgent, toAgent) {
    var fromPos = getAgentPosition(fromAgent, time);
    var toPos = getAgentPosition(toAgent, time);

    dataParticles.push({
      x: fromPos.x,
      y: fromPos.y,
      targetX: toPos.x,
      targetY: toPos.y,
      progress: 0,
      color: fromAgent.color,
      size: 3,
      life: 1
    });
  }

  function updateDataParticles(deltaTime) {
    for (var i = dataParticles.length - 1; i >= 0; i--) {
      var p = dataParticles[i];
      p.progress += deltaTime * 0.0015;
      p.life -= deltaTime * 0.0008;

      if (p.progress >= 1 || p.life <= 0) {
        dataParticles.splice(i, 1);
        continue;
      }

      var ease = p.progress * p.progress * (3 - 2 * p.progress);
      p.x += (p.targetX - p.x) * 0.02;
      p.y += (p.targetY - p.y) * 0.02;
    }
  }

  function drawDataParticles() {
    dataParticles.forEach(function (p) {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.globalAlpha = 0.8 * p.life;
      ctx.fill();

      /* Trail */
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * 2 * p.life, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.globalAlpha = 0.2 * p.life;
      ctx.fill();
    });
    ctx.globalAlpha = 1;
  }

  /* ── Mouse Interaction ── */
  document.addEventListener('mousemove', function (e) {
    var rect = canvas.getBoundingClientRect();
    targetMouseX = e.clientX - rect.left;
    targetMouseY = e.clientY - rect.top;
  });

  /* ── Main Render Loop ── */
  var lastTime = 0;

  function render(timestamp) {
    if (!isVisible) {
      animationId = requestAnimationFrame(render);
      return;
    }

    var deltaTime = timestamp - lastTime;
    lastTime = timestamp;
    time = timestamp * 0.001;

    /* Smooth mouse follow */
    mouseX += (targetMouseX - mouseX) * 0.03;
    mouseY += (targetMouseY - mouseY) * 0.03;

    /* Clear */
    ctx.clearRect(0, 0, width, height);

    /* Update systems */
    updateParticles(deltaTime);
    updateDataParticles(deltaTime);

    /* Get agent positions */
    var positions = CONFIG.agents.map(function (agent) {
      return getAgentPosition(agent, time);
    });

    /* Draw in order: particles -> connections -> core -> agents -> data particles */
    drawParticles();
    drawConnections(CONFIG.agents, positions, time);
    drawCore(time);

    /* Draw agents with staggered active states */
    CONFIG.agents.forEach(function (agent, i) {
      var isActive = Math.floor(time * 0.5) % 3 === i;
      drawAgent(agent, positions[i], time, isActive);

      /* Spawn data particles occasionally */
      if (isActive && Math.random() < 0.008) {
        var nextIdx = (i + 1) % CONFIG.agents.length;
        spawnDataParticle(agent, CONFIG.agents[nextIdx]);
      }
    });

    drawDataParticles();

    animationId = requestAnimationFrame(render);
  }

  /* ── Visibility Detection ── */
  var observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      isVisible = entry.isIntersecting;
      if (isVisible && !animationId) {
        lastTime = performance.now();
        render(lastTime);
      }
    });
  }, { threshold: 0.1, rootMargin: '100px' });

  observer.observe(canvas);

  /* ── Initialize ── */
  function init() {
    resize();
    initParticles();
    window.addEventListener('resize', resize);

    /* Start render loop */
    lastTime = performance.now();
    render(lastTime);
  }

  /* ── Cleanup on page unload ── */
  window.addEventListener('beforeunload', function () {
    if (animationId) cancelAnimationFrame(animationId);
    window.removeEventListener('resize', resize);
  });

  /* Run when DOM ready */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  /* ── Expose for debugging ── */
  window.Hero3D = {
    pause: function () { isVisible = false; },
    resume: function () { isVisible = true; },
    getConfig: function () { return CONFIG; }
  };

})();