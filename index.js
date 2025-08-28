document.addEventListener('DOMContentLoaded', function () {
  // Form defaults
  const formCloseTimeout = 1000;
  const fightTimeout = 200;
  // Burger menu
  const burgerWidth = 1440; // Width threshold for burger menu

  // Combat settings
  const REQUIRED_ATTACK_ZONES = 1;
  const REQUIRED_DEFENSE_ZONES = 2;

  // Critical hit settings
  const DEFAULT_CHARACTER_CH = 3;
  const ENEMY_CRITICAL_HITS = {
    'Spacemarine': 1,
    'Snowtroll': 3,
    'Spider': 1
  };
  const NORMAL_DAMAGE = 10;
  const CRITICAL_DAMAGE = 15;
  const BLOCKED_CRITICAL_DAMAGE = 5;
  const CRITICAL_HIT_CHANCE = 0.3; // 30% chance for a critical hit

  // Double hit settings
  const DEFAULT_CHARACTER_DH = 0;
  const ENEMY_DOUBLE_HITS = {
    'Spacemarine': 0,
    'Snowtroll': 0,
    'Spider': -1 // -1 means all hits are double
  };
  const DOUBLE_HIT_CHANCE = 0.2; // 20% chance for a double hit

  // Burger menu
  const burgerMenu = document.querySelector('.navigation__burger');
  const menu = document.querySelector('.navigation__menu');
  const overlay = document.querySelector('.page__overlay');
  const menuLinks = document.querySelectorAll('.navigation__link');
  const activeItemDisplay = document.querySelector('.navigation__active-item');

  // Initialize the application
  initLocalStorage();
  checkLoginState();

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

  function closeFormsOnResize() {
    if (window.innerWidth > burgerWidth) {
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

  // Smooth scrolling for menu items
  menuLinks.forEach(link => {
    link.addEventListener('click', function (e) {
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
        sessionStorage.removeItem('nfcCurrentCharacter');
        battleInterface.classList.add('hidden');
        battleControls.classList.add('hidden');
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
    console.log('Loaded enemies:', enemies); 
    return enemies;
  }

  function getSelectedEnemyName() {
    return localStorage.getItem('nfcSelectedEnemyName') || 'Spacemarine';
  }

  function getSelectedEnemyHP() {
    return localStorage.getItem('nfcSelectedEnemyHP');
  }

  function setSelectedEnemy(name, hp) {
    localStorage.setItem('nfcSelectedEnemyName', name);
    localStorage.setItem('nfcSelectedEnemyHP', hp.toString());

    // Reset critical hits and double hits for the new enemy
    setEnemyCH(ENEMY_CRITICAL_HITS[name] || 1);
    setEnemyDH(ENEMY_DOUBLE_HITS[name] || 0);

    // Update enemy in battle interface if it's visible
    updateEnemyInBattleInterface(name, hp);
    updateCriticalHitDisplay();
    updateDoubleHitDisplay();
  }

  // Function to update enemy in battle interface when it's changed
  function updateEnemyInBattleInterface(enemyName, enemyMaxHP) {
    const battleInterface = document.querySelector('.battle-interface');
    if (battleInterface && !battleInterface.classList.contains('hidden')) {
      // Update enemy name and image
      document.querySelector('.enemy-name').textContent = enemyName;
      document.querySelector('.enemy-image').src = `./assets/img/enemy/${enemyName.toLowerCase().replace(' ', '_')}.png`;

      // Update enemy HP display and bar
      const currentEnemyHP = getEnemyHP();

      // If the battle hasn't started yet or if we're switching to a new enemy,
      // reset the enemy's HP to its maximum
      if (sessionStorage.getItem('nfcBattleState') !== 'active') {
        setEnemyHP(enemyMaxHP);
        document.querySelector('.enemy-hp-text').textContent = `${enemyMaxHP}/${enemyMaxHP}`;
        document.querySelector('.enemy-hp-bar').style.width = '100%';
        document.querySelector('.enemy-hp-bar').classList.remove('low');
      } else {
        // If battle is active, maintain the current HP percentage relative to the new max
        const hpPercentage = Math.min(1, currentEnemyHP / parseInt(getSelectedEnemyHP()));
        const newHP = Math.round(hpPercentage * enemyMaxHP);
        setEnemyHP(newHP);

        // Update HP display
        updateHPDisplays();
      }

      // Add log entry about enemy change if battle has started
      if (sessionStorage.getItem('nfcBattleState') === 'active' ||
        sessionStorage.getItem('nfcBattleState') === 'paused') {
        addLogEntry(`Enemy changed to ${enemyName}!`, 'result');
      }
    }
  }

  function getCharacterHP() {
    return parseInt(localStorage.getItem('nfcCharacterHP'));
  }

  function getEnemyHP() {
    return parseInt(localStorage.getItem('nfcEnemyHP'));
  }

  function setCharacterHP(hp) {
    localStorage.setItem('nfcCharacterHP', hp.toString());
  }

  function setEnemyHP(hp) {
    localStorage.setItem('nfcEnemyHP', hp.toString());
  }


  // Helper functions for critical hits
  function getCharacterCH() {
    return parseInt(localStorage.getItem('nfcCharacterCH'));
  }

  function getEnemyCH() {
    return parseInt(localStorage.getItem('nfcEnemyCH'));
  }

  function setCharacterCH(count) {
    localStorage.setItem('nfcCharacterCH', count.toString());
  }

  function setEnemyCH(count) {
    localStorage.setItem('nfcEnemyCH', count.toString());
  }

  function getMaxEnemyCH(enemyName) {
    return ENEMY_CRITICAL_HITS[enemyName] || 1;
  }

  // Helper functions for double hits
  function getCharacterDH() {
    return parseInt(localStorage.getItem('nfcCharacterDH'));
  }

  function getEnemyDH() {
    return parseInt(localStorage.getItem('nfcEnemyDH'));
  }

  function setCharacterDH(count) {
    localStorage.setItem('nfcCharacterDH', count.toString());
  }

  function setEnemyDH(count) {
    localStorage.setItem('nfcEnemyDH', count.toString());
  }

  function getMaxEnemyDH(enemyName) {
    return ENEMY_DOUBLE_HITS[enemyName] || 0;
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
        'Spider': 90
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

    // Initialize critical hit storage
    if (!localStorage.getItem('nfcCharacterCH')) {
      localStorage.setItem('nfcCharacterCH', DEFAULT_CHARACTER_CH.toString());
    }

    if (!localStorage.getItem('nfcEnemyCH')) {
      const selectedEnemy = getSelectedEnemyName();
      const enemyCH = ENEMY_CRITICAL_HITS[selectedEnemy] || 1;
      localStorage.setItem('nfcEnemyCH', enemyCH.toString());
    }

    // Initialize double hit storage
    if (!localStorage.getItem('nfcCharacterDH')) {
      localStorage.setItem('nfcCharacterDH', DEFAULT_CHARACTER_DH.toString());
    }

    if (!localStorage.getItem('nfcEnemyDH')) {
      const selectedEnemy = getSelectedEnemyName();
      const enemyDH = ENEMY_DOUBLE_HITS[selectedEnemy] || 0;
      localStorage.setItem('nfcEnemyDH', enemyDH.toString());
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

  // Fight Start

  // Battle functionality
  const fightLink = document.querySelector('.fight-link');
  const battleInterface = document.querySelector('.battle-interface');
  const fightButton = document.querySelector('.fight-section__fight-button');
  const battleControls = document.querySelector('.battle-controls');
  const startButton = document.querySelector('.battle-start');
  const stopButton = document.querySelector('.battle-stop');
  const finishButton = document.querySelector('.battle-finish');
  const attackButton = document.querySelector('.attack-button');
  const logContainer = document.querySelector('.log-container');

  // Initialize battle UI
  function initializeBattle() {
    // Clear log container
    logContainer.innerHTML = '';

    // Hide fight button and show battle interface
    fightButton.parentElement.classList.add('hidden');
    battleInterface.classList.remove('hidden');
    battleControls.classList.remove('hidden');

    // Show start button, hide stop and finish buttons
    startButton.classList.remove('hidden');
    stopButton.classList.add('hidden');
    finishButton.classList.add('hidden');

    // Set up character info
    const currentCharacter = sessionStorage.getItem('nfcCurrentCharacter');
    const characterName = document.querySelector('.character-name');
    const characterImage = document.querySelector('.character-image');
    const characterHP = document.querySelector('.character-hp-text');
    const characterHPBar = document.querySelector('.character-hp-bar');

    characterName.textContent = currentCharacter;

    // Get character avatar
    const avatars = getCharacterAvatars();
    const characterAvatar = avatars[currentCharacter] || 'default.png';
    characterImage.src = `./assets/img/avatars/${characterAvatar}`;

    // Set up enemy info
    const enemyName = document.querySelector('.enemy-name');
    const enemyImage = document.querySelector('.enemy-image');
    const enemyHP = document.querySelector('.enemy-hp-text');
    const enemyHPBar = document.querySelector('.enemy-hp-bar');

    const selectedEnemyName = getSelectedEnemyName();
    enemyName.textContent = selectedEnemyName;
    enemyImage.src = `./assets/img/enemy/${selectedEnemyName.toLowerCase().replace(' ', '_')}.png`;

    // Reset HP and critical hits if not continuing a battle
    const characterMaxHP = 150;
    const enemyMaxHP = parseInt(getSelectedEnemyHP());
    const characterCurrentHP = getCharacterHP();
    const enemyCurrentHP = getEnemyHP();

    if (characterCurrentHP < characterMaxHP || enemyCurrentHP < enemyMaxHP) {
      addLogEntry('We continue the battle! Click Start!', 'result');
      sessionStorage.setItem('nfcBattleState', 'active');
      updateAttackButtonState();
    } else {
      // Reset critical hits and double hits for a new battle
      const selectedEnemyName = getSelectedEnemyName();
      setCharacterCH(DEFAULT_CHARACTER_CH);
      setEnemyCH(ENEMY_CRITICAL_HITS[selectedEnemyName] || 1);
      setCharacterDH(DEFAULT_CHARACTER_DH);
      setEnemyDH(ENEMY_DOUBLE_HITS[selectedEnemyName] || 0);

      // Clear battle log
      logContainer.innerHTML = '';
    }

    // Display critical hit and double hit counts
    updateCriticalHitDisplay();
    updateDoubleHitDisplay();

    // Update HP displays
    updateHPDisplays(characterMaxHP, enemyMaxHP);

    // Set battle state
    sessionStorage.setItem('nfcBattleState', 'ready');

    // Disable attack button initially
    attackButton.disabled = true;

    // Initialize attack and defense zone selection
    initializeZoneSelection();
  }

  // Start battle
  startButton.addEventListener('click', function () {
    sessionStorage.setItem('nfcBattleState', 'active');

    // Update UI
    document.querySelector('.battle-controls-panel').classList.remove('hidden');
    startButton.classList.add('hidden');
    stopButton.classList.remove('hidden');
    finishButton.classList.remove('hidden');

    // Update attack button state based on current selections
    updateAttackButtonState();

    // Add start message to log
    addLogEntry('Battle started!', 'result');
  });

  // Stop battle
  stopButton.addEventListener('click', function () {
    // Update battle state
    sessionStorage.setItem('nfcBattleState', 'paused');

    // Update UI
    stopButton.classList.add('hidden');
    startButton.classList.remove('hidden');

    // Disable attack button
    attackButton.disabled = true;

    // Add pause message to log
    addLogEntry('Battle paused!', 'result');
  });

  // Finish battle
  finishButton.addEventListener('click', function () {
    // End the battle
    endBattle('Player forfeited the match.');
  });

  // Function to update critical hit display
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

  // Function to update double hit display
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

  // Initialize zone selection - Fix event binding issues
  function initializeZoneSelection() {
    const attackCheckboxes = document.querySelectorAll('input[name="attack"]');
    const defenseCheckboxes = document.querySelectorAll('input[name="defense"]');

    // Clear all selections and remove any existing event listeners
    attackCheckboxes.forEach(checkbox => {
      checkbox.checked = false;
      // Remove existing listeners to prevent duplicates
      checkbox.removeEventListener('change', validateAttackSelection);
      // Add the event listener
      checkbox.addEventListener('change', validateAttackSelection);
    });

    defenseCheckboxes.forEach(checkbox => {
      checkbox.checked = false;
      // Remove existing listeners to prevent duplicates
      checkbox.removeEventListener('change', validateDefenseSelection);
      // Add the event listener
      checkbox.addEventListener('change', validateDefenseSelection);
    });

    // Ensure attack button is initially disabled but clickable
    if (attackButton) {
      attackButton.disabled = true;
    } else {
      console.error("Attack button not found in the DOM");
    }
  }

  // Validate attack selection (only one allowed) - Fix validation logic
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

    // Update attack button state
    updateAttackButtonState(checkedCount);
  }

  // Validate defense selection (only two allowed) - Fix validation logic
  function validateDefenseSelection(e) {
    const defenseCheckboxes = document.querySelectorAll('input[name="defense"]');
    let checkedCount = 0;

    defenseCheckboxes.forEach(checkbox => {
      if (checkbox.checked) {
        checkedCount++;
      }
    });

    // If more than required are checked, uncheck the last one
    if (checkedCount > REQUIRED_DEFENSE_ZONES) {
      e.target.checked = false; // Uncheck the one that was just clicked
      checkedCount = REQUIRED_DEFENSE_ZONES;
    }

    // Update attack button state
    updateAttackButtonState(null, checkedCount);
  }

  // Centralized function to update attack button state
  function updateAttackButtonState(attackCount = null, defenseCount = null) {
    // If values not provided, calculate them
    if (attackCount === null) {
      attackCount = document.querySelectorAll('input[name="attack"]:checked').length;
    }
    if (defenseCount === null) {
      defenseCount = document.querySelectorAll('input[name="defense"]:checked').length;
    }

    const battleState = sessionStorage.getItem('nfcBattleState');
    const attackZoneSelected = getSelectedAttackZone() !== null;
    const shouldBeEnabled = attackCount === REQUIRED_ATTACK_ZONES &&
      defenseCount === REQUIRED_DEFENSE_ZONES &&
      battleState === 'active' &&
      attackZoneSelected;

    if (attackButton) {
      attackButton.disabled = !shouldBeEnabled;
      if (!attackZoneSelected && attackCount === REQUIRED_ATTACK_ZONES) {
        console.log("Attack zone validation issue: zone selection not registering");
      }
    }
  }

  // Initialize zone selection
  function initializeZoneSelection() {
    const attackCheckboxes = document.querySelectorAll('input[name="attack"]');
    const defenseCheckboxes = document.querySelectorAll('input[name="defense"]');

    // Clear all selections
    attackCheckboxes.forEach(checkbox => {
      checkbox.checked = false;
      checkbox.addEventListener('change', validateAttackSelection);
    });

    defenseCheckboxes.forEach(checkbox => {
      checkbox.checked = false;
      checkbox.addEventListener('change', validateDefenseSelection);
    });
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
      sessionStorage.getItem('nfcBattleState') !== 'active';
  }

  // Validate defense selection (only required number allowed)
  function validateDefenseSelection() {
    const defenseCheckboxes = document.querySelectorAll('input[name="defense"]');
    let checkedCount = 0;

    defenseCheckboxes.forEach(checkbox => {
      if (checkbox.checked) {
        checkedCount++;
      }
    });

    // If more than required are checked, uncheck the last one
    if (checkedCount > REQUIRED_DEFENSE_ZONES) {
      // Find the last checked checkbox and uncheck it
      for (let i = defenseCheckboxes.length - 1; i >= 0; i--) {
        if (defenseCheckboxes[i].checked) {
          defenseCheckboxes[i].checked = false;
          break;
        }
      }
      checkedCount = REQUIRED_DEFENSE_ZONES;
    }

    // Make sure exactly required defense zones are selected
    attackButton.disabled = checkedCount !== REQUIRED_DEFENSE_ZONES ||
      getSelectedAttackZone() === null ||
      sessionStorage.getItem('nfcBattleState') !== 'active';
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

  // Get selected defense zones
  function getSelectedDefenseZones() {
    const defenseCheckboxes = document.querySelectorAll('input[name="defense"]');
    const selectedZones = [];

    defenseCheckboxes.forEach(checkbox => {
      if (checkbox.checked) {
        selectedZones.push(checkbox.value);
      }
    });

    return selectedZones;
  }

  // Generate random zones for enemy
  function getRandomEnemyZones() {
    const zones = ['Head', 'Neck', 'Body', 'Belly', 'Legs'];
    const attackZone = zones[Math.floor(Math.random() * zones.length)];

    // For defense zones, select 2 unique zones
    const availableDefenseZones = zones.filter(zone => zone !== attackZone);
    const shuffled = availableDefenseZones.sort(() => 0.5 - Math.random());
    const defenseZones = shuffled.slice(0, 2);

    return {
      attack: attackZone,
      defense: defenseZones
    };
  }

  // Attack button click handler
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

      // Process player's attack
      processAttack(true);

      // If enemy is still alive, process enemy's attack
      const enemyHP = getEnemyHP();
      if (enemyHP > 0) {
        // Short delay before enemy attacks
        setTimeout(() => {
          processEnemyAttackWithDoubleHit(enemyZones.attack, playerDefenseZones);
        }, fightTimeout);
      } else {
        // Player won
        endBattle(`${sessionStorage.getItem('nfcCurrentCharacter')} has defeated ${getSelectedEnemyName()}!`);
      }
    }
  });

  // Unified attack processing function to handle double hits
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
              processEnemyAttackWithDoubleHit(enemyZones.attack, playerDefenseZones);
            }, fightTimeout);
          } else {
            endBattle(`${sessionStorage.getItem('nfcCurrentCharacter')} has defeated ${getSelectedEnemyName()}!`);
          }
        }, fightTimeout);
      } else {
        // Check if enemy is still alive before enemy attacks
        if (enemyHP > 0) {
          setTimeout(() => {
            processEnemyAttackWithDoubleHit(enemyZones.attack, playerDefenseZones);
          }, fightTimeout);
        } else {
          endBattle(`${sessionStorage.getItem('nfcCurrentCharacter')} has defeated ${getSelectedEnemyName()}!`);
        }
      }
    }
  }

  // Handle enemy attack with potential double hit
  function processEnemyAttackWithDoubleHit(attackZone, playerDefenseZones) {
    // Check if enemy gets a double hit
    let doubleHit = false;
    const enemyDH = getEnemyDH();

    if (enemyDH === -1 || (enemyDH > 0 && Math.random() < DOUBLE_HIT_CHANCE)) {
      doubleHit = true;
      if (enemyDH > 0) {
        setEnemyDH(enemyDH - 1);
        updateDoubleHitDisplay();
      }
    }

    // Process enemy's first attack
    processEnemyAttack(attackZone, playerDefenseZones);

    // If double hit and character still alive, do a second attack
    const characterHP = getCharacterHP();
    if (doubleHit && characterHP > 0) {
      setTimeout(() => {
        // Get new attack zone for second attack
        const zones = ['Head', 'Neck', 'Body', 'Belly', 'Legs'];
        const newAttackZone = zones[Math.floor(Math.random() * zones.length)];

        processEnemyAttack(newAttackZone, playerDefenseZones);

        // Check if battle is over after second attack
        checkBattleEnd();
      }, fightTimeout);
    } else {
      // Check if battle is over
      checkBattleEnd();
    }
  }

  // Process player's attack - Update for critical hits
  function processPlayerAttack(attackZone, enemyDefenseZones) {
    const characterName = sessionStorage.getItem('nfcCurrentCharacter');
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
      } else {
        // Normal hit on defended zone - no damage
        addLogEntry(`<span class="log_fighter">${characterName.toUpperCase()}</span> attacked ` +
          `<span class="log_fighter">${enemyName.toUpperCase()}</span>'s <span class="log_fighter">${attackZone}</span> ` +
          `but <span class="log_fighter">${enemyName.toUpperCase()}</span> was able to protect his <span class="log_fighter">${attackZone}</span>.`, 'player-attack');
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

      // Update HP displays
      updateHPDisplays();
    }
  }

  // Process enemy's attack - Update for critical hits
  function processEnemyAttack(attackZone, playerDefenseZones) {
    const characterName = sessionStorage.getItem('nfcCurrentCharacter');
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
      } else {
        // Normal hit on defended zone - no damage
        addLogEntry(`<span class="log_enemy_attack log_fighter">${enemyName.toUpperCase()}</span> attacked ` +
          `<span class="log_fighter">${characterName.toLocaleUpperCase()}</span>'s <span class="log_fighter">${attackZone}</span> ` +
          `but <span class="log_fighter">${characterName.toLocaleUpperCase()}</span> was able to protect ` +
          `his <span class="log_fighter">${attackZone}</span>.`, 'enemy-attack');
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

      // Update HP displays
      updateHPDisplays();
    }
  }

  // Check if battle has ended
  function checkBattleEnd() {
    const characterHP = getCharacterHP();
    const enemyHP = getEnemyHP();

    if (characterHP <= 0) {
      // Player lost
      endBattle(`${getSelectedEnemyName()} has defeated ${sessionStorage.getItem('nfcCurrentCharacter')}!`);
    } else if (enemyHP <= 0) {
      // Player won
      endBattle(`${sessionStorage.getItem('nfcCurrentCharacter')} has defeated ${getSelectedEnemyName()}!`);
    }
  }

  // End battle - Update to reset critical hits
  function endBattle(resultMessage) {
    // Update battle state
    sessionStorage.setItem('nfcBattleState', 'ended');

    // Get final HP values
    const characterName = sessionStorage.getItem('nfcCurrentCharacter');
    const enemyName = getSelectedEnemyName();
    const characterHP = getCharacterHP();
    const enemyHP = getEnemyHP();
    const characterMaxHP = 150;
    const enemyMaxHP = parseInt(getSelectedEnemyHP());

    // Determine result and update character score
    if (characterHP > 0 && enemyHP <= 0) {
      // Character won
      updateCharacterScore(characterName, 'Win');
      addLogEntry(`${characterName} has Won the battle!`, 'result');
    } else if (characterHP <= 0 && enemyHP > 0) {
      // Character lost or it's a draw (both died)
      updateCharacterScore(characterName, 'Loss');
      addLogEntry(`${characterName} has Lost the battle.`, 'result');
    } else if (characterHP > enemyHP) {
      // Character won
      updateCharacterScore(characterName, 'Win');
      addLogEntry(`${characterName} has Won the battle!`, 'result');
    } else if (characterHP < enemyHP) {
      // Character lost
      updateCharacterScore(characterName, 'Loss');
      addLogEntry(`${characterName} has Lost the battle.`, 'result');
    } else {
      // It's a draw
      addLogEntry(`The battle ended in a draw.`, 'result');
      updateCharacterScore(characterName, 'Loss');
      addLogEntry(`${characterName} has Lost the battle.`, 'result');
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

    // Update UI - hide battle interface and show Fight button
    // showForm(scoreForm);
    // battleInterface.classList.add('hidden');
    // battleControls.classList.add('hidden');
    fightButton.parentElement.classList.remove('hidden');
    // attackButton.classList.add('hidden');
    document.querySelector('.battle-controls-panel').classList.add('hidden');

    // Hide battle control buttons
    hideBattleButtons();
    addLogEntry('Battle ended! Press Fight to start a new battle.', 'result');
  }

  function hideBattleButtons() {
    battleControls.classList.add('hidden');
    startButton.classList.add('hidden');
    stopButton.classList.add('hidden');
    finishButton.classList.add('hidden');
  }

  // Update HP displays
  function updateHPDisplays() {
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

  // Add entry to battle log
  function addLogEntry(message, className = '') {
    const logEntry = document.createElement('div');
    logEntry.className = `log-entry ${className}`;
    logEntry.innerHTML = message;

    logContainer.appendChild(logEntry);

    // Scroll to bottom
    logContainer.scrollTop = logContainer.scrollHeight;
  }

  // Fight link functionality
  fightLink.addEventListener('click', function (e) {
    e.preventDefault();
    // Initialize the fight
    initializeBattle();
  });

  // Handle fight button click
  document.querySelector('.fight-section__fight-button').addEventListener('click', function () {
    const currentCharacter = sessionStorage.getItem('nfcCurrentCharacter');
    if (!currentCharacter) {
      // User is not logged in, show login form
      showForm(loginForm);
    } else {
      // User is logged in, start the fight
      initializeBattle();
    }
  });

  function updateCharacterScore(characterName, result) {
    const scores = getCharacterScores();

    // Initialize character's score record if it doesn't exist
    if (!scores[characterName]) {
      scores[characterName] = {
        Win: '0',
        Loss: '0'
      };
    }

    // Increment the appropriate counter
    const currentValue = parseInt(scores[characterName][result]) || 0;
    scores[characterName][result] = (currentValue + 1).toString();

    // Save updated scores
    localStorage.setItem('nfcCharacterScore', JSON.stringify(scores));

    console.log(`Updated score for ${characterName}: ${JSON.stringify(scores[characterName])}`);
  }

  // Fight End

  // Form functionality

  const closeBtns = document.querySelectorAll('.form__close');

  // Close form buttons
  closeBtns.forEach(btn => {
    btn.addEventListener('click', function () {
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
  document.querySelector('.create-character-link').addEventListener('click', function (e) {
    e.preventDefault();
    document.querySelector('.create-name').value = document.querySelector('.login-name').value;
    document.querySelector('.create-password').value = document.querySelector('.login-password').value;
    showForm(createForm, '.create-name');
  });

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

    initializeBattle();
  });

  // Create character functionality
  const createForm = document.querySelector('.create-form');
  const createButton = document.querySelector('.create-button');
  const createMessage = document.querySelector('.create-message');

  createButton.addEventListener('click', function () {
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
  document.querySelector('.login-link').addEventListener('click', function (e) {
    e.preventDefault();

    const currentCharacter = sessionStorage.getItem('nfcCurrentCharacter');
    if (currentCharacter) {
      sessionStorage.removeItem('nfcCurrentCharacter');
      sessionStorage.removeItem('nfcActiveMenuItem');
    }
    checkLoginState();
  });

  // Settings functionality

  const settingsForm = document.querySelector('.settings-form');

  document.querySelector('.settings-link').addEventListener('click', function (e) {
    e.preventDefault();
    showForm(settingsForm, '.form__close');
  });

  // Score functionality

  const scoreForm = document.querySelector('.score-form');

  document.querySelector('.score-link').addEventListener('click', function (e) {
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

      // Set critical hit value
      document.querySelector('.edit-character-ch').value = getCharacterCH();

      // Set double hit value
      document.querySelector('.edit-character-dh').value = getCharacterDH();
    }
  }

  document.querySelector('.edit-character-button').addEventListener('click', function () {
    autoFillCharacterSettings();
    showForm(characterForm, '.edit-character-name');
  });

  document.querySelector('.avatar-edit-button').addEventListener('click', function () {
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

  document.querySelector('.character-save-button').addEventListener('click', function () {
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

  document.querySelector('.select-avatar-button').addEventListener('click', function () {
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

      selectButton.addEventListener('click', function () {
        selectAvatar(file);
      });

      avatarOption.appendChild(img);
      avatarOption.appendChild(selectButton);
      avatarsGrid.appendChild(avatarOption);
    });
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
        });

        selectButton.addEventListener('click', function (e) {
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
        enemyCard.appendChild(enemyCH);
        enemyCard.appendChild(enemyDH);

        enemiesGrid.appendChild(enemyCard);
      });
    } catch (error) {
      console.error('Error loading enemies:', error);
    }
  }

  const enemyForm = document.querySelector('.enemy-form');

  document.querySelector('.enemy-save-button').addEventListener('click', function () {
    enemyForm.classList.remove('active');
  });

  document.querySelector('.select-enemy-button').addEventListener('click', function () {
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
