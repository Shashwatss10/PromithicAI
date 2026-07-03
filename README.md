# ⚡ PromithicAI

[![Version](https://img.shields.io/badge/version-v1.0-cyan.svg)](index.html)
[![License](https://img.shields.io/badge/license-MIT-purple.svg)](LICENSE)
[![Vanilla_JS](https://img.shields.io/badge/Vanilla_JS-JS-yellow.svg)](index.html)
[![CSS3](https://img.shields.io/badge/CSS3-3-blue.svg)](index.html)
[![HTML5](https://img.shields.io/badge/HTML5-5-orange.svg)](index.html)


An interactive, premium web console simulating a **Multi-Agent AI Pipeline** that transforms natural language prompts into working, single-page web applications. Drawing inspiration from industry leaders like *Lovable.dev*, *Emergent*, and *v0.dev*, this codebase presents a client-side environment for orchestrating code planning, compilation, verification, and sandboxed execution.

---

##  🚀 Live Demo

🔗 [Try PromithicAI](https://shashwatss10.github.io/PromithicAI/) 

---

## Preview

___UPCOMING___

---

## 📖 About the Project

**PromithicAI** is a serverless, front-end-heavy development console. When a user input is received (e.g., *"Build me a Pomodoro timer"*), the system initiates a structured multi-agent loop:

```
[User Prompt] ──> 👤 Planner Agent ──> 👤 Coder Agent ──> 👤 Reviewer Agent ──> 🖥️ Sandbox Preview
```

The app features full code streaming, live sandboxed previews, theme toggles, and localized compilation history, making it both an educational workspace and a framework for AI agent developers.

---

## 🎯 What it Solves

1. **High-Fidelity AI Orchestration Visualization:** It demonstrates how complex multi-agent pipelines (Planner → Coder → Reviewer) communicate state and hand off tasks asynchronously.
2. **Zero-Setup Prototyping:** Allows developers and designers to test interactive widget layouts instantly, completely inside the browser.
3. **No-Dependency Code Editing:** Integrates the full VS Code Monaco editor directly via CDN, offering instant linting and syntax highlighting without massive `node_modules` configurations.
4. **Immediate Exportability:** Renders applications into sandboxed previews, providing single-click options to copy the clean HTML or download a production-ready `.html` file that runs offline.

---

## 🛠️ Technical Challenges & Problems Faced

Building a stateful agent system purely on the client-side using Vanilla JavaScript brought several complex implementation challenges:

*   **Concurrency & Stream Cancellation:**
    Handling stateful, asynchronous streaming loops inside the single-thread model of a browser meant that if a user canceled a build or submitted a new prompt mid-generation, overlapping text streams could corrupt the editor model. This was solved in `js/streaming.js` and `js/agent.js` by implementing cancelable promise wrappers and an explicit external abort polling system (`getAbort()`).
*   **Resilient Monaco CDN Integration:**
    Embedding a heavyweight code editor requires robust script loading. If the CDN load of Monaco fails (e.g., offline usage or blocked domains), the app's core feature breaks. To address this, `js/editor.js` implements a self-healing fallback mechanism that automatically constructs a lightweight, customized `textarea` replicating Monaco's editor interfaces (`getValue`, `setValue`, `appendCode`) to ensure zero-downtime operation.
*   **Secure Sandboxing of Generated Code:**
    Injecting arbitrary JavaScript and CSS from AI outputs into the parent page's DOM would corrupt global styles, leak local storage credentials, and trigger cross-site scripting conflicts. To ensure safe execution, generated apps are dynamically injected via the `srcdoc` property of an `<iframe>` configured with a strict `sandbox="allow-scripts"` directive, thereby completely isolating the generated workspace.
*   **Storage Boundaries:**
    Managing local history (up to 30 past builds containing full source code and prompts) in local storage pushes the limits of the browser's standard 5MB limit. Compact JSON serialization rules and try-catch storage managers in `js/history.js` were created to prevent site crashes and handle storage quota exceptions gracefully.
*   **Grid Layouts without UI Libraries:**
    Structuring an IDE style interface (adjustable columns, sliding history drawers, terminal console logs, iframe previews, and modal popups) while maintaining a premium glassmorphic appearance required complex CSS variables and media query orchestration in `css/builder.css` and `css/components.css` without relying on Tailwind or Bootstrap.

---

## 📂 File Directory

```
PromithicAI/
├── index.html          # Marketing / Landing Page
├── builder.html        # Main IDE Console Workspace
├── settings.html       # API Configuration & Engine State
├── login.html          # Mock Auth & Sandbox Features
├── signup.html         # Mock Onboarding
├── README.md           # Project Specification
├── LICENSE             # MIT License
├── .gitignore          # Version Control Filters
│
├── css/                # Styling Architecture
│   ├── base.css
│   ├── variables.css   # Global Theme & Color Tokens
│   ├── animations.css  # Core Layout Transitions
│   ├── components.css
│   ├── landing.css
│   ├── auth.css
│   ├── settings.css
│   ├── builder.css
│   ├── brand-story.css # PromithicAI Brand Segment Styling
│   └── fx.css          # v1.0 Polish: Dynamic Glows, Ripples, Magnetics
│
└── js/                 # Vanilla JS Logic Components
    ├── theme.js        # Light/Dark Mode Persistence
    ├── router.js       # Fade-In Client-Side Routing
    ├── auth.js         # LocalStorage Session Management
    ├── editor.js       # Monaco Editor & Fallback API
    ├── streaming.js    # AI Token Output Simulation
    ├── history.js      # App LocalStorage Persistence
    ├── agent.js        # Multi-Agent Workflow Logic
    └── fx.js           # Intersection Observers & Mouse FX
```

---

## 🚀 Upgrades in v1.0 Polish

- **Brand Rebirth:** Refactored entire project structure from "AI Web App Builder" to **PromithicAI** — representing professional, prompt-driven creation.
- **FX Animation Engine:** Integrated `fx.js` and `fx.css` to add ultra-premium hover effects, click ripples, cursor spotlight trailing, magnetic buttons, and staggered scroll reveals without affecting core app logic.
- **Brand Story Section:** Added a highly styled breakdown of the PromithicAI name meaning to the landing page.
- **Robust Storage Auth:** Added `auth.js` to simulate a fully working session state across all pages.
- **UX Hardening:** Added layout fixes for auth pages, validation shakes on empty inputs, and resolved history state-saving bugs during continuous generation loops.

---

## 🔮 Upcoming Features (v2.0+)

| Version | Planned Feature | Status |
|:---|:---|:---|
| **v1.1** | Drag & Drop Component Library | *In Progress* |
| **v1.5** | Real API Integration (OpenAI/Claude) | *Planned* |
| **v2.0** | Image to App (Vision capabilities) | *Planned* |
| **v2.2** | GitHub Sync & Vercel Deployments | *Planned* |


