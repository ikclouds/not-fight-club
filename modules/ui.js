// ui.js

// About: UI components and interactions for the Not Fight Club application.

import { nfcBus } from './events.js';

import { addLogEntry } from './logging.js';

import {
  getEnemyHP,
  setEnemyHP,
  getSelectedEnemyHP,
  getCharacterHP,
  getCharacterCH,
  getEnemyCH,
  getCharacterDH,
  getEnemyDH
} from './state.js';

// Header

export const activeItemDisplay = document.querySelector('.navigation__active-item');

// Function to update enemy in battle interface when it's changed
export function updateEnemyInBattle(enemyName, enemyMaxHP) {
  const battleInterface = document.querySelector('.battle-interface');
  if (battleInterface && !battleInterface.classList.contains('hidden')) {
    document.querySelector('.enemy-name').textContent = enemyName;
    document.querySelector('.enemy-image').src = `./assets/img/enemy/${enemyName.toLowerCase().replace(' ', '_')}.png`;

    const currentEnemyHP = getEnemyHP();

    if (sessionStorage.getItem('nfcBattleState') !== 'active') {
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

    if (['active', 'paused'].includes(sessionStorage.getItem('nfcBattleState'))) {
      addLogEntry(`Enemy changed to ${enemyName}!`, 'result');
      nfcBus('nfc-ui', { detail: `enemy changed: ${enemyName}, hp: ${enemyMaxHP}` });
    }
  }
}

// Update HP displays
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

// Function to update critical hit display
export function updateCriticalHitDisplay() {
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

// Function to update double hit display
export function updateDoubleHitDisplay() {
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
