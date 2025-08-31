// index.js

/**
 * About: Main entry point for the Not Fight Club application.
 */


import { initEvents } from './modules/events.js';
import { initLogging } from './modules/logging.js';
import { initMenu } from './modules/menu.js';
import { initFight } from './modules/fight.js';
import { initState } from './modules/state.js';


document.addEventListener('DOMContentLoaded', function () {
  initEvents();
  initState();
  initLogging();
  initMenu();
  initFight();
});
