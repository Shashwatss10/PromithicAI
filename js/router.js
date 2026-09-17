/* ===================================================================
   ROUTER.JS — Navigation Helper & Link State Manager
   PromithicAI v1.2
   =================================================================== */

(function () {
  'use strict';

  /**
   * Get current page slug from pathname
   * e.g. '/builder' -> 'builder', '/' -> 'index', '/settings' -> 'settings'
   */
  function getCurrentPage() {
    var path = window.location.pathname;
    var page = path.split('/').filter(Boolean)[0] || 'index';
    return page;
  }

  /**
   * Automatically sets active class on navigation links matching the current page
   */
  function updateActiveNavLinks() {
    var currentPage = getCurrentPage();

    var links = document.querySelectorAll('.navbar-nav .nav-link, .mobile-nav .nav-link');
    links.forEach(function (link) {
      var href = link.getAttribute('href');
      if (!href) return;

      // Handle anchor links (same-page navigation)
      if (href.startsWith('#')) {
        if (currentPage === 'index') {
          // On landing page - smooth scroll to section
          link.addEventListener('click', function(e) {
            var target = document.querySelector(href);
            if (target) {
              e.preventDefault();
              target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
          });
        } else {
          // On other pages - rewrite to point to landing page
          link.setAttribute('href', '/' + href);
        }
        return;
      }

      // Handle cross-page links - extract page from href
      // e.g. '/builder' -> 'builder', '/settings' -> 'settings'
      var linkPage = href.split('/').filter(Boolean)[0] || 'index';
      if (linkPage === currentPage) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });
  }

  // Initialize on DOM ready - only update active states, don't intercept navigation
  document.addEventListener('DOMContentLoaded', function () {
    updateActiveNavLinks();
  });

  window.AppRouter = {
    updateActiveNavLinks: updateActiveNavLinks
  };
})();