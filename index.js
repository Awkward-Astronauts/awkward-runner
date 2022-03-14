import { AllocatorCharacterArray, Character, CharacterAllocator, CharacterMeta } from "./src/character.js";
import { layouts } from "./src/layouts.js";
import { applyVelocityToPosition, isCollided, Position, Velocity } from "./src/physics.js";
import './style.css';

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

const CELL_SIZE = 2;
const ROWS = 600;
let COLUMNS = 1200;
const FLOOR_VELOCITY = new Velocity(0, -7);
let ROCK_MIN_GAP = 20;

if (screen.width < COLUMNS) {
    COLUMNS = screen.width;
    FLOOR_VELOCITY.add(new Velocity(0, 2));
    ROCK_MIN_GAP = 50;
}

const ASTRO_INITIAL_THRUST = new Velocity(-11, 0);
const ENVIRONMENT_GRAVITY = new Velocity(-0.6, 0);
const ASTRO_FLOOR_INITIAL_POSITION = new Position(500, 10);
let astro_current_thrust = new Velocity(0, 0);
let astro_ready_to_jump = true;
let game_over = null;
let is_first_time = true;
let game_score = null;
let game_score_step = 0;
let game_hi_score = null;
let step_velocity = new Velocity(0, -0.1);
let cumulative_velocity = null;
let current_theme = null;

let harmless_characters_pool = null;
let harmfull_characters_pool = null;

let harmless_character_allocator = [
    new CharacterAllocator(
        new AllocatorCharacterArray()
            .add_character(new CharacterMeta([moon_layout], 0, new Position(140, COLUMNS), new Velocity(0, -0.4)), 0.95)
        , 3000, 100
    ),
    new CharacterAllocator(
        new AllocatorCharacterArray()
            .add_character(new CharacterMeta([stone_layout.large], 0, new Position(540, COLUMNS), FLOOR_VELOCITY), 0.9)
            .add_character(new CharacterMeta([stone_layout.medium], 0, new Position(543, COLUMNS), FLOOR_VELOCITY), 0.75)
            .add_character(new CharacterMeta([stone_layout.small], 0, new Position(541, COLUMNS), FLOOR_VELOCITY), 0.6)
        , 2, 0
    ),
    new CharacterAllocator(
        new AllocatorCharacterArray()
            .add_character(new CharacterMeta([star_layout.small_s2], 0, new Position(105, COLUMNS), new Velocity(0, -0.3)), 0.9)
            .add_character(new CharacterMeta([star_layout.small_s1], 0, new Position(190, COLUMNS), new Velocity(0, -0.3)), 0.7)
            .add_character(new CharacterMeta([star_layout.small_s2], 0, new Position(265, COLUMNS), new Velocity(0, -0.3)), 0.5)
            .add_character(new CharacterMeta([star_layout.small_s1], 0, new Position(350, COLUMNS), new Velocity(0, -0.3)), 0.3)
            .add_character(new CharacterMeta([star_layout.small_s2], 0, new Position(400, COLUMNS), new Velocity(0, -0.3)), 0.15)
            .add_character(new CharacterMeta([star_layout.small_s1], 0, new Position(440, COLUMNS), new Velocity(0, -0.3)), 0.0)
        , 350, 0
    ),
    new CharacterAllocator(
        new AllocatorCharacterArray()
            .add_character(new CharacterMeta([star_layout.point], 0, new Position(50, COLUMNS), new Velocity(0, -0.1)), 0.9)
            .add_character(new CharacterMeta([star_layout.tiny], 0, new Position(75, COLUMNS), new Velocity(0, -0.05)), 0.8)
            .add_character(new CharacterMeta([star_layout.point], 0, new Position(135, COLUMNS), new Velocity(0, -0.1)), 0.7)
            .add_character(new CharacterMeta([star_layout.tiny], 0, new Position(180, COLUMNS), new Velocity(0, -0.05)), 0.6)
            .add_character(new CharacterMeta([star_layout.point], 0, new Position(220, COLUMNS), new Velocity(0, -0.1)), 0.5)
            .add_character(new CharacterMeta([star_layout.tiny], 0, new Position(245, COLUMNS), new Velocity(0, -0.05)), 0.4)
            .add_character(new CharacterMeta([star_layout.point], 0, new Position(310, COLUMNS), new Velocity(0, -0.1)), 0.3)
            .add_character(new CharacterMeta([star_layout.tiny], 0, new Position(375, COLUMNS), new Velocity(0, -0.05)), 0.2)
            .add_character(new CharacterMeta([star_layout.point], 0, new Position(415, COLUMNS), new Velocity(0, -0.1)), 0.1)
            .add_character(new CharacterMeta([star_layout.tiny], 0, new Position(490, COLUMNS), new Velocity(0, -0.05)), 0.0)
        , 25, 5
    ),
    new CharacterAllocator(
        new AllocatorCharacterArray()
            .add_character(new CharacterMeta([pit_layout.large], 0, new Position(523, COLUMNS), FLOOR_VELOCITY), 0.97)
            .add_character(new CharacterMeta([pit_layout.up], 0, new Position(527, COLUMNS), FLOOR_VELOCITY), 0.90)
            .add_character(new CharacterMeta([pit_layout.down], 0, new Position(530, COLUMNS), FLOOR_VELOCITY), 0.85)
        , 100, 50
    )
];

let harmfull_character_allocator = [
    new CharacterAllocator(
        new AllocatorCharacterArray()
            .add_character(new CharacterMeta([rock_layout.rock_short], 0, new Position(511, COLUMNS), FLOOR_VELOCITY), 0.5)
            .add_character(new CharacterMeta([rock_layout.rock_tall], 0, new Position(495, COLUMNS), FLOOR_VELOCITY), 0.0)
        , ROCK_MIN_GAP, 100
    ),
    new CharacterAllocator(
        new AllocatorCharacterArray()
            .add_character(new CharacterMeta([alien_layout], 0, new Position(490, COLUMNS), FLOOR_VELOCITY.clone().add(new Velocity(0, -1))), 0.95)
            .add_character(new CharacterMeta([alien_layout], 0, new Position(470, COLUMNS), FLOOR_VELOCITY.clone().add(new Velocity(0, -2))), 0.7)
        , 2000, 50
    ),
    new CharacterAllocator(
        new AllocatorCharacterArray()
            .add_character(new CharacterMeta([meteor_layout], 0, new Position(410, COLUMNS), FLOOR_VELOCITY.clone().add(new Velocity(0, -5))), 0.8)
            .add_character(new CharacterMeta([meteor_layout], 0, new Position(275, COLUMNS), FLOOR_VELOCITY.clone().add(new Velocity(0, -6))), 0.5)
            .add_character(new CharacterMeta([meteor_layout], 0, new Position(190, COLUMNS), FLOOR_VELOCITY.clone().add(new Velocity(0, -8))), 0.2)
        , 1000, 500
    )
]

function initialize() {
  current_theme = themes.dark;
  cumulative_velocity = new Velocity(0, 0);
  game_over = false;
  game_score = 0;
  game_hi_score = localStorage.getItem("project.awkward_astronauts.high_score") || 0;
  canvas.height = ROWS;
  canvas.width = COLUMNS;

  harmless_characters_pool = [];
  harmfull_characters_pool = [
    new Character(new CharacterMeta(aa_layout.run, 4, ASTRO_FLOOR_INITIAL_POSITION.clone(), new Velocity(0, 0)))
  ];

  document.ontouchstart = () => {
    if (game_over && (Date.now() - game_over) > 1000) {
      main();
      return;
    }

    if (astro_ready_to_jump) {
      astro_ready_to_jump = false;
      astro_current_thrust = ASTRO_INITIAL_THRUST.clone();
    }
  };

  document.body.onclick = () => {
    if (game_over) {
      document.ontouchstart();
    }
  };

  document.body.onkeydown = event => {
    if (event.key === ' ') {
      document.ontouchstart();
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
        canvas_ctx.fillRect(0, 532, canvas.width, CELL_SIZE * 0.2);
    }

    // score card update
  canvas_ctx.textBaseline = 'top';
    canvas_ctx.font = '2rem "04B30"';
    canvas_ctx.fillStyle = current_theme.score_text;
    canvas_ctx.fillText(`HI ${Math.floor(game_hi_score).toString().padStart(4, '0')} ${game_score.toString().padStart(4, '0')}`, canvas.width - 400, 20);

    // first time
    if (is_first_time) {
        is_first_time = false;
        paint_layout(aa_layout.stand, harmfull_characters_pool[0].get_position().get());
        game_over = Date.now();

        canvas_ctx.textBaseline = 'middle';
        canvas_ctx.textAlign = 'center';
        canvas_ctx.font = '2rem "04B30"';
        canvas_ctx.fillStyle = current_theme.info_text;
        canvas_ctx.fillText("PRESS SPACE TO START", canvas.width / 2, (canvas.height / 2) - 50);
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
            canvas_ctx.textBaseline = 'middle';
            canvas_ctx.textAlign = 'center';
            canvas_ctx.font = '2rem "04B30"';
            canvas_ctx.fillStyle = current_theme.info_text;
            canvas_ctx.fillText("GAME OVER", canvas.width / 2, (canvas.height / 2) - 50);
            paint_layout(retry_layout, new Position((canvas.height / 2) - retry_layout.length, (canvas.width / 2) - retry_layout[0].length).get());
            paint_layout(aa_layout.dead, harmfull_characters_pool[0].get_position().get());
            game_over = Date.now();


            if (localStorage.getItem("project.awkward_astronauts.high_score") < game_score) {
                localStorage.setItem("project.awkward_astronauts.high_score", game_score);
            }

            return;
        }
    }

    // astro jump case
    astro_character.set_position(applyVelocityToPosition(astro_character.get_position(), astro_current_thrust));

    if (astro_character.get_position().get()[0] > ASTRO_FLOOR_INITIAL_POSITION.get()[0]) {
        astro_character.set_position(ASTRO_FLOOR_INITIAL_POSITION.clone());
        astro_ready_to_jump = true;
    }

    astro_current_thrust.sub(ENVIRONMENT_GRAVITY);

    requestAnimationFrame(event_loop);
}

function main() {
    initialize();
    event_loop();
}

document.fonts.load('1rem "04B30"').then(() => {
  document.fonts.forEach(font => console.log(font))
  main();
});
