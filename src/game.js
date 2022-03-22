import { AllocatorCharacterArray, Character, CharacterAllocator, CharacterMeta } from "./character.js";
import { layouts } from "./layouts.js";
import { applyVelocityToPosition, isCollided, Position, Velocity } from "./physics.js";
import { hiScoreRef, hiScoreValues} from "./firebase.js";
import {getHiScoreLayout, getInitialsInput} from "./htmlLayouts.js";
import { set } from 'firebase/database';
import backgroundAudio from '../assets/audio/neon blue.mp3';
import jumpAudio from '../assets/audio/jump.wav';
import * as assets from './assets.js';

const {
    stone_layout,
    themes,
    pit_layout,
    retry_layout,
    star_layout,
    aa_layout,
    alien_layout,
    rock_layout,
    moon_layout,
    meteor_layout
} = layouts;

const canvas = document.getElementById("board");
const canvas_ctx = canvas.getContext('2d');
const backgroundMusic = new Audio(backgroundAudio);
const jumpSoundEffect = new Audio(jumpAudio);
jumpSoundEffect.volume = 0.25;

const TABLET_MAX_SCREEN_WIDTH = 1024;
const MOBILE_MAX_SCREEN_WIDTH = 767;

const CELL_SIZE = 2;
const ROWS = window.innerHeight < 600 ? window.innerHeight : 600;
const COLUMNS = window.innerWidth <= TABLET_MAX_SCREEN_WIDTH ? window.innerWidth : window.innerWidth - 200;
const FLOOR_VELOCITY = COLUMNS > MOBILE_MAX_SCREEN_WIDTH ?
  new Velocity(0, -7) :
  new Velocity(0, -5);
let ROCK_MIN_GAP = COLUMNS > MOBILE_MAX_SCREEN_WIDTH ? 20 : 50;

const ASTRO_INITIAL_THRUST = new Velocity(-11, 0);
const ENVIRONMENT_GRAVITY = new Velocity(-0.6, 0);
const ASTRO_FLOOR_INITIAL_POSITION = new Position(ROWS - 100, 10);
let astro_current_thrust = new Velocity(0, 0);
let astro_ready_to_jump = true;
let gameOver = null;
let timeSinceGameOver = null;
let is_first_time = true;
let game_score = null;
let game_score_step = 0;
let step_velocity = new Velocity(0, -0.1);
let cumulative_velocity = null;
let current_theme = null;

let harmless_characters_pool = null;
let harmfull_characters_pool = null;

let harmless_character_allocator = [
    new CharacterAllocator(
        new AllocatorCharacterArray()
            .add_character(new CharacterMeta([moon_layout], 0, new Position(ROWS - 460, COLUMNS), new Velocity(0, -0.4)), 0.95)
        , 3000, 100
    ),
    new CharacterAllocator(
        new AllocatorCharacterArray()
            .add_character(new CharacterMeta([stone_layout.large], 0, new Position(ROWS - 60, COLUMNS), FLOOR_VELOCITY), 0.9)
            .add_character(new CharacterMeta([stone_layout.medium], 0, new Position(ROWS - 57, COLUMNS), FLOOR_VELOCITY), 0.75)
            .add_character(new CharacterMeta([stone_layout.small], 0, new Position(ROWS - 59, COLUMNS), FLOOR_VELOCITY), 0.6)
        , 2, 0
    ),
    new CharacterAllocator(
        new AllocatorCharacterArray()
            .add_character(new CharacterMeta([star_layout.small_s2], 0, new Position(ROWS - 495, COLUMNS), new Velocity(0, -0.3)), 0.9)
            .add_character(new CharacterMeta([star_layout.small_s1], 0, new Position(ROWS - 410, COLUMNS), new Velocity(0, -0.3)), 0.7)
            .add_character(new CharacterMeta([star_layout.small_s2], 0, new Position(ROWS - 335, COLUMNS), new Velocity(0, -0.3)), 0.5)
            .add_character(new CharacterMeta([star_layout.small_s1], 0, new Position(ROWS - 250, COLUMNS), new Velocity(0, -0.3)), 0.3)
            .add_character(new CharacterMeta([star_layout.small_s2], 0, new Position(ROWS - 200, COLUMNS), new Velocity(0, -0.3)), 0.15)
            .add_character(new CharacterMeta([star_layout.small_s1], 0, new Position(ROWS - 160, COLUMNS), new Velocity(0, -0.3)), 0.0)
        , 350, 0
    ),
    new CharacterAllocator(
        new AllocatorCharacterArray()
            .add_character(new CharacterMeta([star_layout.point], 0, new Position(ROWS - 550, COLUMNS), new Velocity(0, -0.1)), 0.9)
            .add_character(new CharacterMeta([star_layout.tiny], 0, new Position(ROWS - 525, COLUMNS), new Velocity(0, -0.05)), 0.8)
            .add_character(new CharacterMeta([star_layout.point], 0, new Position(ROWS - 465, COLUMNS), new Velocity(0, -0.1)), 0.7)
            .add_character(new CharacterMeta([star_layout.tiny], 0, new Position(ROWS - 420, COLUMNS), new Velocity(0, -0.05)), 0.6)
            .add_character(new CharacterMeta([star_layout.point], 0, new Position(ROWS - 380, COLUMNS), new Velocity(0, -0.1)), 0.5)
            .add_character(new CharacterMeta([star_layout.tiny], 0, new Position(ROWS - 355, COLUMNS), new Velocity(0, -0.05)), 0.4)
            .add_character(new CharacterMeta([star_layout.point], 0, new Position(ROWS - 290, COLUMNS), new Velocity(0, -0.1)), 0.3)
            .add_character(new CharacterMeta([star_layout.tiny], 0, new Position(ROWS - 225, COLUMNS), new Velocity(0, -0.05)), 0.2)
            .add_character(new CharacterMeta([star_layout.point], 0, new Position(ROWS - 185, COLUMNS), new Velocity(0, -0.1)), 0.1)
            .add_character(new CharacterMeta([star_layout.tiny], 0, new Position(ROWS - 110, COLUMNS), new Velocity(0, -0.05)), 0.0)
        , 25, 5
    ),
    new CharacterAllocator(
        new AllocatorCharacterArray()
            .add_character(new CharacterMeta([pit_layout.large], 0, new Position(ROWS - 77, COLUMNS), FLOOR_VELOCITY), 0.97)
            .add_character(new CharacterMeta([pit_layout.up], 0, new Position(ROWS - 73, COLUMNS), FLOOR_VELOCITY), 0.90)
            .add_character(new CharacterMeta([pit_layout.down], 0, new Position(ROWS - 70, COLUMNS), FLOOR_VELOCITY), 0.85)
        , 100, 50
    )
];

let harmfull_character_allocator = [
    new CharacterAllocator(
        new AllocatorCharacterArray()
            .add_character(new CharacterMeta([rock_layout.rock_short], 0, new Position(ROWS - 89, COLUMNS), FLOOR_VELOCITY), 0.5)
            .add_character(new CharacterMeta([rock_layout.rock_tall], 0, new Position(ROWS - 105, COLUMNS), FLOOR_VELOCITY), 0.0)
        , ROCK_MIN_GAP, 100
    ),
    new CharacterAllocator(
        new AllocatorCharacterArray()
            .add_character(new CharacterMeta([alien_layout], 0, new Position(ROWS - 110, COLUMNS), FLOOR_VELOCITY.clone().add(new Velocity(0, -1))), 0.95)
            .add_character(new CharacterMeta([alien_layout], 0, new Position(ROWS - 130, COLUMNS), FLOOR_VELOCITY.clone().add(new Velocity(0, -2))), 0.7)
        , 2000, 50
    ),
    new CharacterAllocator(
        new AllocatorCharacterArray()
            .add_character(new CharacterMeta([meteor_layout], 0, new Position(ROWS - 190, COLUMNS), FLOOR_VELOCITY.clone().add(new Velocity(0, -5))), 0.8)
            .add_character(new CharacterMeta([meteor_layout], 0, new Position(ROWS - 325, COLUMNS), FLOOR_VELOCITY.clone().add(new Velocity(0, -6))), 0.5)
            .add_character(new CharacterMeta([meteor_layout], 0, new Position(ROWS - 410, COLUMNS), FLOOR_VELOCITY.clone().add(new Velocity(0, -8))), 0.2)
        , 1000, 500
    )
]

function playMusic() {
  backgroundMusic.loop = true;
  backgroundMusic.volume = 0.25;
  if(backgroundMusic.paused || is_first_time) {
    backgroundMusic.play().catch(err => console.log('Error starting music: ', err));
  }
}

function muteMusic() {
  // standard hack to "stop" an audio track...
  backgroundMusic.pause();
  backgroundMusic.currentTime = 0;
}

function initialize() {
  current_theme = themes.dark;
  cumulative_velocity = new Velocity(0, 0);
  gameOver = false;
  game_score = 0;
  canvas.height = ROWS;
  canvas.width = COLUMNS;

  harmless_characters_pool = [];
  harmfull_characters_pool = [
    new Character(new CharacterMeta(aa_layout.run, 4, ASTRO_FLOOR_INITIAL_POSITION.clone(), new Velocity(0, 0)))
  ];

  const hiScoreTable = document.getElementById('hi-score');

  canvas.ontouchstart = () => {
    if (gameOver && (Date.now() - timeSinceGameOver) > 1000) {
      loadGame();
      hiScoreTable.innerHTML = getHiScoreLayout(hiScoreValues);
      playMusic();
      return;
    }

    if (astro_ready_to_jump) {
      jumpSoundEffect.play();
      astro_ready_to_jump = false;
      astro_current_thrust = ASTRO_INITIAL_THRUST.clone();
    }
  };

  document.body.onkeydown = event => {
    if (event.key === ' ') {
      event.preventDefault();
      canvas.ontouchstart();
    }
  };
}

function paint_layout(character_layout, character_position) {
    for (let j = 0; j < character_layout.length; j++) {
        for (let k = 0; k < character_layout[j].length; k++) {
            if (current_theme.layout[character_layout[j][k]]) {
                canvas_ctx.fillStyle = current_theme.layout[character_layout[j][k]];
                let x_pos = character_position[1] + (k * CELL_SIZE);
                let y_pos = character_position[0] + (j * CELL_SIZE);

                canvas_ctx.fillRect(x_pos, y_pos, CELL_SIZE, CELL_SIZE);
            }
        }
    }
}

function event_loop() {
    game_score_step += 0.15;

    if (game_score_step > 1) {
        game_score_step -= 1;
        game_score++;
    }

    if (game_score !== 0 && game_score % 300 === 0) {
        game_score++;
    }

    canvas_ctx.clearRect(0, 0, canvas.width, canvas.height);
    canvas_ctx.fillStyle = current_theme.background;
    canvas_ctx.fillRect(0, 0, canvas.width, canvas.height);
    canvas_ctx.beginPath();

    // Road
    for (let i = 0; i < canvas.width; i++) {
        canvas_ctx.fillStyle = current_theme.road;
        canvas_ctx.fillRect(0, ROWS - 68, canvas.width, CELL_SIZE * 0.2);
    }

    // score card update
  canvas_ctx.textBaseline = 'top';
    canvas_ctx.font = '1rem "04B30"';
    canvas_ctx.fillStyle = current_theme.score_text;
    canvas_ctx.fillText(`SCORE ${game_score.toString().padStart(4, '0')}`, canvas.width - 200, 20);

    // first time
    if (is_first_time) {
        is_first_time = false;
        paint_layout(aa_layout.stand, harmfull_characters_pool[0].get_position().get());
        gameOver = true;
        timeSinceGameOver = Date.now();

        canvas_ctx.textBaseline = 'middle';
        canvas_ctx.textAlign = 'center';
        canvas_ctx.font = COLUMNS > MOBILE_MAX_SCREEN_WIDTH ? '2rem "04B30"' : '1rem "04B30"';
        canvas_ctx.fillStyle = current_theme.info_text;
        const startText = COLUMNS > TABLET_MAX_SCREEN_WIDTH ? 'PRESS SPACE TO START' : 'TOUCH SCREEN TO START';
        canvas_ctx.fillText(startText, canvas.width / 2, (canvas.height / 2) - 50);
        return;
    }

    // characters
    // new characters generate
    [[harmless_character_allocator, harmless_characters_pool], [harmfull_character_allocator, harmfull_characters_pool]].forEach(character_allocator_details => {
        for (let i = 0; i < character_allocator_details[0].length; i++) {
            const ALLOCATOR = character_allocator_details[0][i];
            ALLOCATOR.tick();
            const RANDOM_CHARACTER = ALLOCATOR.get_character();
            if (RANDOM_CHARACTER) {
                RANDOM_CHARACTER.get_velocity().add(cumulative_velocity);
                character_allocator_details[1].push(RANDOM_CHARACTER);
            }
        }
    });

    // increase velocity
    if (game_score % 100 === 0) {
        cumulative_velocity.add(step_velocity);
    }

    // characters display
    [harmless_characters_pool, harmfull_characters_pool].forEach((characters_pool, index) => {

        for (let i = characters_pool.length - 1; i >= 0; i--) {

            // Increase velocity on each cycle
            if ((!(index === 1 && i === 0)) && (game_score % 100 === 0)) {
                characters_pool[i].get_velocity().add(step_velocity);
            }

            characters_pool[i].tick();
            let CHARACTER_LAYOUT = characters_pool[i].get_layout();

            // A special case for astro jump. It's leg should be in standing position while jump
            // Yes, this can be done much better but I am lazy :-)
            if (!astro_ready_to_jump && index === 1 && i === 0) {
                CHARACTER_LAYOUT = aa_layout.stand;
            }
            // ******

            const CHARACTER_POSITION = characters_pool[i].get_position().get();

            if (CHARACTER_POSITION[1] < -150) {
                characters_pool.splice(i, 1);
                continue;
            }

            paint_layout(CHARACTER_LAYOUT, CHARACTER_POSITION);
        }
    });


    // harmfull characters collision detection
    let astro_character = harmfull_characters_pool[0];
    let astro_current_position = astro_character.get_position();
    let astro_current_layout = astro_character.get_layout();
    for (let i = harmfull_characters_pool.length - 1; i > 0; i--) {
        const HARMFULL_CHARACTER_POSITION = harmfull_characters_pool[i].get_position();
        const HARMFULL_CHARACTER_LAYOUT = harmfull_characters_pool[i].get_layout();
        if (isCollided(astro_current_position.get()[0], astro_current_position.get()[1], astro_current_layout.length, astro_current_layout[0].length, HARMFULL_CHARACTER_POSITION.get()[0], HARMFULL_CHARACTER_POSITION.get()[1], HARMFULL_CHARACTER_LAYOUT.length, HARMFULL_CHARACTER_LAYOUT[0].length)) {
          const hiScorePosition = checkForHiScore();
          if(hiScorePosition !== undefined) {
            showInitialsInput(hiScorePosition);
          }
            canvas_ctx.textBaseline = 'middle';
            canvas_ctx.textAlign = 'center';
            canvas_ctx.font = COLUMNS > MOBILE_MAX_SCREEN_WIDTH ? '2rem "04B30"' : '1rem "04B30"';
            canvas_ctx.fillStyle = current_theme.info_text;
            canvas_ctx.fillText("GAME OVER", canvas.width / 2, (canvas.height / 2) - 100);
            const tryAgainText = COLUMNS > TABLET_MAX_SCREEN_WIDTH ? "PRESS SPACE TO TRY AGAIN!" : "TOUCH SCREEN TO TRY AGAIN!"
            canvas_ctx.fillText(tryAgainText, canvas.width / 2, (canvas.height / 2) - 60)
            paint_layout(retry_layout, new Position((canvas.height / 2) - retry_layout.length, (canvas.width / 2) - retry_layout[0].length).get());
            paint_layout(aa_layout.dead, harmfull_characters_pool[0].get_position().get());
            timeSinceGameOver = Date.now();
            gameOver = true;
          return;
        }
    }

    // astro jump case
    astro_character.set_position(applyVelocityToPosition(astro_character.get_position(), astro_current_thrust));

    if (astro_character.get_position().get()[0] > ASTRO_FLOOR_INITIAL_POSITION.get()[0]) {
        astro_character.set_position(ASTRO_FLOOR_INITIAL_POSITION.clone());
        astro_ready_to_jump = true;
        jumpSoundEffect.pause();
        jumpSoundEffect.currentTime = 0;
    }

    astro_current_thrust.sub(ENVIRONMENT_GRAVITY);

    requestAnimationFrame(event_loop);
}

function checkForHiScore() {
  for(let i = 0; i < hiScoreValues.length; i++) {
    if(game_score > Object.values(hiScoreValues[i])[0]) {
      return i;
    }
  }
}

function showInitialsInput(scoreIndex) {

  const hiScoreDiv = document.getElementById('hi-score');
  hiScoreDiv.innerHTML = getInitialsInput(game_score);

  const initialsInput = document.getElementById('initials');
  initialsInput.focus();
  initialsInput.addEventListener('keyup', (event) => {
    if(event.code === 'Enter' || event.key === 'Enter') {
      const initials = document.getElementById('initials').value;
      const errorField = document.getElementById('error');
      if (initials.length >= 1 && initials.length <= 3) {
        errorField.innerHTML = '';
        setNewHiScore(initials, scoreIndex);
      } else {
        errorField.innerHTML = 'You must enter between 1 and 3 characters.';
      }
    }
  })
}

function setNewHiScore(newInitials, scoreIndex) {
  // Update Hi Score object with new hi score
  const newHiScoreTable = [...hiScoreValues];
  const newEntry = {};
  newEntry[newInitials] = game_score;
  newHiScoreTable.splice(scoreIndex, 0, newEntry);
  newHiScoreTable.pop();

  // Set new object in db
  set(hiScoreRef, newHiScoreTable).then(() => {
    const hiScoreDiv = document.getElementById('hi-score');
    hiScoreDiv.innerHTML = getHiScoreLayout(hiScoreValues);
  }).catch(error => {
    const errorDiv = document.getElementById('error');
    errorDiv.innerHTML = 'Well, this is awkward... There was an issue saving your score.';
    console.error('Firebase set error: ', error);
  });
}

export function loadGame() {
    initialize();
    event_loop();
}
