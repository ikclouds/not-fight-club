// events.js

// About: This module handles all event-related functionality, including event listeners and event dispatching.

export { initEvents, nfcBus, offNfcBus};

let nfcEventTarget;

function nfcBus(type, detail) {
  nfcEventTarget.dispatchEvent(new CustomEvent(type, { detail }));
}

function onNfcBus(type, handler) {
  nfcEventTarget.addEventListener(type, handler);
}

function offNfcBus(type, handler) {
  nfcEventTarget.removeEventListener(type, handler);
}

function initEvents() {
  nfcEventTarget = new EventTarget();

  onNfcBus('nfc-events', (e) => {
    console.log(e.type, e.detail);
  });

  onNfcBus('nfc-logging', (e) => {
    console.log(e.type, e.detail);
  });

  onNfcBus('nfc-state', (e) => {
    console.log(e.type, e.detail);
  });

  onNfcBus('nfc-ui-forms', (e) => {
    console.log(e.type, e.detail);
  });

  onNfcBus('nfc-ui-fight', (e) => {
    console.log(e.type, e.detail);
  });

  onNfcBus('nfc-fight', (e) => {
    console.log(e.type, e.detail);
  });

  nfcBus('nfc-events', { detail: 'Event Bus initialized' });
  nfcBus('nfc-logging', { detail: 'Logging Event Bus initialized' });
  nfcBus('nfc-state', { detail: 'State Event Bus initialized' });
  nfcBus('nfc-ui-forms', { detail: 'UI Forms Event Bus initialized' });
  nfcBus('nfc-ui-fight', { detail: 'UI Fight Event Bus initialized' });
  nfcBus('nfc-fight', { detail: 'UI Fight Event Bus initialized' });
}
