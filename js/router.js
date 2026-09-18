/* ===================================================================
   ROUTER.JS — Navigation Helper & Link State Manager
   PromithicAI v2.0 — Dual Environment Universal Router
   Supports Vercel Clean URLs & Local Live Server / File environments
   =================================================================== */

(function () {
  "use strict";

  var isLocalDev =
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1" ||
    window.location.protocol === "file:";

  var ROUTE_MAP = {
    "/": "index.html",
    "/builder": "builder.html",
    "/settings": "settings.html",
    "/login": "login.html",
    "/signup": "signup.html",
  };

  /**
   * Get current page slug from pathname
   * e.g. '/builder' or 'builder.html' -> 'builder'
   */
  function getCurrentPage() {
    var path = window.location.pathname;
    var filename = path.split("/").filter(Boolean).pop() || "index";
    return filename.replace(".html", "");
  }

  /**
   * Determine the current directory base path
   * On Vercel: ""
   * On Live Server in subfolder: "/Projects/PromithicAI/"
   */
  function getBasePath() {
    if (!isLocalDev) return "";
    var pathname = window.location.pathname;
    var lastSlashIndex = pathname.lastIndexOf("/");
    if (lastSlashIndex >= 0) {
      return pathname.substring(0, lastSlashIndex + 1);
    }
    return "";
  }

  /**
   * Resolves a target path based on local dev vs Vercel environment
   */
  function resolveTarget(href) {
    if (!href) return href;
    var cleanHref = href.split("?")[0].split("#")[0];
    if (isLocalDev && ROUTE_MAP[cleanHref]) {
      var suffix = href.slice(cleanHref.length);
      var basePath = getBasePath();
      return basePath + ROUTE_MAP[cleanHref] + suffix;
    }
    return href;
  }

  /**
   * Automatically sets active class on navigation links matching the current page
   * and intercepts link clicks to prevent local 404 "Cannot GET" errors
   */
  function setupNavigation() {
    var currentPage = getCurrentPage();

    // 1. Process all links across navbar, mobile nav, buttons, and footer
    var links = document.querySelectorAll("a[href]");
    links.forEach(function (link) {
      var href = link.getAttribute("href");
      if (!href) return;

      // Ignore external or protocol links
      if (
        href.startsWith("http://") ||
        href.startsWith("https://") ||
        href.startsWith("mailto:") ||
        href.startsWith("javascript:")
      ) {
        return;
      }

      // Handle placeholder links (#)
      if (href === "#") {
        link.addEventListener("click", function (e) {
          e.preventDefault();
        });
        return;
      }

      // Handle in-page anchor links (#features, #pipeline, etc.)
      if (href.startsWith("#")) {
        if (currentPage === "index") {
          link.addEventListener("click", function (e) {
            var target = document.querySelector(href);
            if (target) {
              e.preventDefault();
              target.scrollIntoView({ behavior: "smooth", block: "start" });
            }
          });
        } else {
          // On non-index pages, redirect to landing page anchor
          link.addEventListener("click", function (e) {
            e.preventDefault();
            var targetHome = isLocalDev ? getBasePath() + "index.html" : "/";
            window.location.href = targetHome + href;
          });
        }
        return;
      }

      // Handle routing links (/builder, /settings, /login, /signup, etc.)
      var targetClean = href.split("?")[0].split("#")[0];
      var linkSlug =
        targetClean.replace("/", "").replace(".html", "") || "index";

      if (linkSlug === currentPage) {
        link.classList.add("active");
      }

      // If running locally, intercept click to route to .html counterpart smoothly
      if (isLocalDev && ROUTE_MAP[targetClean]) {
        link.addEventListener("click", function (e) {
          e.preventDefault();
          var resolved = resolveTarget(href);
          window.location.href = resolved;
        });
      }
    });
  }

  // Initialize on DOM ready
  document.addEventListener("DOMContentLoaded", function () {
    setupNavigation();
  });

  window.AppRouter = {
    getCurrentPage: getCurrentPage,
    resolveTarget: resolveTarget,
    setupNavigation: setupNavigation,
  };
})();
