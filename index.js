document.addEventListener('DOMContentLoaded', function() {
  // Burger menu
  const burgerWidth = 1440; // Width threshold for burger menu
  const burgerMenu = document.querySelector('.navigation__burger');
  const menu = document.querySelector('.navigation__menu');
  const overlay = document.querySelector('.page__overlay');
  const menuLinks = document.querySelectorAll('.navigation__link');
  const activeItemDisplay = document.querySelector('.navigation__active-item');
  const fightLink = document.querySelector('.fight-link');

  // Toggle burger menu
  burgerMenu.addEventListener('click', function() {
    this.classList.toggle('navigation_burger_active');
    menu.classList.toggle('navigation_menu_active');
    overlay.classList.toggle('page_overlay_active');
  });

  // Remove overlay
  function removeOverlay() {
    if (window.innerWidth > burgerWidth) {
      burgerMenu.classList.remove('navigation_burger_active');
      menu.classList.remove('navigation_menu_active');
      overlay.classList.remove('page_overlay_active');

      // Also close any open forms when clicking overlay
      document.querySelectorAll('.form-container').forEach(form => {
          form.classList.remove('active');
      });
    }
  }

  // Close menu when clicking outside
  overlay.addEventListener('click', function() {
    removeOverlay();
  });

  window.onresize = removeOverlay;

  // Smooth scrolling for menu items
  menuLinks.forEach(link => {
    link.addEventListener('click', function(e) {
        e.preventDefault();
        
        // Close the menu
        burgerMenu.classList.remove('navigation_burger_active');
        menu.classList.remove('navigation_menu_active');
        overlay.classList.remove('page_overlay_active');

        // Update active menu item display
        const linkText = this.textContent;
        if (linkText !== 'Login' && linkText !== 'Logout') {
            activeItemDisplay.textContent = linkText;
            sessionStorage.setItem('nftActiveMenuItem', linkText);
        }

        // Handle from links
        const targetId = this.getAttribute('href');
        if (targetId === '#login') {
            showForm(document.querySelector('.login-form'));
            return;
        }

    });
  });

  // Define helper functions before they're used

  function getCharacterNames() {
    return JSON.parse(localStorage.getItem('nfcCharacterNames')) || [];
  }

  function characterExists(name) {
    const names = getCharacterNames();
    return names.includes(name);
  }

  function getCharacterPasswords() {
      return JSON.parse(localStorage.getItem('nfcCharacterPasswords')) || {};
  }

  // Form functionality

  const closeBtns = document.querySelectorAll('.form__close');

  // Close form buttons
  closeBtns.forEach(btn => {
      btn.addEventListener('click', function() {
          const form = this.closest('.form_container');
          form.classList.remove('active');
      });
  });

  const loginForm = document.querySelector('.login-form');

  // Show form helper
  function showForm(form) {
    // Hide all form first
    document.querySelectorAll('.form-container').forEach(f => {
      f.classList.remove('active');
    });

    // SHow the selected form
    form.classList.add('active');
  }

  // Login functionality

  function checkPassword(name, password) {
    const passwords = getCharacterPasswords();
    return passwords[name] === password;
  }

  const loginButton = document.querySelector('.login-button');
  const loginMessage = document.querySelector('.login-message');
  
  loginButton.addEventListener('click', function() {
    const name = document.getElementById('login-name').value.trim();
    const password = document.getElementById('login-password').value;
    
    if (!name || !password) {
      loginMessage.textContent = 'Please enter both name and password';
      return;
    }
    
    if (!characterExists(name)) {
      loginMessage.textContent = 'Character does not exist';
      setTimeout(() => {
        // showForm(createForm);
        document.getElementById('create-name').value = name;
      }, 1000);
      return;
    }
    
    if (!checkPassword(name, password)) {
      loginMessage.textContent = 'Incorrect password';
      return;
    }
    
    // Login successful
    loginMessage.textContent = '';
    loginForm.classList.remove('active');
    
    // Update UI for logged in state
    document.querySelector('.login-link').textContent = 'Logout';
    document.querySelector('.fight-link').classList.remove('hidden');
    document.querySelector('.settings-link').classList.remove('hidden');
    
    // Store current user
    sessionStorage.setItem('nfcCurrentCharacter', name);
  });

});