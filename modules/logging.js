// logging.js

// About: This module handles game logging throughout the application.

export { initLogging, addLogEntry, logContainer };

import { nfcBus } from './events.js';

const logContainer = document.querySelector('.log-container');

function initLogging() {
  nfcBus('nfc-logging', { detail: 'Logging initialized' });
}

// Add entry to battle log
function addLogEntry(message, className = '') {
  const logEntry = document.createElement('div');
  logEntry.className = `log-entry ${className}`;
  logEntry.innerHTML = message;

  logContainer.appendChild(logEntry);
  logContainer.scrollTop = logContainer.scrollHeight;
}
