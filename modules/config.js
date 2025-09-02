//  Config.js

// About: Configuration settings for the Not Fight Club application

// General settings
export const APP_NAME = 'Not Fight Club';
export const APP_VERSION = '1.0.0';

// Burger menu
export const BURGER_WIDTH = 1440; // Width threshold for burger menu

// Form defaults
export const FORM_CLOSE_TIMEOUT = 1000;
export const ATTACK_TIMEOUT = 200;

// Fight settings

// Zone requirements
export const FIGHT_ZONES = ['Head', 'Neck', 'Body', 'Belly', 'Legs'];
export const REQUIRED_ATTACK_ZONES = 1;
export const REQUIRED_DEFENSE_ZONES = 2;

// Health points (HP)
export const MAX_HEALTH = 100;
export const CHARACTER_HP = 150;
export const SPACEMARINE_HP = 170;
export const SNOWTROLL_HP = 150;
export const SPIDER_HP = 90;
export const DEFAULT_ENEMY_HP = `${SPACEMARINE_HP}`;

// Damage settings
export const NORMAL_DAMAGE = 10;
export const CRITICAL_DAMAGE = 15;
export const BLOCKED_CRITICAL_DAMAGE = 5;
export const CRITICAL_HIT_CHANCE = 0.3; // 30% chance for a critical hit
export const DOUBLE_HIT_CHANCE = 0.2;   // 20% chance for a double hit

// Character settings
// Sample avatar filenames
export const avatarFiles = [
  'avatar1.png',
  'avatar2.png',
  'avatar3.png',
  'avatar4.png',
  'avatar5.png'
];

// Enemy settings
export const DEFAULT_ENEMY_NAME = 'Spacemarine';

// Critical hit settings
export const DEFAULT_CHARACTER_CH = 3;
export const DEFAULT_ENEMY_CH = 1;
export const ENEMY_CRITICAL_HITS = {
  'Demort': 1,
  'Bellax': 3,
  'Lucis': 3,
  'Sevus': 3,
  'Draggo': 1,
  'Spider': 1
};

// Double hit settings
export const DEFAULT_CHARACTER_DH = 0;
export const DEFAULT_ENEMY_DH = 0;
export const ENEMY_DOUBLE_HITS = {
  'Demort': 0,
  'Bellax': 0,
  'Lucis': 0,
  'Sevus': 0,
  'Draggo': -1,
  'Spider': -1 // -1 means all hits are double
};
