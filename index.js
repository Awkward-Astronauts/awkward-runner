import { loadGame } from './src/game.js';
import './style.css';

document.fonts.load('1rem "04B30"').then(() => {
  loadGame();
});
