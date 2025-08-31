// ui-fight.js

/**
 * About: UI components and interactions for the Not Fight Club application.
 */


import {
  CHARACTER_HP,
  DEFAULT_CHARACTER_CH,
  DEFAULT_CHARACTER_DH,
  ENEMY_CRITICAL_HITS,
  ENEMY_DOUBLE_HITS,
  REQUIRED_ATTACK_ZONES,
  REQUIRED_DEFENSE_ZONES
} from './config.js';

import { nfcBus } from './events.js';

import { logContainer, addLogEntry } from './logging.js';

import {
  deleteActiveMenuItem,
  deleteCurrentCharacter,
  deleteBattleState,
  getActiveMenuItem,
  getBattleState,
  getCharacterAvatars,
  getCharacterCH,
  getCharacterDH,
  getCharacterHP,
  getCurrentCharacter,
  getEnemyCH,
  getEnemyDH,
  getEnemyHP,
  getSelectedEnemyHP,
  getSelectedEnemyName,
  setActiveMenuItem,
  setBattleState,
  setCharacterCH,
  setCharacterDH,
  setEnemyCH,
  setEnemyDH,
  setEnemyHP
} from './state.js';

import { loginForm, showForm } from './ui-forms.js';

import {
  endBattle,
  initializeZoneSelection,
  getSelectedAttackZone,
  processAttack,
} from './fight.js';


// Export UI elements and interactions
export {
  activeItemDisplay,
  attackButton,
  checkLoginState,
  closeGame,
  hideBattleUI,
  initializeBattle,
  updateCriticalHitDisplay,
  updateDoubleHitDisplay
};


/**
* Logout
*/

// Logout elements
const activeItemDisplay = document.querySelector('.navigation__active-item');
const fightLink = document.querySelector('.fight-link');
const logout = document.querySelector('.login-link');

// Logout event handlers
logout.addEventListener('click', function (e) {
  e.preventDefault();

  const currentCharacter = getCurrentCharacter();
  if (currentCharacter) {
    deleteCurrentCharacter();
    deleteActiveMenuItem();
  }

  nfcBus('nfc-ui-fight', { detail: `User logged out: ${currentCharacter}` });
  checkLoginState();
});


/**
* Login state
*/

// Login state helpers
function checkLoginState() {
  const currentCharacter = getCurrentCharacter();
  if (currentCharacter) {
    // User is logged in
    document.querySelector('.login-link').textContent = 'Logout';
    document.querySelector('.fight-link').classList.remove('hidden');
    document.querySelector('.score-link').classList.remove('hidden');
    document.querySelector('.settings-link').classList.remove('hidden');

    // Set default active menu item to Fight
    if (!getActiveMenuItem()) {
      activeItemDisplay.textContent = 'Fight';
      setActiveMenuItem('Fight');
    }
  } else {
    // User is not logged in
    document.querySelector('.login-link').textContent = 'Login';
    document.querySelector('.fight-link').classList.add('hidden');
    document.querySelector('.score-link').classList.add('hidden');
    document.querySelector('.settings-link').classList.add('hidden');

    // Default to Login for logged out users
    activeItemDisplay.textContent = 'Fight';
    deleteActiveMenuItem();
  }

  // Restore active menu item from session
  const activeMenuItem = getActiveMenuItem();
  if (activeMenuItem) {
    activeItemDisplay.textContent = activeMenuItem;
  }
}


/**
* Attack button state
*/

// Update attack button state
function updateAttackButtonState(attackCount = null, defenseCount = null) {
  // If values not provided, calculate them
  if (attackCount === null) {
    attackCount = document.querySelectorAll('input[name="attack"]:checked').length;
  }
  if (defenseCount === null) {
    defenseCount = document.querySelectorAll('input[name="defense"]:checked').length;
  }

  const battleState = getBattleState();
  const attackZoneSelected = getSelectedAttackZone() !== null;
  const shouldBeEnabled = battleState === 'active' &&
    attackZoneSelected &&
    attackCount === REQUIRED_ATTACK_ZONES &&
    defenseCount === REQUIRED_DEFENSE_ZONES;

  if (attackButton) {
    attackButton.disabled = !shouldBeEnabled;
    if (!attackZoneSelected && attackCount === REQUIRED_ATTACK_ZONES) {
      console.log("Attack zone validation issue: zone selection not registering");
    }
  }
}


/**
* Fight
*/

// Fight link event handler
fightLink.addEventListener('click', function (e) {
  e.preventDefault();
  initializeBattle();
});

// Main "Fight" button elements
const fightButton = document.querySelector('.fight-section__fight-button');

// Main "Fight" button event handler
fightButton.addEventListener('click', function () {
  const currentCharacter = sessionStorage.getItem('nfcCurrentCharacter');
  if (!currentCharacter) {
    showForm(loginForm);
  } else {
    initializeBattle();
  }
});


/**
* Hit Points (HP) display
*/

// HP display helpers
export function updateHPDisplays() {
  const characterHP = getCharacterHP();
  const enemyHP = getEnemyHP();
  const characterMaxHP = 150;
  const enemyMaxHP = parseInt(getSelectedEnemyHP());

  // Update text displays
  document.querySelector('.character-hp-text').textContent = `${characterHP}/${characterMaxHP}`;
  document.querySelector('.enemy-hp-text').textContent = `${enemyHP}/${enemyMaxHP}`;

  activeItemDisplay.textContent = 'Fight';
  sessionStorage.setItem('nfcActiveMenuItem', 'Fight');

  // Update HP bars
  const characterHPBar = document.querySelector('.character-hp-bar');
  const enemyHPBar = document.querySelector('.enemy-hp-bar');

  characterHPBar.style.width = `${(characterHP / characterMaxHP) * 100}%`;
  enemyHPBar.style.width = `${(enemyHP / enemyMaxHP) * 100}%`;

  // Add 'low' class if HP is below 30%
  if (characterHP / characterMaxHP < 0.3) {
    characterHPBar.classList.add('low');
  } else {
    characterHPBar.classList.remove('low');
  }

  if (enemyHP / enemyMaxHP < 0.3) {
    enemyHPBar.classList.add('low');
  } else {
    enemyHPBar.classList.remove('low');
  }
}


/**
* Enemy update
*/

// Enemy update helpers
export function updateEnemyInBattle(enemyName, enemyMaxHP) {
  const battleInterface = document.querySelector('.battle-interface');
  if (battleInterface && !battleInterface.classList.contains('hidden')) {
    document.querySelector('.enemy-name').textContent = enemyName;
    document.querySelector('.enemy-image').src = `./assets/img/enemy/${enemyName.toLowerCase().replace(' ', '_')}.png`;

    const currentEnemyHP = getEnemyHP();

    if (getBattleState() !== 'active') {
      setEnemyHP(enemyMaxHP);
      document.querySelector('.enemy-hp-text').textContent = `${enemyMaxHP}/${enemyMaxHP}`;
      document.querySelector('.enemy-hp-bar').style.width = '100%';
      document.querySelector('.enemy-hp-bar').classList.remove('low');
    } else {
      // If battle is active
      const hpPercentage = Math.min(1, currentEnemyHP / parseInt(getSelectedEnemyHP()));
      const newHP = Math.round(hpPercentage * enemyMaxHP);
      setEnemyHP(newHP);

      updateHPDisplays();
    }

    if (['active', 'paused'].includes(getBattleState())) {
      addLogEntry(`Enemy changed to ${enemyName}!`, 'result');
      nfcBus('nfc-ui-fight', { detail: `enemy changed: ${enemyName}, hp: ${enemyMaxHP}` });
    }
  }
}


/**
* Critical hit (CH) display
*/

// Critical hit display helpers
function updateCriticalHitDisplay() {
  const characterCH = getCharacterCH();
  const enemyCH = getEnemyCH();

  // Add critical hit info to the battle interface
  const characterInfoPanel = document.querySelector('.battle-character');
  const enemyInfoPanel = document.querySelector('.battle-enemy');

  // Remove existing critical hit displays if any
  const existingCharacterCH = characterInfoPanel.querySelector('.critical-hit-count');
  const existingEnemyCH = enemyInfoPanel.querySelector('.critical-hit-count');

  if (existingCharacterCH) existingCharacterCH.remove();
  if (existingEnemyCH) existingEnemyCH.remove();

  // Create new critical hit displays
  const characterCHDisplay = document.createElement('div');
  characterCHDisplay.className = 'critical-hit-count';
  characterCHDisplay.innerHTML = `Critical Hits: <span class="ch-value">${characterCH}</span>`;

  const enemyCHDisplay = document.createElement('div');
  enemyCHDisplay.className = 'critical-hit-count';
  enemyCHDisplay.innerHTML = `Critical Hits: <span class="ch-value">${enemyCH}</span>`;

  // Insert after HP text
  const characterHPText = characterInfoPanel.querySelector('.hp-text');
  const enemyHPText = enemyInfoPanel.querySelector('.hp-text');

  characterHPText.after(characterCHDisplay);
  enemyHPText.after(enemyCHDisplay);
}


/**
* Double hit (DH) display
*/

// Double hit display helpers
function updateDoubleHitDisplay() {
  const characterDH = getCharacterDH();
  const enemyDH = getEnemyDH();

  // Add double hit info to the battle interface
  const characterInfoPanel = document.querySelector('.battle-character');
  const enemyInfoPanel = document.querySelector('.battle-enemy');

  // Remove existing double hit displays if any
  const existingCharacterDH = characterInfoPanel.querySelector('.double-hit-count');
  const existingEnemyDH = enemyInfoPanel.querySelector('.double-hit-count');

  if (existingCharacterDH) existingCharacterDH.remove();
  if (existingEnemyDH) existingEnemyDH.remove();

  // Create new double hit displays
  const characterDHDisplay = document.createElement('div');
  characterDHDisplay.className = 'double-hit-count';
  characterDHDisplay.innerHTML = `Double Hits: <span class="dh-value">${characterDH === -1 ? "∞" : characterDH}</span>`;

  const enemyDHDisplay = document.createElement('div');
  enemyDHDisplay.className = 'double-hit-count';
  enemyDHDisplay.innerHTML = `Double Hits: <span class="dh-value">${enemyDH === -1 ? "∞" : enemyDH}</span>`;

  // Insert after critical hit text
  const characterCHText = characterInfoPanel.querySelector('.critical-hit-count');
  const enemyCHText = enemyInfoPanel.querySelector('.critical-hit-count');

  if (characterCHText) {
    characterCHText.after(characterDHDisplay);
  } else {
    const characterHPText = characterInfoPanel.querySelector('.hp-text');
    characterHPText.after(characterDHDisplay);
  }

  if (enemyCHText) {
    enemyCHText.after(enemyDHDisplay);
  } else {
    const enemyHPText = enemyInfoPanel.querySelector('.hp-text');
    enemyHPText.after(enemyDHDisplay);
  }
}


/**
* Zone selection
*/

// Battle UI elements
const battleControlsPanel = document.querySelector('.battle-controls-panel');
const battleInterface = document.querySelector('.battle-interface');
const battleControls = document.querySelector('.battle-controls');
const attackButton = document.querySelector('.attack-button');

// UI helpers: hide battle UI
function hideBattleUI() {
  // Update UI - hide battle interface and show Fight button
  fightButton.parentElement.classList.remove('hidden');
  battleControlsPanel.classList.add('hidden');
  battleControls.classList.add('hidden');
}

// Battle initialization
function initializeBattle() {

  // Clear log container
  logContainer.innerHTML = '';

  // Hide fight button and show battle interface
  fightButton.parentElement.classList.add('hidden');
  battleControlsPanel.classList.add('hidden');
  battleInterface.classList.remove('hidden');
  battleControls.classList.remove('hidden');

  // Show start button, hide stop and finish buttons
  startButton.classList.remove('hidden');
  stopButton.classList.add('hidden');
  finishButton.classList.add('hidden');


  // Set up character info
  const currentCharacter = getCurrentCharacter();
  const characterName = document.querySelector('.character-name');
  const characterImage = document.querySelector('.character-image');

  characterName.textContent = currentCharacter;

  // Get character avatar
  const avatars = getCharacterAvatars();
  const characterAvatar = avatars[currentCharacter] || 'default.png';
  characterImage.src = `./assets/img/avatars/${characterAvatar}`;

  // Set up enemy info
  const enemyName = document.querySelector('.enemy-name');
  const enemyImage = document.querySelector('.enemy-image');

  const selectedEnemyName = getSelectedEnemyName();
  enemyName.textContent = selectedEnemyName;
  enemyImage.src = `./assets/img/enemy/${selectedEnemyName.toLowerCase().replace(' ', '_')}.png`;

  // Reset HP and critical hits if not continuing a battle
  const characterMaxHP = CHARACTER_HP;
  const enemyMaxHP = parseInt(getSelectedEnemyHP());
  const characterCurrentHP = getCharacterHP();
  const enemyCurrentHP = getEnemyHP();

  if (characterCurrentHP < characterMaxHP || enemyCurrentHP < enemyMaxHP) {
    addLogEntry('We continue the battle! Click Start!', 'result');
    setBattleState('active');
    updateAttackButtonState();
  } else {
    // Reset critical hits and double hits for a new battle
    const selectedEnemyName = getSelectedEnemyName();
    setCharacterCH(DEFAULT_CHARACTER_CH);
    setEnemyCH(ENEMY_CRITICAL_HITS[selectedEnemyName] || 1);
    setCharacterDH(DEFAULT_CHARACTER_DH);
    setEnemyDH(ENEMY_DOUBLE_HITS[selectedEnemyName] || 0);

    logContainer.innerHTML = '';
  }

  updateCriticalHitDisplay();
  updateDoubleHitDisplay();
  updateHPDisplays(characterMaxHP, enemyMaxHP);

  setBattleState('ready');

  initializeZoneSelection();
  nfcBus('nfc-ui-fight', { detail: `Battle initialized` });
}


/**
* Battle controls
*/

// Battle control elements
const startButton = document.querySelector('.battle-start');
const stopButton = document.querySelector('.battle-stop');
const finishButton = document.querySelector('.battle-finish');

// Battle control event handlers
startButton.addEventListener('click', function () {
  setBattleState('active');

  // Update UI
  battleControlsPanel.classList.remove('hidden');
  startButton.classList.add('hidden');
  stopButton.classList.remove('hidden');
  finishButton.classList.remove('hidden');

  // Update attack button state based on current selections
  updateAttackButtonState();

  // Add start message to log
  addLogEntry('Battle started!', 'result');
  nfcBus('nfc-ui-fight', { detail: `Battle started` });
});

// Stop button event handler
stopButton.addEventListener('click', function () {
  setBattleState('paused');

  // Update UI
  stopButton.classList.add('hidden');
  startButton.classList.remove('hidden');

  attackButton.disabled = true;

  addLogEntry('Battle paused!', 'result');
  nfcBus('nfc-ui-fight', { detail: `Battle paused` });
});

// Finish button event handler
finishButton.addEventListener('click', function () {
  endBattle();
});


/**
* Attack button
*/

// Attack button event handler
attackButton.addEventListener('click', function () {
  if (sessionStorage.getItem('nfcBattleState') !== 'active') {
    return;
  }

  // Attack button click handler - Fix event handling
  if (attackButton) {

    if (sessionStorage.getItem('nfcBattleState') !== 'active') {
      addLogEntry('Battle not active, click Start!', 'result');
      return;
    }

    // Process attack
    processAttack(true);
  }
});


/**
* Game over
*/

// Game over helpers
function closeGame() {
  deleteCurrentCharacter();
  deleteBattleState();
  deleteActiveMenuItem();

  battleInterface.classList.add('hidden');
  battleControls.classList.add('hidden');

  nfcBus('nfc-ui-fight', { detail: `Game over, try again!` });
}
