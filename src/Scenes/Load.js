// Load.js
class Load extends Phaser.Scene {
    constructor() {
        super("loadScene");
    }

    preload() {
        this.load.setPath("./assets/");

        // Loads characters spritesheet
        this.load.atlas("platformer_characters", "tilemap-characters-packed.png", "tilemap-characters-packed.json");

        // Loads tilemap information
        this.load.spritesheet("tilemap_tiles", "tilemap_packed.png", {
            frameWidth: 18,
            frameHeight: 18
        });

        this.load.spritesheet("tilemap_tiles_background", "tilemap-backgrounds_packed.png", {
            frameWidth: 16,
            frameHeight: 16
        });

        this.load.tilemapTiledJSON("Level_1", "Level_1.tmj");
        this.load.tilemapTiledJSON("Level_2", "Level_2.tmj");
        this.load.tilemapTiledJSON("Level_3", "Level_3.tmj");

        this.load.multiatlas("kenny-particles", "kenny-particles.json");

        // Loads audio assets
        this.load.audio('sfx_walk', 'MovementAudio.mp3');
        this.load.audio('sfx_gem_collect', 'GemAudio.mp3');
        this.load.audio('sfx_jump', 'woosh-2-6471.mp3');
    }

    create() {
        // Player Walk animation
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

        // Player Idle animation
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

        // Player Jump animation
        this.anims.create({
            key: 'jump',
            defaultTextureKey: "platformer_characters",
            frames: [
                { frame: "tile_0026.png" } 
            ],
        });

        // ENEMY ANIMATION
        this.anims.create({
            key: 'enemy_idle',
            frames: this.anims.generateFrameNames('platformer_characters', {
                prefix: "tile_",
                frames: ["0015", "0016", "0017"],
                suffix: ".png",
                zeroPad: 4
            }),
            frameRate: 4, 
            repeat: -1    
        });

        this.scene.start("Level1Scene");
    }

    update() {
    }
}