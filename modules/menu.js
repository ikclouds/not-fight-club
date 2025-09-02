// menu.js

/**
 * About: This module handles the navigation menu for the application.
 */


import { BURGER_WIDTH } from './config.js'
import { loginForm, showForm } from './ui-forms.js';
import { activeItemDisplay, closeGame } from './ui-fight.js'

// Export menu initialization function
export { initMenu };


/**
 * Burger menu
 */

// Burger menu elements
const burgerMenu = document.querySelector('.navigation__burger');
const menu = document.querySelector('.navigation__menu');
const overlay = document.querySelector('.page__overlay');
const menuLinks = document.querySelectorAll('.navigation__link');
const rulesForm = document.querySelector('.rules-form');

// Toggle burger menu
burgerMenu.addEventListener('click', function () {
  this.classList.toggle('navigation_burger_active');
  menu.classList.toggle('navigation_menu_active');
  overlay.classList.toggle('page_overlay_active');
});

// Close forms and menu
function closeForms() {
  burgerMenu.classList.remove('navigation_burger_active');
  menu.classList.remove('navigation_menu_active');
  overlay.classList.remove('page_overlay_active');

  // Also close any open forms when clicking overlay
  document.querySelectorAll('.form-container,.active').forEach(form => {
    form.classList.remove('active');
  });
}

// Close forms on window resize
function closeFormsOnResize() {
  if (window.innerWidth > BURGER_WIDTH) {
    closeForms();
  }
}

// Close menu when clicking outside
overlay.addEventListener('click', function () {
  closeForms();
});

// Close forms on window resize > 1440
window.onresize = closeFormsOnResize;

// Close forms on Escape key
window.addEventListener('keydown', function (event) {
  if (event.key === 'Escape') {
    closeForms();
  }
});

function initMenu() {
  // Smooth scrolling for menu items
  menuLinks.forEach(link => {
    link.addEventListener('click', function (e) {
      e.preventDefault();

      closeForms();

      // Update active menu item display
      const linkText = this.textContent;
      if (linkText !== 'Login' && linkText !== 'Logout' && linkText !== 'Rules') {
        activeItemDisplay.textContent = linkText;
        sessionStorage.setItem('nfcActiveMenuItem', linkText);
      }

      // Handle form links
      const targetId = this.getAttribute('href');
      if (targetId === '#login') {
        closeGame();
        showForm(loginForm, '.login-name');
        return;
      } else if (targetId === '#rules') {
        showForm(rulesForm);
        return;
      }
    });
  });
}
