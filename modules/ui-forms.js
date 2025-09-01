// ui-forms.js

/**
 * About: This module handles the UI forms for Login and Settings.
 */


import {
  DEFAULT_CHARACTER_CH,
  DEFAULT_CHARACTER_DH,
  ENEMY_CRITICAL_HITS,
  ENEMY_DOUBLE_HITS,
  FORM_CLOSE_TIMEOUT,
  avatarFiles
} from './config.js';

import { nfcBus } from './events.js';

import {
  characterExists,
  getCharacterAvatars,
  getCharacterNames,
  getCharacterCH,
  getCharacterDH,
  getCharacterPasswords,
  getCharacterScores,
  getEnemies,
  getSelectedEnemyName,
  setCharacterCH,
  setCharacterDH,
  setSelectedAvatar,
  setSelectedEnemy,
  updateCharacterAvatar,
  setCharacterAvatars,
  setCharacterNames,
  setCharacterPasswords,
  getCurrentCharacter,
  setCurrentCharacter
} from './state.js'

import {
  activeItemDisplay,
  updateCriticalHitDisplay,
  updateDoubleHitDisplay
} from './ui-fight.js';

import {
  initializeBattle
} from './ui-fight.js';


// Export UI components
export {
  showForm,
  loginForm,
  scoreForm,
  populateScoreForm
};


/**
* Helper form
*/

// Helper form elements
const closeBtns = document.querySelectorAll('.form__close');

// Helper form function
function showForm(form, focus) {
  // Hide all forms first
  document.querySelectorAll('form_container,.active').forEach(f => {
    f.classList.remove('active');
  });

  form.classList.add('active');
  nfcBus('nfc-ui-forms', { detail: `Form "${form.classList.value}" is running...` });

  // Set focus
  if (focus) {
    form.querySelector(focus).focus();
  }
}

// Helper form event handlers
closeBtns.forEach(btn => {
  btn.addEventListener('click', function () {
    const form = this.closest('.form_container');
    form.classList.remove('active');
  });
});


/**
* Login form
*/

// Login form elements
const loginForm = document.querySelector('.login-form');
const loginButton = document.querySelector('.login-button');
const loginMessage = document.querySelector('.login-message');

// Login form event handler
loginButton.addEventListener('click', function () {
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
    }, FORM_CLOSE_TIMEOUT);
    return;
  }

  if (!checkPassword(name, password)) {
    loginMessage.textContent = 'Incorrect password';

    return;
  }

  // Login successful
  loginMessage.textContent = '';
  loginForm.classList.remove('active');

  document.querySelector('.login-link').textContent = 'Logout';
  document.querySelector('.fight-link').classList.remove('hidden');
  document.querySelector('.score-link').classList.remove('hidden');
  document.querySelector('.settings-link').classList.remove('hidden');
  activeItemDisplay.textContent = 'Login';

  setCurrentCharacter(name);

  initializeBattle();
});


/**
* Create Character form
*/

// Create Character form elements
const createCharacterLink = document.querySelector('.create-character-link');
const createForm = document.querySelector('.create-character-form');
const createButton = document.querySelector('.create-button');

// Create Character link event handler
createCharacterLink.addEventListener('click', function (e) {
  e.preventDefault();
  document.querySelector('.create-name').value = document.querySelector('.login-name').value;
  document.querySelector('.create-password').value = document.querySelector('.login-password').value;
  showForm(createForm, '.create-name');
});

// Create Character form event handler
createButton.addEventListener('click', function () {
  function addCharacter(name, password) {
    const names = getCharacterNames();
    const passwords = getCharacterPasswords();
    const avatars = getCharacterAvatars();

    names.push(name);
    passwords[name] = password;
    avatars[name] = 'default.png'; // Default avatar

    setCharacterNames(names);
    setCharacterPasswords(passwords);
    setCharacterAvatars(avatars);
  }

  const name = document.querySelector('.create-name').value.trim();
  const password = document.querySelector('.create-password').value;
  const repeatPassword = document.querySelector('.create-repeat-password').value;
  const createMessage = document.querySelector('.create-message');

  if (!name || !password || !repeatPassword) {
    createMessage.textContent = 'Please fill all fields';
    nfcBus('nfc-ui-forms', { detail: `Please fill all fields for: ${name}` });
    return;
  }

  if (password !== repeatPassword) {
    createMessage.textContent = 'Passwords do not match';
    nfcBus('nfc-ui-forms', { detail: `Passwords do not match for: ${name}` });
    return;
  }

  if (characterExists(name)) {
    createMessage.textContent = 'Character already exists';
    nfcBus('nfc-ui-forms', { detail: `Character already exists: ${name}` });
    return;
  }

  // Create character
  addCharacter(name, password);
  createMessage.textContent = 'Character created successfully';
  nfcBus('nfc-ui-forms', { detail: `Character created: ${name}` });

  setTimeout(() => {
    createMessage.textContent = '';
    showForm(loginForm, '.login-name');
  }, FORM_CLOSE_TIMEOUT);
});


/**
* Settings functionality
*/

// Settings form elements
const settingsForm = document.querySelector('.settings-form');
const settingsLink = document.querySelector('.settings-link');

// Settings form event handler
settingsLink.addEventListener('click', function (e) {
  e.preventDefault();
  showForm(settingsForm, '.form__close');
});


/**
* Score functionality
*/

// Score form elements
const scoreForm = document.querySelector('.score-form');
const scoreLink = document.querySelector('.score-link');

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
  nfcBus('nfc-ui-forms', { detail: `Score form populated for: ${characterName}, score: ${JSON.stringify(characterScore)}` });
}

// Score form event handler
scoreLink.addEventListener('click', function (e) {
  e.preventDefault();

  const currentCharacter = getCurrentCharacter();
  populateScoreForm(currentCharacter);

  const scoreTitle = document.querySelector('.score_title');
  scoreTitle.textContent = 'Score';
  showForm(scoreForm, '.form__close');
});


/**
* Character settings functionality
*/

// Character form elements
const characterForm = document.querySelector('.character-form');
const characterSaveButton = document.querySelector('.character-save-button');
const editCharacterButton = document.querySelector('.edit-character-button');
const avatarEditButton = document.querySelector('.avatar-edit-button');

// Fill current values into the character settings form
function autoFillCharacterSettings() {
  const currentCharacter = getCurrentCharacter();
  if (currentCharacter) {
    // Populate character form with current user data
    document.querySelector('.edit-character-name').value = currentCharacter;

    // Get password and pre-fill password fields with asterisks if exists
    const passwords = getCharacterPasswords();
    const currentPassword = passwords[currentCharacter];

    if (currentPassword) {
      document.querySelector('.edit-character-password').value = currentPassword;
      document.querySelector('.edit-character-repeat-password').value = currentPassword;

      // Store original password
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

    // Set critical hit value
    document.querySelector('.edit-character-ch').value = getCharacterCH();

    // Set double hit value
    document.querySelector('.edit-character-dh').value = getCharacterDH();
  }
}

// Character form event handlers
editCharacterButton.addEventListener('click', function () {
  autoFillCharacterSettings();
  showForm(characterForm, '.edit-character-name');
});

avatarEditButton.addEventListener('click', function () {
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

  // Update avatar in battle interface if it's visible
  const battleInterface = document.querySelector('.battle-interface');
  const characterName = document.querySelector('.character-name');
  if (battleInterface && !battleInterface.classList.contains('hidden')) {
    characterName.textContent = newName;
  }

  setCharacterNames(names);
  setCharacterPasswords(passwords);
  setCharacterAvatars(avatars);
}

characterSaveButton.addEventListener('click', function () {
  const currentCharacter = getCurrentCharacter();
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

  if ( password === originalPassword ) {
    passwordToSave = originalPassword;
  } else {
    passwordToSave = password;
  }

  // Update character
  updateCharacter(currentCharacter, newName, passwordToSave);

  // Save critical hit count
  const chField = document.querySelector('.edit-character-ch');
  if (chField) {
    const chValue = parseInt(chField.value) || DEFAULT_CHARACTER_CH;
    setCharacterCH(chValue);
  }

  // Save double hit count
  const dhField = document.querySelector('.edit-character-dh');
  if (dhField) {
    const dhValue = parseInt(dhField.value) || DEFAULT_CHARACTER_DH;
    setCharacterDH(dhValue);
  }

  characterMessage.textContent = 'Character updated successfully';

  // Update battle interface if it's visible
  const battleInterface = document.querySelector('.battle-interface');
  if (battleInterface && !battleInterface.classList.contains('hidden')) {
    updateCriticalHitDisplay();
    updateDoubleHitDisplay();
  }

  // Update current character in session storage
  setCurrentCharacter(newName);

  // Clear form fields
  setTimeout(() => {
    passwordField.value = '';
    repeatPasswordField.value = '';
    delete passwordField.dataset.originalPassword;
    characterMessage.textContent = '';
    characterForm.classList.remove('active');
  }, FORM_CLOSE_TIMEOUT);
});


/**
* Select avatar
*/

// Avatars form elements
const avatarsForm = document.querySelector('.avatars-form');
const selectAvatarButton = document.querySelector('.select-avatar-button');
const avatarsGrid = document.querySelector('.avatars-grid');

// Load avatars into the Avatars form
function loadAvatars() {
  nfcBus('nfc-ui-forms', { detail: `Loading avatars...` });
  avatarsGrid.innerHTML = '';

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

    selectButton.addEventListener('click', function () {
      selectAvatar(file);
    });

    avatarOption.appendChild(img);
    avatarOption.appendChild(selectButton);
    avatarsGrid.appendChild(avatarOption);
  });
}

// Avatars form event handlers
selectAvatarButton.addEventListener('click', function () {
  loadAvatars();
  showForm(avatarsForm);
});

// Change current avatar
function selectAvatar(avatar) {
  const currentCharacter = getCurrentCharacter();

  if (currentCharacter) {
    // Update avatar in local storage
    updateCharacterAvatar(currentCharacter, avatar);

    setSelectedAvatar(avatar);

    // Update avatar in character form
    document.getElementById('character-avatar').src = `./assets/img/avatars/${avatar}`;

    // Update avatar in battle interface if it's visible
    const battleInterface = document.querySelector('.battle-interface');
    if (battleInterface && !battleInterface.classList.contains('hidden')) {
      document.querySelector('.character-image').src = `./assets/img/avatars/${avatar}`;
    }

    // Close the avatars form
    avatarsForm.classList.remove('active');

    // If we came from settings, show character form
    if (!characterForm.classList.contains('active')) {
      autoFillCharacterSettings();
      showForm(characterForm);
    }
  }
}


/**
* Select Enemy
*/

// Enemy form elements
const enemyForm = document.querySelector('.enemy-form');
const enemySaveButton = document.querySelector('.enemy-save-button');
const selectEnemyButton = document.querySelector('.select-enemy-button');

// Enemy form helpers
function loadEnemies() {
  nfcBus('nfc-ui-forms', { detail: `Loading enemies...` });

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

      // Add critical hit info
      const enemyCH = document.createElement('div');
      enemyCH.className = 'enemy-ch';
      enemyCH.textContent = `Critical Hits: ${ENEMY_CRITICAL_HITS[name] || 1}`;

      // Add double hit info
      const enemyDH = document.createElement('div');
      enemyDH.className = 'enemy-dh';
      const dhValue = ENEMY_DOUBLE_HITS[name] || 0;
      enemyDH.textContent = `Double Hits: ${dhValue === -1 ? "∞" : dhValue}`;

      // Add event listener for selecting an enemy
      enemyCard.addEventListener('click', function () {
        document.querySelectorAll('.enemy-card').forEach(card => {
          card.classList.remove('selected');
        });
        enemyCard.classList.add('selected');
        setSelectedEnemy(name, hp);
        nfcBus('nfc-ui-forms', { detail: `Enemy "${name}" selected` });
      });

      selectButton.addEventListener('click', function (e) {
        e.stopPropagation();
        document.querySelectorAll('.enemy-card').forEach(card => {
          card.classList.remove('selected');
        });
        enemyCard.classList.add('selected');
        setSelectedEnemy(name, hp);
        nfcBus('nfc-ui-forms', { detail: `Enemy "${name}" selected` });
      });

      imageContainer.appendChild(img);
      imageContainer.appendChild(selectButton);

      enemyCard.appendChild(enemyName);
      enemyCard.appendChild(imageContainer);
      enemyCard.appendChild(enemyHP);
      enemyCard.appendChild(enemyCH);
      enemyCard.appendChild(enemyDH);

      enemiesGrid.appendChild(enemyCard);
    });
  } catch (error) {
    console.error('Error loading enemies:', error);
  }
}

// Enemy form event handlers
enemySaveButton.addEventListener('click', function () {
  enemyForm.classList.remove('active');
});

selectEnemyButton.addEventListener('click', function () {
  nfcBus('nfc-ui-forms', { detail: `Settings > Select Enemy choice` });
  try {
    loadEnemies();
    showForm(enemyForm, '.form__close');
  } catch (error) {
    console.error('Error showing enemy form:', error);
    alert('Could not load enemy selection. Check console for details.');
  }
});
