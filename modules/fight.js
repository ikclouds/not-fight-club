// fight.js

/**
* About: This module handles the fight mechanics, including attack and defense logic.
*/


import {
  ATTACK_TIMEOUT,
  BLOCKED_CRITICAL_DAMAGE,
  CHARACTER_HP,
  CRITICAL_DAMAGE,
  CRITICAL_HIT_CHANCE,
  DEFAULT_CHARACTER_CH,
  DEFAULT_CHARACTER_DH,
  DOUBLE_HIT_CHANCE,
  ENEMY_CRITICAL_HITS,
  ENEMY_DOUBLE_HITS,
  FIGHT_ZONES,
  NORMAL_DAMAGE,
  REQUIRED_ATTACK_ZONES,
  REQUIRED_DEFENSE_ZONES
} from './config.js';

import { nfcBus } from './events.js';

import {
  getCharacterCH,
  getCharacterDH,
  getCharacterHP,
  getCharacterScores,
  getCurrentCharacter,
  getEnemyCH,
  getEnemyDH,
  getEnemyHP,
  getSelectedEnemyHP,
  getSelectedEnemyName,
  setBattleState,
  setCharacterCH,
  setCharacterDH,
  setCharacterHP,
  setEnemyCH,
  setEnemyDH,
  setEnemyHP,
  updateCharacterScore,
  getBattleState,
  getRandomEnemyEnabled,
  getEnemies,
  setSelectedEnemy
} from './state.js';

import {
  addLogEntry
} from './logging.js';

import {
  attackButton,
  checkLoginState,
  hideBattleUI,
  updateCriticalHitDisplay,
  updateDoubleHitDisplay,
  updateHPDisplays
} from './ui-fight.js';

import {
  populateScoreForm,
  showForm,
  scoreForm
} from './ui-forms.js';


// Export battle functions
export {
  endBattle,
  checkBattleEnd,
  getSelectedAttackZone,
  initFight,
  initializeZoneSelection,
  processAttack,
};

/**
* Initialization
*/

// Init helpers
function initFight() {
  checkLoginState();
}


/**
 * Attack and Defense zone selection
 */

// Get selected defense zones
function getSelectedDefenseZones() {
  return checkedPlayerDefenseZones;
}

// 
const checkedPlayerDefenseZones = [];

// Validate defense selection (only required number allowed)
function validateDefenseSelection(e) {
  if (e.target.checked)
    checkedPlayerDefenseZones.push(e.target.value);
  else
    checkedPlayerDefenseZones.pop();
  let checkedCount = checkedPlayerDefenseZones.length;

  // If more than required are checked, uncheck the first one
  if (checkedCount > REQUIRED_DEFENSE_ZONES) {
    const firstCheckedID = checkedPlayerDefenseZones[0];
    const firstChecked = document.getElementById(`defense-${firstCheckedID.toLowerCase()}`);
    firstChecked.checked = false;
    checkedPlayerDefenseZones.shift();
    checkedCount = checkedPlayerDefenseZones.length;
  }

  // Make sure exactly required defense zones are selected
  attackButton.disabled = checkedCount !== REQUIRED_DEFENSE_ZONES ||
    getSelectedAttackZone() === null ||
    getBattleState() !== 'active';
}

// Validate attack selection (only one allowed)
function validateAttackSelection(e) {
  const attackCheckboxes = document.querySelectorAll('input[name="attack"]');
  let checkedCount = 0;

  attackCheckboxes.forEach(checkbox => {
    if (checkbox !== e.target && e.target.checked) {
      checkbox.checked = false;
    }
    if (checkbox.checked) {
      checkedCount++;
    }
  });

  // Make sure at least one attack zone is selected
  attackButton.disabled = checkedCount !== REQUIRED_ATTACK_ZONES ||
    getSelectedDefenseZones().length !== REQUIRED_DEFENSE_ZONES ||
    getBattleState() !== 'active';
}

// Zone selection initializer
function initializeZoneSelection() {
  const attackCheckboxes = document.querySelectorAll('input[name="attack"]');
  const defenseCheckboxes = document.querySelectorAll('input[name="defense"]');

  // Clear all selections and remove any existing event listeners
  attackCheckboxes.forEach(checkbox => {
    checkbox.checked = false;
    checkbox.removeEventListener('change', validateAttackSelection);
    checkbox.addEventListener('change', validateAttackSelection);
  });

  defenseCheckboxes.forEach(checkbox => {
    checkbox.checked = false;
    checkbox.removeEventListener('change', validateDefenseSelection);
    checkbox.addEventListener('change', validateDefenseSelection);
  });

  // Attack button is initially disabled but clickable
  if (attackButton) {
    attackButton.disabled = true;
  } else {
    console.error("Attack button not found in the DOM");
  }
  nfcBus('nfc-fight', { detail: `Zone selection initialized` });
}


/**
* Attack processing
*/

// Generate random zones for enemy
function getRandomEnemyZones() {
  const zones = FIGHT_ZONES;
  const attackZone = zones[Math.floor(Math.random() * zones.length)];

  // For defense zones, select 2 unique zones
  const availableDefenseZones = zones.filter(zone => zone !== attackZone);
  const shuffled = availableDefenseZones.sort(() => 0.5 - Math.random());
  const defenseZones = shuffled.slice(0, REQUIRED_DEFENSE_ZONES);

  nfcBus('nfc-fight', { detail: `Random enemy zones generated: ${JSON.stringify({ attack: attackZone, defense: defenseZones })}` });
  return {
    attack: attackZone,
    defense: defenseZones
  };
}

// Get selected attack zone
function getSelectedAttackZone() {
  const attackCheckboxes = document.querySelectorAll('input[name="attack"]');
  for (let checkbox of attackCheckboxes) {
    if (checkbox.checked) {
      return checkbox.value;
    }
  }
  return null;
}

// Attack processing function to handle double hits
function processAttack(isPlayerAttacking = true) {
  if (isPlayerAttacking) {
    const playerAttackZone = getSelectedAttackZone();
    if (playerAttackZone === null) {
      addLogEntry('You must select an attack zone!', 'result');
      return;
    }

    const playerDefenseZones = getSelectedDefenseZones();
    const enemyZones = getRandomEnemyZones();

    // Check if player gets a double hit
    let doubleHit = false;
    const characterDH = getCharacterDH();

    if (characterDH === -1 || (characterDH > 0 && Math.random() < DOUBLE_HIT_CHANCE)) {
      doubleHit = true;
      if (characterDH > 0) {
        setCharacterDH(characterDH - 1);
        updateDoubleHitDisplay();
      }
    }

    // Process player's first attack
    processPlayerAttack(playerAttackZone, enemyZones.defense);

    // If double hit and enemy still alive, do a second attack
    const enemyHP = getEnemyHP();
    if (doubleHit && enemyHP > 0) {
      setTimeout(() => {
        // Get new enemy defense zones for second attack
        const newEnemyZones = getRandomEnemyZones();
        processPlayerAttack(playerAttackZone, newEnemyZones.defense);

        // Continue with enemy attack if enemy still alive
        const updatedEnemyHP = getEnemyHP();
        if (updatedEnemyHP > 0) {
          setTimeout(() => {
            processEnemyAttackWithDoubleHit(playerDefenseZones);
          }, ATTACK_TIMEOUT);
        } else {
          endBattle(`<span class="log_damage">${getCurrentCharacter()}</span> defeated ${getSelectedEnemyName()}`);
        }
      }, ATTACK_TIMEOUT);
    } else {
      // Check if enemy is still alive before enemy attacks
      if (enemyHP > 0) {
        setTimeout(() => {
          processEnemyAttackWithDoubleHit(playerDefenseZones);
        }, ATTACK_TIMEOUT);
      } else {
        endBattle(`<span class="log_damage">${getCurrentCharacter()}</span> defeated ${getSelectedEnemyName()}`);
      }
    }
  }
}


/**
* Enemy attack
*/

// Handle one enemy's attack
function processEnemyAttack(attackZone, playerDefenseZones) {
  nfcBus('nfc-fight', { detail: `Enemy attacks zone: ${attackZone}` });
  nfcBus('nfc-fight', { detail: `Player defense zones: ${JSON.stringify(playerDefenseZones)}` });
  const characterName = getCurrentCharacter();
  const enemyName = getSelectedEnemyName();
  let damage = NORMAL_DAMAGE; // Default normal damage
  let isCritical = false;

  // Check for critical hit
  const enemyCH = getEnemyCH();
  if (enemyCH > 0 && Math.random() < CRITICAL_HIT_CHANCE) {
    isCritical = true;
    setEnemyCH(enemyCH - 1); // Reduce critical hit counter
    updateCriticalHitDisplay();
  }

  // Check if attack was defended
  if (playerDefenseZones.includes(attackZone)) {
    // Attack defended
    if (isCritical) {
      // Critical hit on a defended zone - deals half damage
      damage = BLOCKED_CRITICAL_DAMAGE;
      const characterHP = getCharacterHP();
      const newCharacterHP = Math.max(0, characterHP - damage);
      setCharacterHP(newCharacterHP);

      addLogEntry(`<span class="log_enemy_attack log_fighter">${enemyName.toUpperCase()}</span> delivered a <span class="critical-hit">CRITICAL HIT</span> to ` +
        `<span class="log_fighter">${characterName.toLocaleUpperCase()}</span>'s <span class="log_fighter">${attackZone}</span> ` +
        `but it was partially blocked, dealing <span class="log_damage">${damage} damage</span>.`, 'enemy-attack');

      nfcBus('nfc-fight', { detail: `Enemy attack on ${characterName}'s ${attackZone} was partially blocked, dealing ${damage} critical damage.` });
    } else {
      // Normal hit on defended zone - no damage
      addLogEntry(`<span class="log_enemy_attack log_fighter">${enemyName.toUpperCase()}</span> attacked ` +
        `<span class="log_fighter">${characterName.toLocaleUpperCase()}</span>'s <span class="log_fighter">${attackZone}</span> ` +
        `but <span class="log_fighter">${characterName.toLocaleUpperCase()}</span> was able to protect ` +
        `his <span class="log_fighter">${attackZone}</span>.`, 'enemy-attack');

      nfcBus('nfc-fight', { detail: `Enemy attack on ${characterName}'s ${attackZone} was blocked.` });
    }
  } else {
    // Attack successful
    if (isCritical) {
      // Critical hit - 1.5x damage
      damage = CRITICAL_DAMAGE;
    }

    const characterHP = getCharacterHP();
    const newCharacterHP = Math.max(0, characterHP - damage);
    setCharacterHP(newCharacterHP);

    const hitType = isCritical ? '<span class="critical-hit">CRITICAL HIT</span>' : 'hit';

    addLogEntry(`<span class="log_enemy_attack log_fighter">${enemyName.toUpperCase()}</span> delivered a ${hitType} to ` +
      `<span class="log_fighter">${characterName.toLocaleUpperCase()}</span>'s <span class="log_fighter">${attackZone}</span> ` +
      `and dealt <span class="log_damage">${damage} damage</span>.`, 'enemy-attack');

    nfcBus('nfc-fight', { detail: `Enemy attack on ${characterName}'s ${attackZone} was successful, dealing ${damage} ${isCritical ? 'critical' : 'normal'} damage.` });
  }
  updateHPDisplays();
}

// Handle enemy attack with one or double hit
function processEnemyAttackWithDoubleHit(playerDefenseZones) {
  // Check if enemy gets a double hit
  let doubleHit = false;
  const zones = FIGHT_ZONES;
  const enemyDH = getEnemyDH();

  if (enemyDH === -1 || (enemyDH > 0 && Math.random() < DOUBLE_HIT_CHANCE)) {
    doubleHit = true;
    if (enemyDH > 0) {
      setEnemyDH(enemyDH - 1);
      updateDoubleHitDisplay();
    }
  }

  // Process enemy's first attack
  const newAttackZone = zones[Math.floor(Math.random() * zones.length)];
  processEnemyAttack(newAttackZone, playerDefenseZones);

  // If double hit and character still alive, do a second attack
  const characterHP = getCharacterHP();
  if (doubleHit && characterHP > 0) {
    setTimeout(() => {
      // Get attack zone for second attack
      const newAttackZone = zones[Math.floor(Math.random() * zones.length)];

      processEnemyAttack(newAttackZone, playerDefenseZones);

      checkBattleEnd();
    }, ATTACK_TIMEOUT);
  } else {
    checkBattleEnd();
  }
}


/**
* Player attack
*/

// Process player's attack - Update for critical hits
function processPlayerAttack(attackZone, enemyDefenseZones) {
  nfcBus('nfc-fight', { detail: `Player attacks zone: ${attackZone}` });
  nfcBus('nfc-fight', { detail: `Enemy defense zones: ${JSON.stringify(enemyDefenseZones)}` });
  const characterName = getCurrentCharacter();
  const enemyName = getSelectedEnemyName();
  let damage = NORMAL_DAMAGE; // Default normal damage
  let isCritical = false;

  // Check for critical hit
  const characterCH = getCharacterCH();
  if (characterCH > 0 && Math.random() < CRITICAL_HIT_CHANCE) {
    isCritical = true;
    setCharacterCH(characterCH - 1); // Reduce critical hit counter
    updateCriticalHitDisplay();
  }

  // Add defensive check for null attack zone
  if (!attackZone) {
    console.error("Attack zone is null in processPlayerAttack");
    addLogEntry(`<span class="log_fighter">${characterName.toUpperCase}</span> failed to attack! No target selected.`, 'result');
    return;
  }

  // Check if attack was defended
  if (enemyDefenseZones.includes(attackZone)) {
    // Attack defended
    if (isCritical) {
      // Critical hit on a defended zone - deals half damage
      damage = BLOCKED_CRITICAL_DAMAGE;
      const enemyHP = getEnemyHP();
      const newEnemyHP = Math.max(0, enemyHP - damage);
      setEnemyHP(newEnemyHP);

      addLogEntry(`<span class="log_fighter">${characterName.toUpperCase()}</span> delivered a <span class="critical-hit">CRITICAL HIT</span> to ` +
        `<span class="log_fighter">${enemyName.toUpperCase()}</span>'s <span class="log_fighter">${attackZone}</span> ` +
        `but it was partially blocked, dealing <span class="log_damage">${damage} damage</span>.`, 'player-attack');

      nfcBus('nfc-fight', { detail: `Player attack on ${enemyName}'s ${attackZone} was partially blocked, dealing ${damage} critical damage.` });
    } else {
      // Normal hit on defended zone - no damage
      addLogEntry(`<span class="log_fighter">${characterName.toUpperCase()}</span> attacked ` +
        `<span class="log_fighter">${enemyName.toUpperCase()}</span>'s <span class="log_fighter">${attackZone}</span> ` +
        `but <span class="log_fighter">${enemyName.toUpperCase()}</span> was able to protect his <span class="log_fighter">${attackZone}</span>.`, 'player-attack');

      nfcBus('nfc-fight', { detail: `Player attack on ${enemyName}'s ${attackZone} was blocked.` });
    }
  } else {
    // Attack successful
    if (isCritical) {
      // Critical hit - 1.5x damage
      damage = CRITICAL_DAMAGE;
    }

    const enemyHP = getEnemyHP();
    const newEnemyHP = Math.max(0, enemyHP - damage);
    setEnemyHP(newEnemyHP);

    const hitType = isCritical ? '<span class="critical-hit">CRITICAL HIT</span>' : 'hit';

    addLogEntry(`<span class="log_fighter">${characterName.toUpperCase()}</span> delivered a ${hitType} to ` +
      `<span class="log_fighter">${enemyName.toUpperCase()}</span>'s <span class="log_fighter">${attackZone}</span> ` +
      `and dealt <span class="log_damage">${damage} damage</span>.`, 'player-attack');

    nfcBus('nfc-fight', { detail: `Player attack on ${enemyName}'s ${attackZone} was successful, dealing ${damage} ${isCritical ? 'critical' : 'normal'} damage.` });
  }
  updateHPDisplays();
}


/**
* End battle
*/

// Check if battle has ended
function checkBattleEnd() {
  const characterHP = getCharacterHP();
  const enemyHP = getEnemyHP();

  if (characterHP <= 0) {
    // Player lost
    endBattle(`<span class="log_damage">${getSelectedEnemyName()}</span> defeated ${getCurrentCharacter()}`);
  } else if (enemyHP <= 0) {
    // Player won
    endBattle(`<span class="log_damage">${getCurrentCharacter()}</span> defeated ${getSelectedEnemyName()}`);
  }
}

// End battle and show results
function endBattle(resultMessage) {
  setBattleState('ended');

  // Get final HP values
  const characterName = getCurrentCharacter();
  const enemyName = getSelectedEnemyName();
  const characterHP = getCharacterHP();
  const enemyHP = getEnemyHP();
  const characterMaxHP = CHARACTER_HP;
  const enemyMaxHP = parseInt(getSelectedEnemyHP());
  let result = '';

  // Determine result and update character score
  if (characterHP > 0 && enemyHP <= 0) {
    // Character won
    updateCharacterScore(characterName, 'Win');
    result = `${characterName} has won the battle`;
  } else if (characterHP <= 0 && enemyHP > 0) {
    // Character lost or it's a draw (both died)
    updateCharacterScore(characterName, 'Loss');
    result = `${characterName} has lost the battle`;
  } else if (characterHP > enemyHP) {
    // Character won
    updateCharacterScore(characterName, 'Win');
    result = `${characterName} has won the battle`;
  } else if (characterHP < enemyHP) {
    // Character lost
    updateCharacterScore(characterName, 'Loss');
    result = `${characterName} has lost the battle`;
  } else {
    // It's a draw
    result = `The battle ended in a draw`;
  }

  addLogEntry(result, 'result');
  if (!resultMessage) {
    resultMessage = result;
  }

  // Add HP summary to log
  addLogEntry(`Final HP - ${characterName}: ${characterHP}/${characterMaxHP}, ${enemyName}: ${enemyHP}/${enemyMaxHP}`, 'result');

  // Display character's score
  const scores = getCharacterScores();
  const characterScore = scores[characterName] || { Win: '0', Loss: '0' };
  addLogEntry(`${characterName}'s record: ${characterScore.Win} wins, ${characterScore.Loss} losses`, 'result');

  // Reset HP values for next battle
  setCharacterHP(characterMaxHP);
  setEnemyHP(enemyMaxHP);

  // Reset critical hits and double hits for next battle
  setCharacterCH(DEFAULT_CHARACTER_CH);
  setCharacterDH(DEFAULT_CHARACTER_DH);

  const selectedEnemyName = getSelectedEnemyName();
  setEnemyCH(ENEMY_CRITICAL_HITS[selectedEnemyName] || 1);
  setEnemyDH(ENEMY_DOUBLE_HITS[selectedEnemyName] || 0);

  // Check if random enemy is enabled and select a new enemy if it is
  if (getRandomEnemyEnabled()) {
    selectRandomEnemy();
  }

  hideBattleUI();
  addLogEntry('Press Fight to start a new battle', 'result');
  nfcBus('nfc-fight', { detail: `Press Fight to start a new battle` });

  const currentCharacter = getCurrentCharacter();
  const scoreTitle = document.querySelector('.score_title');
  scoreTitle.innerHTML = resultMessage;
  populateScoreForm(currentCharacter);
  showForm(scoreForm, '.form__close');
}

// Helper function to select a random enemy
function selectRandomEnemy() {
  const enemies = getEnemies();
  const enemyNames = Object.keys(enemies);

  // Select a random enemy
  const randomIndex = Math.floor(Math.random() * enemyNames.length);
  const randomEnemyName = enemyNames[randomIndex];
  const randomEnemyHP = enemies[randomEnemyName];

  // Set the selected enemy
  setSelectedEnemy(randomEnemyName, randomEnemyHP);

  nfcBus('nfc-fight', { detail: `Random enemy selected: ${randomEnemyName}` });
}
