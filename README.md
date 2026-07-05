# ⚡ PromithicAI

[![Version](https://img.shields.io/badge/version-v1.1-cyan.svg)](index.html)
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

The app features full code streaming, live sandboxed previews, theme toggles, and cloud-synced compilation history, making it both an educational workspace and a framework for AI agent developers.

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
*   **Hybrid Storage Boundaries:**
    Managing local history (up to 30 past builds containing full source code and prompts) in local storage pushes the limits of the browser's standard 5MB limit. To support multi-device access and persistent storage, we implemented a hybrid cloud sync strategy: local builds write immediately to local storage and queue up for asynchronous replication to Supabase when a user signs in.
*   **Grid Layouts without UI Libraries:**
    Structuring an IDE style interface (adjustable columns, sliding history drawers, terminal console logs, iframe previews, and modal popups) while maintaining a premium glassmorphic appearance required complex CSS variables and media query orchestration in `css/builder.css` and `css/components.css` without relying on Tailwind or Bootstrap.

---

## 📂 File Directory

```
PromithicAI/
├── index.html          # Marketing / Landing Page
├── builder.html        # Main IDE Console Workspace
├── settings.html       # API Configuration & Engine State
├── login.html          # Firebase Authentication
├── signup.html         # User Onboarding & Signup
├── vercel.json         # Vercel Clean URL Redirects
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
│   ├── fx.css          # Cursor spotlight, magnetic, and dynamic glows
│   └── polish.css      # v1.1 Micro-Interaction Polish (logo pulse, shimmers, active glows)
│
└── js/                 # Vanilla JS Logic Components
    ├── theme.js        # Light/Dark Mode Persistence
    ├── router.js       # Fade-In Client-Side Routing
    ├── firebase.js     # Firebase SDK Wrapper (Email/Password, Google OAuth)
    ├── supabase.js     # Supabase REST Client
    ├── auth.js         # Session Detection & Navbar Badge Render
    ├── editor.js       # Monaco Editor & Fallback API
    ├── streaming.js    # AI Token Output Simulation
    ├── history.js      # Hybrid Local/Supabase Persistence Sync
    ├── agent.js        # Multi-Agent Workflow Logic
    └── fx.js           # Intersection Observers & Mouse FX
```

---

## 🚀 Upgrades in v1.1 Release

- **Firebase Authentication Integration:** Integrated native authentication flows supporting traditional Email/Password credentials and Google OAuth Single-Sign-On (SSO) popup windows.
- **Supabase Cloud Sync DB:** Engineered a lightweight REST-based database synchronization protocol sending and loading builds directly using Supabase PostgreSQL databases, resolving the single-device 5MB local limits.
- **Visual Micro-Interaction Polish:** Created a comprehensive `polish.css` system including:
  - Gradient logo text transitions and pulsing glow mechanics on brand badges.
  - Non-intrusive sweeping light beams animating versioning stickers.
  - Interactive tactile key compression scales (`scale(0.97)`) on click/touch actions.
  - Staggered structural layout transitions for loaded sidebar history blocks.
  - Fluid error panel animations sliding down on authentication failure.
- **Brand Rebirth:** Cleaned all instances of "AI Web App Builder" and converted them to **PromithicAI**.

---

## 🔮 Upcoming Features (v1.2+)

| Version | Planned Feature | Status |
|:---|:---|:---|
| **v1.2** | Custom API Keys (Send queries directly using user key) | *Next Up* |
| **v2.0** | LangGraph Orchestration & Python FastAPI Backend | *Planned* |
| **v2.1** | MCP Sandboxed local execution capabilities | *Planned* |
| **v2.2** | Push to GitHub & deploy directly from the IDE | *Planned* |
| **v3.0** | Voice-to-App live streaming | *Planned* |



