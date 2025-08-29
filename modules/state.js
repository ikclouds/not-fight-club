// state.js

/** 
 * About: State management for the Not Fight Club application.
 * Also exposes a tiny event bus for cross-module notifications.
 */

// Event bus for state changes
import { nfcBus } from './events.js';

import {
  DEFAULT_ENEMY_NAME,
  DEFAULT_CHARACTER_CH,
  DEFAULT_ENEMY_CH,
  DEFAULT_CHARACTER_DH,
  DEFAULT_ENEMY_DH,
  CHARACTER_HP,
  ENEMY_CRITICAL_HITS,
  ENEMY_DOUBLE_HITS,
  DEFAULT_ENEMY_HP,
  SPACEMARINE_HP,
  SNOWTROLL_HP,
  SPIDER_HP
} from './config.js';

import {
  updateEnemyInBattle,
  updateCriticalHitDisplay,
  updateDoubleHitDisplay
} from './ui.js';

/**
 * Initialize application state
 */

export function initState() {
  // Character
  if (!localStorage.getItem('nfcCharacterNames'))
    localStorage.setItem('nfcCharacterNames', JSON.stringify([]));

  if (!localStorage.getItem('nfcCharacterPasswords'))
    localStorage.setItem('nfcCharacterPasswords', JSON.stringify({}));

  if (!localStorage.getItem('nfcCharacterAvatars'))
    localStorage.setItem('nfcCharacterAvatars', JSON.stringify({}));

  if (!localStorage.getItem('nfcSelectedAvatar'))
    localStorage.setItem('nfcSelectedAvatar', 'default.png');

  // Enemy
  if (!localStorage.getItem('nfcEnemies')) {
    localStorage.setItem('nfcEnemies',
      JSON.stringify({ 
        Spacemarine: `${SPACEMARINE_HP}`, 
        Snowtroll: `${SNOWTROLL_HP}`, 
        Spider: `${SPIDER_HP}` 
      }));
  }

  if (!localStorage.getItem('nfcSelectedEnemyName'))
    localStorage.setItem('nfcSelectedEnemyName', `${DEFAULT_ENEMY_NAME}`);

  // HP
  if (!localStorage.getItem('nfcCharacterHP'))
    localStorage.setItem('nfcCharacterHP', `${CHARACTER_HP}`); // '150'

  if (!localStorage.getItem('nfcSelectedEnemyHP'))
    localStorage.setItem('nfcSelectedEnemyHP', `${SPACEMARINE_HP}`); // '170'

  if (!localStorage.getItem('nfcEnemyHP'))
    localStorage.setItem('nfcEnemyHP', `${SPACEMARINE_HP}`); // '170'

  // Score
  if (!localStorage.getItem('nfcCharacterScore'))
    localStorage.setItem('nfcCharacterScore', JSON.stringify({}));

  // Critical Hits (CH)
  // TODO: check
  if (!localStorage.getItem('nfcCharacterCH'))
    localStorage.setItem('nfcCharacterCH', `${DEFAULT_CHARACTER_CH}`);

  // TODO: check
  if (!localStorage.getItem('nfcEnemyCH')) {
    const enemy = getSelectedEnemyName();
    localStorage.setItem('nfcEnemyCH', `${ENEMY_CRITICAL_HITS[enemy] || 1}`);
    // localStorage.setItem('nfcCharacterCH', DEFAULT_CHARACTER_CH.toString());
  }

  // Double Hits (DH)
  // TODO: check
  if (!localStorage.getItem('nfcCharacterDH'))
    localStorage.setItem('nfcCharacterDH', `${DEFAULT_CHARACTER_DH}`);
  
  // TODO: check
  if (!localStorage.getItem('nfcEnemyDH')) {
    const enemy = getSelectedEnemyName();
    localStorage.setItem('nfcEnemyDH', `${ENEMY_DOUBLE_HITS[enemy] || 0}`);
  }
}

/**
 * Helper functions
 */

// Character

// Character Get-functions
export const getCharacterNames = () =>
  JSON.parse(localStorage.getItem('nfcCharacterNames')) || [];

export function characterExists(name) {
  const names = getCharacterNames();
  return names.includes(name);
}

export const getCharacterPasswords = () =>
  JSON.parse(localStorage.getItem('nfcCharacterPasswords')) || {};

export const getCharacterAvatars = () =>
  JSON.parse(localStorage.getItem('nfcCharacterAvatars')) || {};

export const getCharacterScores = () =>
  JSON.parse(localStorage.getItem('nfcCharacterScore')) || {};

// Character Set-functions
export function setCharacterNames(names) {
  localStorage.setItem('nfcCharacterNames', JSON.stringify(names));
}

export function setCharacterPasswords(map) {
  localStorage.setItem('nfcCharacterPasswords', JSON.stringify(map));
}

export function setSelectedAvatar(avatar) {
  localStorage.setItem('nfcClubSelectedAvatar', avatar);
  nfcBus('nfc-state', { detail: `avatar changed: ${avatar}` });
}

// TODO: check
export function setCharacterAvatars(map) {
  localStorage.setItem('nfcCharacterAvatars', JSON.stringify(map));
}

export function updateCharacterAvatar(name, avatar) {
  const avatars = getCharacterAvatars();
  avatars[name] = avatar;
  setCharacterAvatars(avatars);
}

// Score

// Score Set-functions

export function updateCharacterScore(characterName, resultKey) {
  /**
   * Updates the score for a given character based on the result of a battle.
   * Increments either the 'Win' or 'Loss' count for the specified character.
   * Persists the updated scores in localStorage and dispatches a 'score:updated' event.
   *
   * @param {string} characterName - The name of the character whose score should be updated.
   * @param {'Win'|'Loss'} resultKey - The result type to increment ('Win' or 'Loss').
   * @fires CustomEvent#score:updated - Dispatched with the updated scores for the character.
   */

  const scores = getCharacterScores();
  if (!scores[characterName])
    scores[characterName] = { 
      Win: '0', 
      Loss: '0' 
    };

  const currentValue = parseInt(scores[characterName][resultKey]) || 0;
  scores[characterName][resultKey] = (currentValue + 1).toString();
  localStorage.setItem('nfcCharacterScore', JSON.stringify(scores));

  nfcBus('nfc-state', { detail: `score updated: ${characterName}, scores: ${scores[characterName]}` });
}

// Enemy

// Enemy Get-functions 

export const getEnemies = () =>
  JSON.parse(localStorage.getItem('nfcEnemies')) || {};

export const getSelectedEnemyName = () =>
  localStorage.getItem('nfcSelectedEnemyName') || `${DEFAULT_ENEMY_NAME}`;

export const getSelectedEnemyHP = () =>
  parseInt(localStorage.getItem('nfcSelectedEnemyHP') || `${DEFAULT_ENEMY_HP}`);

// Enemy Set-functions

export function setSelectedEnemy(name, hp) {
  localStorage.setItem('nfcSelectedEnemyName', name);
  localStorage.setItem('nfcSelectedEnemyHP', String(hp));

  setEnemyCH(ENEMY_CRITICAL_HITS[name] || 1);
  setEnemyDH(ENEMY_DOUBLE_HITS[name] || 0);

  // TODO: UI
  updateEnemyInBattle(name, hp);
  updateCriticalHitDisplay();
  updateDoubleHitDisplay();

  nfcBus('nfc-state', { detail: `enemy changed: ${name}, hp: ${hp}` });
}


// Fight

// Fight Get-functions

// export const getCurrentCharacter = () =>
//   sessionStorage.getItem('nfcCurrentCharacter');

// export const getBattleState = () =>
//   sessionStorage.getItem('nfcBattleState');

export const getActiveMenuItem = () =>
  sessionStorage.getItem('nfcActiveMenuItem');

// Fight Set-functions

export function setCurrentCharacter(name) {
  if (name)
    sessionStorage.setItem('nfcCurrentCharacter', name);
  else
    sessionStorage.removeItem('nfcCurrentCharacter');

  // stateBus.dispatchEvent(new Event('auth:changed'));
  nfcBus('nfc-state', { detail: `current character changed: ${name}` });
}

// export function setBattleState(state) {
//   sessionStorage.setItem('nfcBattleState', state);
//   nfcBus('nfc-state', { detail: `battle state changed: ${state}` });
// }

// TODO: check
// export function setActiveMenuItem(menuItem) {
//   if (menuItem)
//     sessionStorage.setItem('nfcActiveMenuItem', menuItem);
//   else
//     sessionStorage.removeItem('nfcActiveMenuItem');
// }

// Hit Points (HP)

// HP Get-functions

export const getCharacterHP = () =>
  parseInt(localStorage.getItem('nfcCharacterHP'));
  // parseInt(localStorage.getItem('nfcCharacterHP') || `${CHARACTER_HP}`);

export const getEnemyHP = () =>
  parseInt(localStorage.getItem('nfcEnemyHP'));
  // parseInt(localStorage.getItem('nfcEnemyHP') || `${getSelectedEnemyHP()}`);

export function setCharacterHP(hp) {
  // if (hp)
    localStorage.setItem('nfcCharacterHP', String(hp));
  // else
  //   localStorage.setItem('nfcCharacterHP', `${CHARACTER_HP}`);
  
  nfcBus('nfc-state', { detail: `character HP changed: hp: ${hp}` });
}

export function setEnemyHP(hp) {
  localStorage.setItem('nfcEnemyHP', String(hp));
  // else
  //   localStorage.setItem('nfcEnemyHP', `${DEFAULT_ENEMY_HP}`);

  nfcBus('nfc-state', { detail: `enemy HP changed: hp: ${hp}` });
}

// Critical Hits (CH)

// CH Get-functions

export const getCharacterCH = () =>
  parseInt(localStorage.getItem('nfcCharacterCH') || `${DEFAULT_CHARACTER_CH}`);

export const getEnemyCH = () =>
  parseInt(localStorage.getItem('nfcEnemyCH') || `${ENEMY_CRITICAL_HITS[getSelectedEnemyName()] || DEFAULT_ENEMY_CH}`);

// CH Set-functions

export function setCharacterCH(count) {
    localStorage.setItem('nfcCharacterCH', String(count));
  // else
  //   localStorage.setItem('nfcCharacterCH', `${DEFAULT_CHARACTER_CH}`);

  nfcBus('nfc-state', { detail: `character CH changed: ${count}` });
}

export function setEnemyCH(count) {
  // if (count)
    localStorage.setItem('nfcEnemyCH', String(count));
  // else
  //   localStorage.setItem('nfcEnemyCH', `${ENEMY_CRITICAL_HITS[getSelectedEnemyName()] || DEFAULT_ENEMY_CH}`);

  nfcBus('nfc-state', { detail: `enemy CH changed: ${count}` });
}

// Double Hits (DH)

// DH Get-functions

export const getCharacterDH = () =>
  parseInt(localStorage.getItem('nfcCharacterDH') || `${DEFAULT_CHARACTER_DH}`);

export const getEnemyDH = () =>
  parseInt(localStorage.getItem('nfcEnemyDH') || `${DEFAULT_ENEMY_DH}`);

// DH Set-functions

export function setCharacterDH(count) {
  // if (count)
    localStorage.setItem('nfcCharacterDH', String(count));
  // else
  //   localStorage.setItem('nfcCharacterDH', `${DEFAULT_CHARACTER_DH}`);

  nfcBus('nfc-state', { detail: `character DH changed: ${count}` });
}

export function setEnemyDH(count) {
  // if (count)
    localStorage.setItem('nfcEnemyDH', String(count));
  // else
  //   localStorage.setItem('nfcEnemyDH', `${DEFAULT_ENEMY_DH}`);

  nfcBus('nfc-state', { detail: `enemy DH changed: ${count}` });
}
