document.addEventListener('DOMContentLoaded', function() {
  // Form defaults
  const formCloseTimeout = 1000;
  // Burger menu
  const burgerWidth = 1440; // Width threshold for burger menu
  const burgerMenu = document.querySelector('.navigation__burger');
  const menu = document.querySelector('.navigation__menu');
  const overlay = document.querySelector('.page__overlay');
  const menuLinks = document.querySelectorAll('.navigation__link');
  const activeItemDisplay = document.querySelector('.navigation__active-item');
  const fightLink = document.querySelector('.fight-link');

  checkLoginState();

  // Toggle burger menu
  burgerMenu.addEventListener('click', function() {
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
    document.querySelectorAll('.form-container').forEach(form => {
        form.classList.remove('active');
    });
  }

  function closeFormsOnResize() {
    if (window.innerWidth > burgerWidth) {
      closeForms();
    }
  }

  // Close menu when clicking outside
  overlay.addEventListener('click', function() {
    closeForms();
  });

  window.onresize = closeFormsOnResize;

  // Smooth scrolling for menu items
  menuLinks.forEach(link => {
    link.addEventListener('click', function(e) {
        e.preventDefault();
        
        // Close the menu
        closeForms();

        // Update active menu item display
        const linkText = this.textContent;
        if (linkText !== 'Login' && linkText !== 'Logout') {
            activeItemDisplay.textContent = linkText;
            sessionStorage.setItem('nfcActiveMenuItem', linkText);
        }

        // Handle from links
        const targetId = this.getAttribute('href');
        if (targetId === '#login') {
            showForm(document.querySelector('.login-form'), '.login-name');
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

  function getCharacterAvatars() {
    return JSON.parse(localStorage.getItem('nfcCharacterAvatars')) || {};
  }

  function getCharacterScores() {
    return JSON.parse(localStorage.getItem('notFightClubCharacterScore')) || {};
  }

  // Check login state on page load
  function checkLoginState() {
    const currentCharacter = sessionStorage.getItem('nfcCurrentCharacter');
    if (currentCharacter) {
      // User is logged in
      document.querySelector('.login-link').textContent = 'Logout';
      document.querySelector('.fight-link').classList.remove('hidden');
      document.querySelector('.score-link').classList.remove('hidden');
      document.querySelector('.settings-link').classList.remove('hidden');
      
      // Set default active menu item to Fight for logged in users
      if (!sessionStorage.getItem('nfcActiveMenuItem')) {
        activeItemDisplay.textContent = 'Fight';
        sessionStorage.setItem('nfcActiveMenuItem', 'Fight');
      }
    } else {
      // User is not logged in
      document.querySelector('.login-link').textContent = 'Login';
      document.querySelector('.fight-link').classList.add('hidden');
      document.querySelector('.score-link').classList.add('hidden');
      document.querySelector('.settings-link').classList.add('hidden');
      
      // Default to Login for logged out users
      activeItemDisplay.textContent = 'Fight';
      sessionStorage.removeItem('nfcActiveMenuItem');
    }
    
    // Restore active menu item from session if available
    const activeMenuItem = sessionStorage.getItem('nfcActiveMenuItem');
    if (activeMenuItem) {
      activeItemDisplay.textContent = activeMenuItem;
    }
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

  // Show form helper
  function showForm(form, focus) {
    // Hide all form first
    document.querySelectorAll('form_container,.active').forEach(f => {
      f.classList.remove('active');
    });

    // Show the selected form
    form.classList.add('active');
    if (focus) {
      form.querySelector(focus).focus();
      // form.querySelector('.form__input').focus();
    }

  }

  // Login functionality

  const loginForm = document.querySelector('.login-form');
  const loginButton = document.querySelector('.login-button');
  const loginMessage = document.querySelector('.login-message');
  
  // Create character link
  document.querySelector('.create-character-link').addEventListener('click', function(e) {
      e.preventDefault();
      document.querySelector('.create-name').value = document.querySelector('.login-name').value;
      document.querySelector('.create-password').value = document.querySelector('.login-password').value;
      showForm(createForm, '.create-name');
  });

  loginButton.addEventListener('click', function() {
    function checkPassword(name, password) {
      const passwords = getCharacterPasswords();
      return passwords[name] === password;
    }

    const name = document.querySelector('.login-name').value.trim();
    const password = document.querySelector('.login-password').value;

    if (!name || !password) {
      loginMessage.textContent = 'Please enter both name and password';
      return;
    }
    
    if (!characterExists(name)) {
      loginMessage.textContent = 'Character does not exist';
      setTimeout(() => {
        showForm(createForm);
        document.getElementById('create-name').value = name;
      }, formCloseTimeout);
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
    document.querySelector('.score-link').classList.remove('hidden');
    document.querySelector('.settings-link').classList.remove('hidden');
    
    // Store current user
    sessionStorage.setItem('nfcCurrentCharacter', name);
    activeItemDisplay.textContent = 'Login';
  });

  // Create character functionality
  const createForm = document.querySelector('.create-form');
  const createButton = document.querySelector('.create-button');
  const createMessage = document.querySelector('.create-message');
  
  createButton.addEventListener('click', function() {
    function addCharacter(name, password) {
      const names = getCharacterNames();
      const passwords = getCharacterPasswords();
      const avatars = getCharacterAvatars();
      
      names.push(name);
      passwords[name] = password;
      avatars[name] = 'default.png'; // Default avatar
      
      localStorage.setItem('nfcCharacterNames', JSON.stringify(names));
      localStorage.setItem('nfcCharacterPasswords', JSON.stringify(passwords));
      localStorage.setItem('nfcCharacterAvatars', JSON.stringify(avatars));
    }

    const name = document.querySelector('.create-name').value.trim();
    const password = document.querySelector('.create-password').value;
    const repeatPassword = document.querySelector('.create-repeat-password').value;

    if (!name || !password || !repeatPassword) {
      createMessage.textContent = 'Please fill all fields';
      return;
    }
    
    if (password !== repeatPassword) {
      createMessage.textContent = 'Passwords do not match';
      return;
    }
    
    if (characterExists(name)) {
      createMessage.textContent = 'Character already exists';
      return;
    }
    
    // Create character
    addCharacter(name, password);
    createMessage.textContent = 'Character created successfully';
    
    // Clear form and show login form
    setTimeout(() => {
      createMessage.textContent = '';
      showForm(loginForm, '.login-name');
    }, formCloseTimeout);
  });

  // Handle login/logout link
  document.querySelector('.login-link').addEventListener('click', function(e) {
      e.preventDefault();
      
      const currentCharacter = sessionStorage.getItem('nfcCurrentCharacter');
      if (currentCharacter) {
        sessionStorage.removeItem('nfcCurrentCharacter');
        sessionStorage.removeItem('nfcActiveMenuItem');
      } else {
        showForm(loginForm, '.login-name');
      }
      checkLoginState();
  });

  // Settings functionality

  const settingsForm = document.querySelector('.settings-form');

  document.querySelector('.settings-link').addEventListener('click', function(e) {
    e.preventDefault();
    showForm(settingsForm, '.form__close');
  });

  // Score functionality

  const scoreForm = document.querySelector('.score-form');

  document.querySelector('.score-link').addEventListener('click', function(e) {
    // Function to populate the score form with character data
    function populateScoreForm(characterName) {
      // Set character name
      document.querySelector('.score-character-name').textContent = characterName;
      
      // Set character avatar
      const avatars = getCharacterAvatars();
      const characterAvatar = avatars[characterName] || 'default.png';
      document.querySelector('.avatar-image').src = `./assets/img/avatars/${characterAvatar}`;
      
      // Set character score
      const scores = getCharacterScores();
      const characterScore = scores[characterName] || { Win: '0', Loss: '0' };
      
      document.querySelector('.score-wins').textContent = characterScore.Win;
      document.querySelector('.score-losses').textContent = characterScore.Loss;
    }
    
    e.preventDefault();
    
    const currentCharacter = sessionStorage.getItem('nfcCurrentCharacter');

    // Populate score form with character data
    populateScoreForm(currentCharacter);
    
    showForm(scoreForm, '.form__close');
  });

});
