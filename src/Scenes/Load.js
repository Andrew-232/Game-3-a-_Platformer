// Load.js
class Load extends Phaser.Scene {
    constructor() {
        super("loadScene");
    }

    preload() {
        this.load.setPath("./assets/");

        // Load characters spritesheet
        this.load.atlas("platformer_characters", "tilemap-characters-packed.png", "tilemap-characters-packed.json");

        // Load tilemap information
        this.load.spritesheet("tilemap_tiles", "tilemap_packed.png", {
            frameWidth: 18,
            frameHeight: 18
        });
        this.load.tilemapTiledJSON("Level_1", "Level_1.tmj");

        this.load.multiatlas("kenny-particles", "kenny-particles.json");

        // Load audio assets
        this.load.audio('sfx_walk', 'MovementAudio.mp3');
        this.load.audio('sfx_gem_collect', 'GemAudio.mp3');
        this.load.audio('sfx_jump', 'woosh-2-6471.mp3');
    }

    create() {
        // Walk animation
        this.anims.create({
            key: 'walk',
            frames: this.anims.generateFrameNames('platformer_characters', {
                prefix: "tile_",
                start: 24,
                end: 26,
                suffix: ".png",
                zeroPad: 4
            }),
            frameRate: 11,
            repeat: -1
        });

        // Idle animation
        this.anims.create({
            key: 'idle',
            defaultTextureKey: "platformer_characters",
            frames: this.anims.generateFrameNames('platformer_characters', {
                prefix: "tile_",
                start: 24, 
                end: 26, 
                suffix: ".png",
                zeroPad: 4
            }),
            frameRate: 5, 
            repeat: -1
        });

        // Jump animation
        this.anims.create({
            key: 'jump',
            defaultTextureKey: "platformer_characters",
            frames: [
                { frame: "tile_0026.png" } 
            ],
        });
        this.scene.start("platformerScene");
    }

    update() {
    }
}