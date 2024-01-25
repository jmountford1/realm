const canvas = document.querySelector('canvas');
const ctx = canvas.getContext('2d');

/* --- CLASSES --- */

class PlayerCharacter {

    constructor(animator) {
        //init sprite; add our image
        this.sprite = new Image();
        this.sprite.src = 'sprites/wizard.png';
        //dimensions for player sprite; 64x64 sprites (0-63 both x & y)
        this.width = 63;
        this.height = 63;
        //spritesheet coordinates to determine set the pixel row that is looked at on the spritesheet;
        this.FACE_DOWN = 128;
        this.FACE_UP = 192;
        this.FACE_LEFT = 64;
        this.FACE_RIGHT = 0;
        //determine how fast you move and how many frames are required to redraw the new sprite
        this.MOVEMENT_SPEED = 2;
        this.FRAME_LIMIT = 24;
        this.moved = false;
        //setting up the 4 sprite loop per direction
        this.spriteLoop = [0, 64, 128, 192];
        this.currentSpriteIndex = 0;
        //setting up some other default properties
        this.healthPoints = 720;
        this.dead = false;
        this.playerScore = 1;
        this.statusEffect = '';
        this.animator = animator;
        //setting up our frame counter for the player sprite
        this.frameCount = 0;
    }


    initialize() {
        //default character facing set
        this.currentDirection = Player.FACE_DOWN;
        //current player coordinates
        this.xCoordinate = 128;
        this.yCoordinate = 512;
        //defaulting our status effect to none;
        this.statusEffect = '';
    }

    // directional movement (post-collision checks)
    moveUp() {
        this.yCoordinate -= this.MOVEMENT_SPEED;
        this.currentDirection = this.FACE_UP;
        this.moved = true;
    }
    moveDown() {
        this.yCoordinate += this.MOVEMENT_SPEED;
        this.currentDirection = this.FACE_DOWN;
        this.moved = true;
    }

    moveLeft() {
        this.xCoordinate -= this.MOVEMENT_SPEED;
        this.currentDirection = this.FACE_LEFT;
        this.moved = true;
    }

    moveRight() {
        this.xCoordinate += this.MOVEMENT_SPEED;
        this.currentDirection = this.FACE_RIGHT;
        this.moved = true;
    }

    //function used to check map collision
    checkMapCollision(direction) {
        //this function checks if a player will be put past the boundaries,, and if so breaks; otherwise, move the player.
        switch (direction) {
            case 'up':
                if ((this.yCoordinate - this.MOVEMENT_SPEED) < Map.boundaries.yTop) {
                    this.currentDirection = this.FACE_UP;
                    break;
                } else {
                    this.moveUp();
                    break;
                }
            case 'down':
                if ((this.yCoordinate + this.MOVEMENT_SPEED) > Map.boundaries.yBottom) {
                    this.currentDirection = this.FACE_DOWN;
                    break;
                } else {
                    this.moveDown();
                    break;
                }
            case 'left':
                if ((this.xCoordinate - this.MOVEMENT_SPEED) < Map.boundaries.xLeft) {
                    this.currentDirection = this.FACE_LEFT;
                    break;
                } else {
                    this.moveLeft();
                    break;
                }
            case 'right':
                if ((this.xCoordinate + this.MOVEMENT_SPEED) > Map.boundaries.xRight) {
                    this.currentDirection = this.FACE_RIGHT;
                    break;
                } else {
                    this.moveRight();
                    break;
                }
        }
    }

    //function to check projectile collision
    checkProjectileCollision() {
        const playerBoundingBox = {
            x: this.xCoordinate,
            y: this.yCoordinate,
            width: this.width,
            height: this.height,
        }

        for (let i = 0; i < Animator.activeWaves.length; i++) {
            let wave = Animator.activeWaves[i];

            for (let j = 0; j < wave.projectiles.length; j++) {
                let projectile = wave.projectiles[j];

                const projectileBoundingBox = {
                    x: projectile.x,
                    y: projectile.y,
                    width: projectile.width,
                    height: projectile.height,
                }


                // Check for collision only if the projectile is within a specific range of the player
                if (
                    (projectile.x >= this.xCoordinate - projectile.width) &&
                    (projectile.x <= this.xCoordinate + this.width) &&
                    (projectile.y >= this.yCoordinate - projectile.height) &&
                    (projectile.y <= this.yCoordinate + this.height)
                ) {
                    this.takeDamage(projectile.bulletDamage);
                    const healthDisplay = document.getElementById('health-value');
                    healthDisplay.innerHTML = parseInt(this.healthPoints);

                    if (projectile.bulletSpecialEffect != '') {
                        this.statusEffect = projectile.bulletSpecialEffect;
                    }

                    // Remove the projectile to avoid multiple damage in the same frame
                    wave.projectiles.splice(j, 1);
                    j--; // Decrement j to account for the removed projectile
                }
            }
        }
    }

    //function used to damage the player
    takeDamage(damage) {
        this.healthPoints -= damage;
        if (this.healthPoints <= 0) {
            this.dead = true;
        }
    }

    //function to change our confused status and draw the status icon as necessary
    toggleConfusedStatus() {
        //checking if we are confused or not
        if (this.statusEffect == '') { //if not confused, inflict confused
            this.statusEffect = 'confused';
        } else { // if confused, remove confused
            this.statusEffect = '';
        }
    }

}

class StatusEffectSprite {
    constructor() {
        //scales for the status effect sprite; we are using a 16x16 sprite (0-15 both x and y)
        this.width = 15;
        this.height = 15;
        //calculating where to draw the status effect sprite
        this.xCoordinate = (Player.xCoordinate + 24);
        this.yCoordinate = (Player.yCoordinate - 24);
    }
    //function used to re-calculate the status position needed every frame
    calculateSpritePosition() {
        this.xCoordinate = (Player.xCoordinate + 24)
        this.yCoordinate = (Player.yCoordinate - 24)
    }
    //function used to draw the 'confused' status effect sprite
    drawConfused() {
        this.sprite = new Image();
        this.sprite.src = 'sprites/confused.png';
        return this.sprite;
    }
}

class MapSprite {
    constructor() {
        //assigning our map spirte
        this.sprite = new Image();
        this.sprite.src = 'sprites/starting-room.png';
        //scales for the map sprite (we are using a 1280 x 720 sprite)
        this.width = 1280;
        this.height = 720;
        //where to draw the map sprite
        this.xCoordinate = 0;
        this.yCoordinate = 0;
        //map boundaries
        this.boundaries = {
            xLeft: 64,
            xRight: 1152,
            yTop: 70,
            yBottom: 580,
        }
    }
}

class ConfuseWave {

    constructor() {
        this.type = 'confuse-bullet-wave'; //descriptor for our spawn function
        this.bulletWidth = 63; //pix dimensions
        this.bulletHeight = 63; //pix dimensions
        this.waveBulletCount = 18; //number of bullets in the wave
        this.ySpawn = 12; //spawn position
        this.bulletSpeed = 2.15; //movement speed
        this.rotationSpeed = 0.05;
        this.leftTileOffset = 40;
        this.bulletSpacing = 1;
        this.bulletDamage = 15;
        this.bulletSpecialEffect = 'confused';
        this.bulletSprite = new Image();
        this.bulletSprite.src = 'sprites/confuse-bullet.png';
    }
}

class MassiveBulletWave {
    constructor() {
        this.type = 'massive-bullet-wave';
        this.bulletWidth = 127;
        this.bulletHeight = 127;
        this.waveBulletCount = 5;
        this.ySpawn = 12;
        this.bulletSpeed = 1.5;
        this.rotationSpeed = 0.07;
        this.leftTileOffset = -80;
        this.bulletSpacing = 1.90;
        this.bulletDamage = 50;
        this.bulletSpecialEffect = '';
        this.bulletSprite = new Image();
        this.bulletSprite.src = 'sprites/massive-bullet.png';
    }
}

class Timer {
    constructor() {
        this.startTime = null;
        this.intervalId = null;
    }

    start() {
        this.startTime = new Date();
        this.intervalId = setInterval(() => this.update(), 100);
    }

    stop() {
        clearInterval(this.intervalId);
    }

    update() {
        //grab current time
        const currentTime = new Date();
        let currentTimeMilli = currentTime.getTime();
    
        //do a simple comparison of passed time and update the timer as necessary
        const timerElement = document.getElementById('timer-value');
        let timePassed = (currentTimeMilli - this.startTime.getTime()) / 1000;
        timerElement.innerHTML = timePassed.toFixed(1);
    }
}

class Score {

    constructor(player) {
        this.intervalId = null;
        this.player = player;
    }

    start() {
        this.intervalId = setInterval(() => this.update(), 1000);
    }

    stop () {
        clearInterval(this.intervalId);
    }

    update() {
        //simple calcs to determine score; this is randomly based
        const min = 3;
        const max = 15;
        const scoreMultiplier = 1;
        const newScore = parseInt(scoreMultiplier * (Math.floor(Math.random() * (max - min + 1)) + min));
        this.player.playerScore += newScore;

        //update score
        const scoreElement = document.getElementById('score-value');
        scoreElement.innerHTML = parseInt(this.player.playerScore);
    }
}

class AnimationManager {

    constructor(player, map) {
        this.player = player;
        this.map = map;
        this.activeWaves = [];
        this.spawnBulletWave = false;
        this.bulletWaveActive = false;
    }

    drawInitialGraphics() {
        this.drawMap() // this needs to be before everything else because of bitmap processing;
        this.drawPlayer() //drawing our character
    }

    drawPlayer() {
        if (Player.statusEffect != '') {
            this.drawPlayerStatusEffect();
        }
        ctx.drawImage(Player.sprite,
            Player.spriteLoop[Player.currentSpriteIndex], Player.currentDirection, Player.width, Player.height,
            Player.xCoordinate, Player.yCoordinate, Player.width, Player.height)
    }

    checkCurrentPlayerSprite() {
    //math to draw and animate our sprites
    if (this.player.moved) {
        this.player.frameCount++;
        if (this.player.frameCount >= this.player.FRAME_LIMIT) {
            this.player.frameCount = 0;
            this.player.currentSpriteIndex++;
            if (this.player.currentSpriteIndex >= this.player.spriteLoop.length) {
                this.player.currentSpriteIndex = 0;
            }
        }
    }
    }

    drawPlayerStatusEffect(statusEffect = "confused") {
        //needed to calculate the status effect position relative to the player
        StatusEffect.calculateSpritePosition();
        if (statusEffect = "confused") {
            ctx.drawImage(StatusEffect.drawConfused(),
                0, 0, StatusEffect.width, StatusEffect.height,
                StatusEffect.xCoordinate, StatusEffect.yCoordinate, StatusEffect.width, StatusEffect.height)
        }
    }

    drawMap() {
        ctx.drawImage(this.map.sprite, 
            0, 0, this.map.width, this.map.height,
            0, 0, this.map.width, this.map.height)
    }

    drawBulletWave(projectileWave) {
        let wave = {
            projectiles: [],
            waveBulletCount: projectileWave.waveBulletCount,
            bulletWidth: projectileWave.bulletWidth,
            bulletHeight: projectileWave.bulletHeight,
            bulletSpeed: projectileWave.bulletSpeed,
            bulletSpacing: projectileWave.bulletSpacing,
            bulletDamage: projectileWave.bulletDamage,
            ySpawn: projectileWave.ySpawn,
            rotationSpeed: projectileWave.rotationSpeed,
            leftTileOffset: projectileWave.leftTileOffset,
            bulletSprite: projectileWave.bulletSprite,
        }
        for (let i = 1; i <= projectileWave.waveBulletCount; i++) {
            // Add projectiles to the array
            wave.projectiles.push({
                x: ((i * (wave.bulletWidth * wave.bulletSpacing)) + wave.leftTileOffset),
                y: wave.ySpawn,
                width: wave.bulletWidth,
                height: wave.bulletHeight,
                angle: 0,
                bulletSpeed: wave.bulletSpeed,
                rotationSpeed: wave.rotationSpeed,
                bulletDamage: wave.bulletDamage,
                bulletSprite: wave.bulletSprite,
            });
        }
        this.activeWaves.push(wave);
    }
    
    //function should rotate the confuse bullets while moving them down the screen
    animateBulletWave() {
        for (let i = 0; i < this.activeWaves.length; i++) {
            let wave = this.activeWaves[i]
            for (let j = 0; j < wave.projectiles.length; j++) {
                let projectile = wave.projectiles[j];
    
                // Update the y-coordinate for the next frame
                projectile.y += projectile.bulletSpeed;
    
                ctx.save();
                ctx.translate(projectile.x, projectile.y);
    
                // Update the rotation angle for each projectile individually
                projectile.angle += projectile.rotationSpeed; // Adjust the rotation speed as needed
    
                // Rotate the canvas
                ctx.rotate(projectile.angle);
    
                ctx.drawImage(projectile.bulletSprite, -projectile.width / 2, -projectile.height / 2, projectile.width, projectile.height,
                    //projectile.x, projectile.y, projectile.width, projectile.height
                )
                ctx.restore();
            }
        }
    
        // Remove expired waves
        this.activeWaves = this.activeWaves.filter(wave => {
            // Filter out projectiles that are still on the canvas
            wave.projectiles = wave.projectiles.filter(projectile => projectile.y <= canvas.height);
    
            // Keep the wave if it still has active projectiles
            return wave.projectiles.length > 0;
        });
        // Set bulletWaveActive to false if there are no active waves
        this.bulletWaveActive = this.activeWaves.length > 0;
    }

    checkWaveState(bulletWave) {
        if (this.spawnBulletWave) {
            if (bulletWave.type = 'massive-bullet-wave') {
                this.drawBulletWave(bulletWave);
            } else if (bulletWave.type = 'confuse-bullet-wave') {
                this.drawBulletWave(bulletWave);
            }
            this.spawnBulletWave = false;
            this.bulletWaveActive = true;
        } 
        if (this.bulletWaveActive) {
            this.animateBulletWave();
            this.player.checkProjectileCollision();
        }
    }
}

class GlobalControls {
    constructor(player, animator) {
        this.keyPresses = {};
        this.player = player;
        this.animator = animator;
    }

    setEventListeners() {
        window.addEventListener('keydown', this.keyDownListener.bind(this), false);
        window.addEventListener('keyup', this.keyUpListener.bind(this), false);
    }

    keyDownListener(event) {
        if (event.key === 'c') {
            this.player.toggleConfusedStatus();
        } else if (event.key == 'f') {
            this.animator.spawnBulletWave = true;
            this.animator.checkWaveState(new ConfuseWave());
        } else if (event.key == 'g') {
            this.animator.spawnBulletWave = true;
            this.animator.checkWaveState(new MassiveBulletWave());
        } else {
            this.keyPresses[event.key] = true;
        }
    }

    keyUpListener(event) {
        this.keyPresses[event.key] = false;
    }

    checkPlayerMovement() {
        //defaulting this variable to false; this variable is set to true if the player has moved; this is to prevent the player from animating if the player has not moved;
        this.player.moved = false;
        if (this.player.statusEffect == '') { //player is not confused
            this.regularControls();
        } else { //player is confused
            this.confuseControls();
        }
    }

    regularControls() {
        if (this.keyPresses.w) {
            this.player.checkMapCollision('up');
        } else if (this.keyPresses.s) {
            this.player.checkMapCollision('down')
        }
        if (this.keyPresses.a) {
            this.player.checkMapCollision('left');
        } else if (this.keyPresses.d) {
            this.player.checkMapCollision('right');
        }
    }

    confuseControls() {
        if (this.keyPresses.w) {
            this.player.checkMapCollision('right');
        } else if (this.keyPresses.s) {
            this.player.checkMapCollision('left');
        }
        if (this.keyPresses.a) {
            this.player.checkMapCollision('down')
        } else if (this.keyPresses.d) {
            this.player.checkMapCollision('up');
        }
    }

}

/* --- END CLASSES --- */

/* --- OBJECTS --- */

//instantiate all objects required by the gameLoop()
const Player = new PlayerCharacter();
Player.initialize();
const StatusEffect = new StatusEffectSprite();
const Map = new MapSprite();
const gameTimer = new Timer();
const gameScore = new Score(Player);
const Animator = new AnimationManager(Player, Map);
const Controls = new GlobalControls(Player, Animator);
Controls.setEventListeners();

/* --- END OBJECTS --- */

/* --- GAME LOOP --- */

//core function that runs every frame to operate our game
function gameLoop() {
    
    //clear the canvas before redrawing our next frame
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    //calculating movement and position for the player; we do a check here if the player is confused or not as well.
    Controls.checkPlayerMovement();

    //drawing the sprite on the canvas
    Animator.drawMap() // this needs to be before everything else because of bitmap processing;

    //checks to determine if a wave was spawned, and if so a further check to draw it
    Animator.checkWaveState();

    //check to determine if we should advance the player sprite
    Animator.checkCurrentPlayerSprite()
    //drawing the character always has to be last;
    Animator.drawPlayer(); //drawing our character

    //recursively calling our function every frame; check if the player is dead first
    if (!Player.dead) {
        window.requestAnimationFrame(gameLoop);
    } else {
        //clear out update functions out because the game has paused; this logic executes when the player is dead.
        gameTimer.stop();
        gameScore.stop();
    }
}

/* --- END GAME LOOP --- */

/* --- GAMEPLAY TRIGGERS --- */
//this creates our gameLoop; will need to refactor once all sprites are loaded and ready to go
window.addEventListener('load', function () {
    Animator.drawInitialGraphics();
    //capturing some constant html elements for later usage
    const startGame = document.getElementById('start-game');
    const modal = document.querySelector('.modal');
    const counterBar = document.querySelector('.counter-wrap');
    //listener to start the game when start is clicked
    startGame.addEventListener('click', function () {
        modal.classList.add('fadeOutAnimation'); //fade out modal
        counterBar.classList.add('fadeInAnimation'); //fade in counter
        modal.addEventListener('animationend', function () {
            modal.style.display = 'none'; //disable modal
            gameTimer.start(); //start our timer and run
            gameScore.start(); //update score every second
            window.requestAnimationFrame(() => gameLoop()) //begin gameplay loop
        })
    }, {once: true})
})

/* --- END GAMEPLAY TRIGGERS --- */