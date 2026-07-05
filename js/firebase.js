/* ===================================================================
   FIREBASE.JS — Firebase Auth Wrapper
   PromithicAI v1.1
   =================================================================== */

(function () {
  'use strict';

  /* ── Firebase Configuration ──────────────────────────────────────── */
  var FIREBASE_CONFIG = {
    apiKey:            'AIzaSyAFRf6mO_EYk1f4J8LR6A0Crs8J8OGih7c',
    authDomain:        'promithicai-a1.firebaseapp.com',
    projectId:         'promithicai-a1',
    storageBucket:     'promithicai-a1.firebasestorage.app',
    messagingSenderId: '536621318388',
    appId:             '1:536621318388:web:c92f417c1d38de58c51ea1'
  };

  /* ── Initialize Firebase (guard against double-init) ─────────────── */
  if (!firebase.apps || !firebase.apps.length) {
    firebase.initializeApp(FIREBASE_CONFIG);
  }

  var auth = firebase.auth();

  /* ── Helper: map Firebase error codes to friendly messages ──────── */
  function friendlyError(code) {
    var map = {
      'auth/email-already-in-use':   'An account with this email already exists.',
      'auth/invalid-email':          'Please enter a valid email address.',
      'auth/weak-password':          'Password must be at least 6 characters.',
      'auth/user-not-found':         'No account found with this email.',
      'auth/wrong-password':         'Incorrect password. Please try again.',
      'auth/invalid-credential':     'Incorrect email or password.',
      'auth/too-many-requests':      'Too many attempts. Please wait a moment.',
      'auth/network-request-failed': 'Network error. Check your connection.',
      'auth/popup-closed-by-user':   'Google sign-in was cancelled.',
      'auth/popup-blocked':          'Popup was blocked. Please allow popups.',
    };
    return map[code] || 'An unexpected error occurred. Please try again.';
  }

  /* ── Public Auth API ─────────────────────────────────────────────── */
  var FirebaseAuth = {

    /**
     * Sign up a new user with email + password.
     * @param {string} email
     * @param {string} password
     * @param {string} [displayName]
     * @returns {Promise<firebase.auth.UserCredential>}
     */
    signUp: function (email, password, displayName) {
      return auth.createUserWithEmailAndPassword(email, password)
        .then(function (cred) {
          if (displayName) {
            return cred.user.updateProfile({ displayName: displayName.trim() })
              .then(function () { return cred; });
          }
          return cred;
        });
    },

    /**
     * Sign in an existing user with email + password.
     * @returns {Promise<firebase.auth.UserCredential>}
     */
    signIn: function (email, password) {
      return auth.signInWithEmailAndPassword(email, password);
    },

    /**
     * Open Google OAuth popup.
     * @returns {Promise<firebase.auth.UserCredential>}
     */
    signInWithGoogle: function () {
      var provider = new firebase.auth.GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      return auth.signInWithPopup(provider);
    },

    /**
     * Sign out the current user.
     * @returns {Promise<void>}
     */
    signOut: function () {
      return auth.signOut();
    },

    /**
     * Get the currently logged-in Firebase user (or null).
     * @returns {firebase.User|null}
     */
    getCurrentUser: function () {
      return auth.currentUser;
    },

    /**
     * Subscribe to auth state changes.
     * @param {function} callback  Called with (user | null)
     * @returns {function}  Unsubscribe function
     */
    onAuthStateChanged: function (callback) {
      return auth.onAuthStateChanged(callback);
    },

    /**
     * Translate Firebase error code to a user-friendly string.
     */
    getErrorMessage: friendlyError
  };

  window.FirebaseAuth = FirebaseAuth;

})();
