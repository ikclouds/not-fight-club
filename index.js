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

  // Initialize the application
  initLocalStorage();
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
    document.querySelectorAll('.form-container,.active').forEach(form => {
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

  // Close forms on window resize > 1440
  window.onresize = closeFormsOnResize;

  // Close forms on Escape key
  window.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        closeForms();
    }
  });

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

  // Define helper functions

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
    return JSON.parse(localStorage.getItem('nfcCharacterScore')) || {};
  }

  function getCharacterAvatars() {
    return JSON.parse(localStorage.getItem('nfcCharacterAvatars')) || {};
  }

  function setSelectedAvatar(avatar) {
    localStorage.setItem('nfcClubSelectedAvatar', avatar);
  }

  function updateCharacterAvatar(name, avatar) {
    const avatars = getCharacterAvatars();
    avatars[name] = avatar;
    localStorage.setItem('nfcCharacterAvatars', JSON.stringify(avatars));
  }

  function getEnemies() {
    const enemies = JSON.parse(localStorage.getItem('nfcEnemies')) || {};
    console.log('Loaded enemies:', enemies); // Debug line
    return enemies;
  }
  
  function getSelectedEnemyName() {
    return localStorage.getItem('nfcSelectedEnemyName') || 'Spacemarine';
  }
  
  function getSelectedEnemyHP() {
    // return localStorage.getItem('nfcSelectedEnemyHP') || '30';
    return localStorage.getItem('nfcSelectedEnemyHP');
  }
  
  function setSelectedEnemy(name, hp) {
    localStorage.setItem('nfcSelectedEnemyName', name);
    localStorage.setItem('nfcSelectedEnemyHP', hp.toString());
  }

  // Init Local Storage
  function initLocalStorage() {
    if (!localStorage.getItem('nfcCharacterNames')) {
        localStorage.setItem('nfcCharacterNames', JSON.stringify([]));
    }
    
    if (!localStorage.getItem('nfcCharacterPasswords')) {
        localStorage.setItem('nfcCharacterPasswords', JSON.stringify({}));
    }
    
    // Initialize new storage items
    if (!localStorage.getItem('nfcCharacterAvatars')) {
        localStorage.setItem('nfcCharacterAvatars', JSON.stringify({}));
    }
    
    if (!localStorage.getItem('nfcSelectedAvatar')) {
        localStorage.setItem('nfcSelectedAvatar', 'default.png');
    }
    
    // Initialize enemy storage items
    if (!localStorage.getItem('nfcEnemies')) {
        const enemies = {
            'Spacemarine': 170,
            'Snowtroll': 150,
            'Spider': 120
        };
        localStorage.setItem('nfcEnemies', JSON.stringify(enemies));
    }
    
    if (!localStorage.getItem('nfcSelectedEnemyName')) {
        localStorage.setItem('nfcSelectedEnemyName', 'Spacemarine');
    }
    
    if (!localStorage.getItem('nfcSelectedEnemyHP')) {
        localStorage.setItem('nfcSelectedEnemyHP', '170');
    }
    
    // Initialize HP level storage items
    if (!localStorage.getItem('nfcCharacterHP')) {
        localStorage.setItem('nfcCharacterHP', '150');
    }
    
    if (!localStorage.getItem('nfcEnemyHP')) {
        localStorage.setItem('nfcEnemyHP', '170');
    }
    
    // Initialize character score storage
    if (!localStorage.getItem('nfcCharacterScore')) {
        localStorage.setItem('nfcCharacterScore', JSON.stringify({}));
    }
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

  // Character settings functionality

  const characterForm = document.querySelector('.character-form');

  function autoFillCharacterSettings() {
    const currentCharacter = sessionStorage.getItem('nfcCurrentCharacter');
    if (currentCharacter) {
      // Populate character form with current user data
      // document.getElementById('character-name').value = currentCharacter;
      document.querySelector('.edit-character-name').value = currentCharacter;
      
      // Get password and pre-fill password fields with asterisks if exists
      const passwords = getCharacterPasswords();
      const currentPassword = passwords[currentCharacter];
      
      if (currentPassword) {
          const maskedPassword = '*'.repeat(currentPassword.length);
          // document.getElementById('character-password').value = maskedPassword;
          document.querySelector('.edit-character-password').value = maskedPassword;
          document.querySelector('.edit-character-repeat-password').value = maskedPassword;

          // Store original password in a data attribute for later use
          document.querySelector('.edit-character-password').dataset.originalPassword = currentPassword;
      } else {
          document.querySelector('.edit-character-password').value = '';
          document.querySelector('.edit-character-repeat-password').value = '';
          delete document.querySelector('.edit-character-password').dataset.originalPassword;
      }
      
      // Set avatar image
      const avatars = getCharacterAvatars();
      const characterAvatar = avatars[currentCharacter] || 'default.png';
      document.getElementById('character-avatar').src = `./assets/img/avatars/${characterAvatar}`;
    }
  }

  document.querySelector('.edit-character-button').addEventListener('click', function() {
    autoFillCharacterSettings();
    showForm(characterForm, '.edit-character-name');
  });

  document.querySelector('.avatar-edit-button').addEventListener('click', function() {
    loadAvatars();
    showForm(avatarsForm);
  });

  function updateCharacter(oldName, newName, newPassword) {
        const names = getCharacterNames();
        const passwords = getCharacterPasswords();
        const avatars = getCharacterAvatars();
        
        // Update name if changed
        if (oldName !== newName) {
            const index = names.indexOf(oldName);
            if (index !== -1) {
                names[index] = newName;
            }
            
            // Update password and avatar entries with new name
            passwords[newName] = newPassword;
            avatars[newName] = avatars[oldName] || 'default.png';
            
            delete passwords[oldName];
            delete avatars[oldName];
        } else {
            // Just update password
            passwords[oldName] = newPassword;
        }

        localStorage.setItem('nfcCharacterNames', JSON.stringify(names));
        localStorage.setItem('nfcCharacterPasswords', JSON.stringify(passwords));
        localStorage.setItem('nfcCharacterAvatars', JSON.stringify(avatars));
    }

  document.querySelector('.character-save-button').addEventListener('click', function() {
      const currentCharacter = sessionStorage.getItem('nfcCurrentCharacter');
      const newName = document.querySelector('.edit-character-name').value.trim();
      const passwordField = document.querySelector('.edit-character-password');
      const repeatPasswordField = document.querySelector('.edit-character-repeat-password');
      const password = passwordField.value;
      const repeatPassword = repeatPasswordField.value;
      const characterMessage = document.querySelector('.character-message');
      
      if (!newName || !password || !repeatPassword) {
          characterMessage.textContent = 'Please fill all fields';
          return;
      }
      
      if (password !== repeatPassword) {
          characterMessage.textContent = 'Passwords do not match';
          return;
      }
      
      if (newName !== currentCharacter && characterExists(newName)) {
          characterMessage.textContent = 'Character name already taken';
          return;
      }
      
      // Determine which password to use
      let passwordToSave;
      const originalPassword = passwordField.dataset.originalPassword;
      
      // If both password fields are filled with asterisks and same length as original,
      // use the original password, otherwise use the new one
      if (originalPassword && 
          password === '*'.repeat(originalPassword.length) && 
          repeatPassword === '*'.repeat(originalPassword.length)) {
          passwordToSave = originalPassword;
      } else {
          passwordToSave = password;
      }
      
      // Update character
      updateCharacter(currentCharacter, newName, passwordToSave);
      characterMessage.textContent = 'Character updated successfully';
      
      // Update current character in session storage
      sessionStorage.setItem('nfcCurrentCharacter', newName);
      
      // Clear form fields
      setTimeout(() => {
          passwordField.value = '';
          repeatPasswordField.value = '';
          delete passwordField.dataset.originalPassword;
          characterMessage.textContent = '';
          characterForm.classList.remove('active');
      }, formCloseTimeout);
  });

  // Select avatar

  const avatarsForm = document.querySelector('.avatars-form');

  document.querySelector('.select-avatar-button').addEventListener('click', function() {
    loadAvatars();
    showForm(avatarsForm);
  });

  function selectAvatar(avatar) {
    const currentCharacter = sessionStorage.getItem('nfcCurrentCharacter');

    if (currentCharacter) {
      // Update avatar in local storage
      updateCharacterAvatar(currentCharacter, avatar);
      
      // Set as selected avatar
      setSelectedAvatar(avatar);
      
      // Update avatar in character form
      document.getElementById('character-avatar').src = `./assets/img/avatars/${avatar}`;
      
      // Close the avatars form
      avatarsForm.classList.remove('active');
      
      // If we came from settings, show character form
      if (!characterForm.classList.contains('active')) {
          autoFillCharacterSettings();
          showForm(characterForm);
      }
    }
  }

  function loadAvatars() {
    const avatarsGrid = document.querySelector('.avatars-grid');
    avatarsGrid.innerHTML = '';
    
    // Sample avatar filenames - in a real app, these would be loaded from the server
    const avatarFiles = [
        'avatar1.png',
        'avatar2.png',
        'avatar3.png',
        'avatar4.png'
    ];
    
    avatarFiles.forEach(file => {
      const avatarOption = document.createElement('div');
      avatarOption.className = 'avatar-option';
      
      const img = document.createElement('img');
      img.src = `./assets/img/avatars/${file}`;
      img.alt = 'Avatar Option';
      img.className = 'avatar-option-image';
      
      const selectButton = document.createElement('button');
      selectButton.className = 'avatar-select-button';
      selectButton.innerHTML = `<img src="./assets/svg/check.svg" alt="Select" class="check-icon">`;
      
      selectButton.addEventListener('click', function() {
        selectAvatar(file);
      });
      
      avatarOption.appendChild(img);
      avatarOption.appendChild(selectButton);
      avatarsGrid.appendChild(avatarOption);
    });
  }

  function selectAvatar(avatar) {
    const currentCharacter = sessionStorage.getItem('nfcCurrentCharacter');
    
    if (currentCharacter) {
      // Update avatar in local storage
      updateCharacterAvatar(currentCharacter, avatar);
      
      // Set as selected avatar
      setSelectedAvatar(avatar);
      
      // Update avatar in character form
      document.getElementById('character-avatar').src = `./assets/img/avatars/${avatar}`;
      
      // Close the avatars form
      avatarsForm.classList.remove('active');
      
      // If we came from settings, show character form
      if (!characterForm.classList.contains('active')) {
        autoFillCharacterSettings();
        showForm(characterForm, '.edit-character-name');
      }
    }
  }

  // Select Enemy

  function loadEnemies() {
    console.log('Loading enemies...');
    const enemiesGrid = document.querySelector('.enemies-grid');
    if (!enemiesGrid) {
      console.error('Enemies grid not found in the DOM');
      return;
    }
    
    enemiesGrid.innerHTML = '';
    
    try {
      const enemies = getEnemies();
      const selectedEnemyName = getSelectedEnemyName();
      
      // Create enemy cards
      Object.entries(enemies).forEach(([name, hp]) => {
        const enemyCard = document.createElement('div');
        enemyCard.className = 'enemy-card';
        if (name === selectedEnemyName) {
            enemyCard.classList.add('selected');
        }
        
        const enemyName = document.createElement('div');
        enemyName.className = 'enemy-name';
        enemyName.textContent = name;
        
        const imageContainer = document.createElement('div');
        imageContainer.className = 'fight-image-container';
        
        const img = document.createElement('img');
        img.src = `./assets/img/enemy/${name.toLowerCase().replace(' ', '_')}.png`;
        img.alt = name;
        img.className = 'enemy-image';
        
        const selectButton = document.createElement('button');
        selectButton.className = 'enemy-select-button';
        selectButton.innerHTML = `<img src="./assets/svg/check.svg" alt="Select" class="check-icon">`;
        
        const enemyHP = document.createElement('div');
        enemyHP.className = 'enemy-hp';
        enemyHP.textContent = `Hit Points: ${hp}`;
        
        // Add event listener for selecting an enemy
        enemyCard.addEventListener('click', function() {
          document.querySelectorAll('.enemy-card').forEach(card => {
            card.classList.remove('selected');
          });
          enemyCard.classList.add('selected');
          setSelectedEnemy(name, hp);
        });
        
        selectButton.addEventListener('click', function(e) {
            e.stopPropagation(); // Prevent the card click event
            document.querySelectorAll('.enemy-card').forEach(card => {
                card.classList.remove('selected');
            });
            enemyCard.classList.add('selected');
            setSelectedEnemy(name, hp);
        });
        
        imageContainer.appendChild(img);
        imageContainer.appendChild(selectButton);
        
        enemyCard.appendChild(enemyName);
        enemyCard.appendChild(imageContainer);
        enemyCard.appendChild(enemyHP);
        
        enemiesGrid.appendChild(enemyCard);
      });
    } catch (error) {
        console.error('Error loading enemies:', error);
    }
  }

  const enemyForm = document.querySelector('.enemy-form');

  document.querySelector('.enemy-save-button').addEventListener('click', function() {
    enemyForm.classList.remove('active');
  });

  document.querySelector('.select-enemy-button').addEventListener('click', function() {
    console.log('Select Enemy button clicked');
    try {
        // Load enemies and show the form
        loadEnemies();
        showForm(enemyForm, '.form__close');
    } catch (error) {
        console.error('Error showing enemy form:', error);
        alert('Could not load enemy selection. Check console for details.');
    }
  });

});
