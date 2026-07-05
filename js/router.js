/* ===================================================================
   ROUTER.JS — Navigation Helper & Link State Manager
   PromithicAI v1.1
   =================================================================== */

(function () {
  'use strict';

  /**
   * Automatically sets active class on navigation links matching the current file
   */
  function updateActiveNavLinks() {
    var path = window.location.pathname;
    var page = path.split('/').pop() || 'index.html';

    var links = document.querySelectorAll('.navbar-nav .nav-link, .mobile-nav .nav-link');
    links.forEach(function (link) {
      var href = link.getAttribute('href');
      if (!href) return;

      // Check if href starts with '#' for page anchor links
      if (href.startsWith('#')) {
        if (page === 'index.html' || page === '') {
          // Keep normal anchor functionality
          link.addEventListener('click', function(e) {
            var target = document.querySelector(href);
            if (target) {
              e.preventDefault();
              target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
          });
        } else {
          // If on another page, rewrite anchor to point to index.html
          link.setAttribute('href', 'index.html' + href);
        }
      } else {
        // Direct page link comparison
        var linkPage = href.split('/').pop();
        if (linkPage === page) {
          link.classList.add('active');
        } else {
          link.classList.remove('active');
        }
      }
    });
  }

  /**
   * Helper to perform page transitions with a smooth fade
   * @param {string} url - URL to navigate to
   */
  function navigateTo(url) {
    var wrapper = document.querySelector('.page-wrapper, .builder-layout, .auth-page');
    if (wrapper) {
      wrapper.style.transition = 'opacity 0.25s ease';
      wrapper.style.opacity = '0';
      setTimeout(function () {
        window.location.href = url;
      }, 250);
    } else {
      window.location.href = url;
    }
  }

  // Hook dynamic click actions for smoother transition feel
  document.addEventListener('DOMContentLoaded', function () {
    updateActiveNavLinks();

    // Catch generic direct page navigations to animate them smoothly
    document.querySelectorAll('a[href]:not([href^="#"]):not([href^="mailto:"]):not([href^="tel:"]):not([target="_blank"])').forEach(function (link) {
      link.addEventListener('click', function (e) {
        var href = link.getAttribute('href');
        // Ignore javascript void calls or empty links
        if (href && href !== '#' && !href.startsWith('javascript:')) {
          e.preventDefault();
          navigateTo(href);
        }
      });
    });
  });

  window.AppRouter = {
    updateActiveNavLinks: updateActiveNavLinks,
    navigateTo: navigateTo
  };
})();
