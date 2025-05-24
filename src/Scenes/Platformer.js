// Platformer.js
class Platformer extends Phaser.Scene {
    constructor() {
        super("platformerScene");
        this.score = 0;
        this.flagToggleTimer = 0;
        this.flagAnimationDelay = 15;
        this.isFlag1Visible = true;
        this.isGamePaused = false;
        this.levelOver = false;

        // Sound effect references
        this.walkSound = null;
        this.jumpSound = null;
        this.gemSound = null;
    }

    init() {
        // Variables and settings
        this.ACCELERATION = 500;
        this.MAX_SPEED = 300;
        this.DRAG = 900;
        this.physics.world.gravity.y = 1500;
        this.JUMP_VELOCITY = -900;
        this.score = 0;
        this.isGamePaused = false;
        this.levelOver = false;
    }

    create() {
        if (this.input && this.input.keyboard) {
            this.input.keyboard.enabled = true;
        }

        // New tilemap game object
        this.map = this.add.tilemap("Level_1", 18, 18, 45, 25);
        this.tileset = this.map.addTilesetImage("platform", "tilemap_tiles");

        // Layers
        this.BackgroundLayer = this.map.createLayer("Background", this.tileset, 0, 0);
        if (this.BackgroundLayer) {
            this.BackgroundLayer.setScale(SCALE);
            this.BackgroundLayer.setDepth(-1);
        }

        this.foilageLayer = this.map.createLayer("foilage", this.tileset, 0, 0);
        if (this.foilageLayer) {
            this.foilageLayer.setScale(SCALE);
        }

        this.groundLayer = this.map.createLayer("Ground_Platforms", this.tileset, 0, 0);
        if (this.groundLayer) {
            this.groundLayer.setScale(SCALE);
            this.groundLayer.setCollisionByProperty({ collides: true });
        }

        // Player
        my.sprite.player = this.physics.add.sprite((game.config.width / 10) + 50, (game.config.height / 2) + 320, "platformer_characters", "tile_0000.png").setScale(SCALE);
        my.sprite.player.setCollideWorldBounds(true);
        if (this.groundLayer) {
            this.physics.add.collider(my.sprite.player, this.groundLayer);
        }

        // Cursors
        cursors = this.input.keyboard.createCursorKeys();

        // Gems
        this.gems = this.physics.add.group();
        const gemsLayer = this.map.getObjectLayer("Gems");
        if (gemsLayer) {
            gemsLayer.objects.forEach(obj => {
                const gem = this.gems.create(obj.x * SCALE + 17, obj.y * SCALE - 10, "tilemap_tiles", 67);
                if (gem) {
                    gem.setScale(SCALE);
                    if (gem.body) {
                        gem.body.setAllowGravity(false);
                        gem.body.setImmovable(true);
                    }
                }
            });
        }

        // FlagPole
        this.flagPoles = this.physics.add.group();
        const flagPoleLayer = this.map.getObjectLayer("FlagPole");
        if (flagPoleLayer) {
            flagPoleLayer.objects.forEach(obj => {
                const flagPole = this.flagPoles.create(obj.x * SCALE + 25, obj.y * SCALE - 10, "tilemap_tiles", 131);
                if (flagPole) {
                    flagPole.setScale(SCALE);
                    if (flagPole.body) {
                        flagPole.body.setAllowGravity(false);
                        flagPole.body.setImmovable(true);
                    }
                }
            });
        }

        // Overlap check for player and the flag pole
        if (my.sprite.player && this.flagPoles) {
            this.physics.add.overlap(my.sprite.player, this.flagPoles, this.reachFlag, null, this);
        }


        // Flag1 
        this.flag1Group = this.physics.add.group();
        const flag1Layer = this.map.getObjectLayer("Flag1");
        if (flag1Layer) {
            flag1Layer.objects.forEach(obj => {
                const flag1 = this.flag1Group.create(obj.x * SCALE + 25, obj.y * SCALE - 10, "tilemap_tiles", 111);
                if (flag1) {
                    flag1.setScale(SCALE);
                    flag1.setVisible(this.isFlag1Visible);
                    if (flag1.body) {
                        flag1.body.setAllowGravity(false);
                        flag1.body.setImmovable(true);
                    }
                }
            });
        }

        // Flag2
        this.flag2Group = this.physics.add.group();
        const flag2Layer = this.map.getObjectLayer("Flag2");
        if (flag2Layer) {
            flag2Layer.objects.forEach(obj => {
                const flag2 = this.flag2Group.create(obj.x * SCALE + 25, obj.y * SCALE - 10, "tilemap_tiles", 112);
                if (flag2) {
                    flag2.setScale(SCALE);
                    flag2.setVisible(!this.isFlag1Visible);
                    if (flag2.body) {
                        flag2.body.setAllowGravity(false);
                        flag2.body.setImmovable(true);
                    }
                }
            });
        }

        // Particle emmiter for walking VFX
        this.walkingParticles = this.add.particles(0, 0, 'kenny-particles', {
            frame: ['slash_01.png', 'slash_02.png'],
            lifespan: 200,
            speed: { min: 10, max: 50 },
            angle: { min: 200, max: 340 },
            gravityY: 300,
            scale: { start: SCALE * 0.04, end: 0 },
            quantity: 1,
            frequency: 50,
            emitting: false
        });
        if (this.walkingParticles && my.sprite.player) {
            this.walkingParticles.setDepth(my.sprite.player.depth - 1);
        } else if (!this.walkingParticles) {
            console.error("Failed to create walkingParticles. Check asset key 'kenny-particles' and frames 'slash_01.png', 'slash_02.png'.");
        }

        // Particle emmiter for Jump VFX (One-shot)
        this.jumpParticles = this.add.particles(0, 0, 'kenny-particles', {
            frame: ['muzzle_01.png', 'muzzle_02.png', 'muzzle_03.png', 'muzzle_04.png', 'muzzle_05.png'],
            lifespan: 400,
            speed: { min: 100, max: 250 },
            angle: { min: 240, max: 300 },
            gravityY: 300,
            scale: { start: SCALE * 0.15, end: 0 },
            quantity: 1, 
            emitting: false
        });
        if (this.jumpParticles && my.sprite.player) { 
            this.jumpParticles.setDepth(my.sprite.player.depth - 1);
        } else if (!this.jumpParticles) {
            console.error("Failed to create jumpParticles. Check asset key 'kenny-particles' and muzzle frames.");
        }

        // Particle emmiter for Gem Collection VFX (One-shot)
        this.gemCollectParticles = this.add.particles(0, 0, 'kenny-particles', {
            frame: ['star_01.png', 'star_02.png', 'star_03.png'],
            lifespan: 600,
            speed: { min: 50, max: 150 },
            angle: { min: 0, max: 360 },
            gravityY: 100,
            scale: { start: SCALE * 0.1, end: 0 },
            quantity: 1, 
            emitting: false
        });
        if (this.gemCollectParticles) {
            this.gemCollectParticles.setDepth(10); 
        } else {
            console.error("Failed to create gemCollectParticles. Check asset key 'kenny-particles' and star frames.");
        }


        // CAMERA AND WORLD BOUNDS
        if (this.map && this.map.widthInPixels && this.map.heightInPixels) {
            this.cameras.main.setBounds(0, 0, this.map.widthInPixels * SCALE, this.map.heightInPixels * SCALE);
            this.physics.world.setBounds(0, 0, this.map.widthInPixels * SCALE, this.map.heightInPixels * SCALE);
        }
        if (my.sprite.player) {
            this.cameras.main.startFollow(my.sprite.player, true, 0.25, 0.25); 
        }

        // SCORE DISPLAY
        this.scoreText = this.add.text(20, 20, 'Score: 0', { 
            fontFamily: 'Arial, sans-serif', fontSize: '28px', fill: '#ffffff',
            stroke: '#000000', strokeThickness: 4
        });
        this.scoreText.setScrollFactor(0).setDepth(100);     

        // Initialize Audio
        this.walkSound = this.sound.add('sfx_walk', { loop: true, volume: 0.35 });
        this.gemSound = this.sound.add('sfx_gem_collect', { volume: 0.6 });
        this.jumpSound = this.sound.add('sfx_jump', { volume: 0.5 });

        // PAUSE Game Listener
        this.input.keyboard.on('keydown-TAB', (event) => {
            event.preventDefault();
            if (this.levelOver) return;
            if (!this.isGamePaused) {
                this.isGamePaused = true;
                this.physics.pause();
                if(my.sprite.player && my.sprite.player.anims) my.sprite.player.anims.pause();
                
                this.sound.pauseAll();

                this.scene.launch('pauseScene', { platformerSceneKey: 'platformerScene' });
                this.scene.pause();    
            }
        }, this);

        // Listen for resume event from PauseScene
        this.events.on('resume', () => {
            if (this.levelOver) return;
            this.isGamePaused = false;
            this.physics.resume(); 
            if(my.sprite.player && my.sprite.player.anims) my.sprite.player.anims.resume();
            
            this.sound.resumeAll();

            if (cursors) {
                cursors.left.reset();
                cursors.right.reset();
                cursors.up.reset();
            }
            this.input.keyboard.resetKeys();
        });
        this.cameras.main.fadeIn(300,0,0,0);
    }

    update(time, delta) {
        if (this.isGamePaused || this.levelOver || !my.sprite.player || !my.sprite.player.body) {
            if (this.walkSound && this.walkSound.isPlaying) { 
                 this.walkSound.stop();
            }
            return;
        }

        const MAX_FALL_SPEED = 1000;
        if (my.sprite.player.body.velocity.y > MAX_FALL_SPEED) {
            my.sprite.player.body.velocity.y = MAX_FALL_SPEED;
        }

        let playerIsMovingHorizontally = false;
        if (cursors.left.isDown) {
            my.sprite.player.body.setAccelerationX(-this.ACCELERATION);
            my.sprite.player.resetFlip();
            playerIsMovingHorizontally = true;
        } else if (cursors.right.isDown) {
            my.sprite.player.body.setAccelerationX(this.ACCELERATION);
            my.sprite.player.setFlip(true, false); 
            playerIsMovingHorizontally = true;
        } else {
            my.sprite.player.body.setAccelerationX(0);
            my.sprite.player.body.setDragX(this.DRAG);
        }

        if (Math.abs(my.sprite.player.body.velocity.x) > this.MAX_SPEED) {
            my.sprite.player.body.velocity.x = Math.sign(my.sprite.player.body.velocity.x) * this.MAX_SPEED;
        }

        let newAnimKey = my.sprite.player.anims.currentAnim ? my.sprite.player.anims.currentAnim.key : null;

        if (!my.sprite.player.body.blocked.down) { 
            newAnimKey = 'jump';
            if (this.walkingParticles && this.walkingParticles.emitting) this.walkingParticles.stop();
            if (this.walkSound && this.walkSound.isPlaying) this.walkSound.stop();
        } else { 
            if (playerIsMovingHorizontally) {
                newAnimKey = 'walk';
                if (this.walkingParticles && !this.walkingParticles.emitting) {
                    this.walkingParticles.startFollow(my.sprite.player, 0, my.sprite.player.displayHeight / 2 - (SCALE * 5));
                    this.walkingParticles.start();
                }
                if (this.walkSound && !this.walkSound.isPlaying) this.walkSound.play();
            } else { 
                newAnimKey = 'idle';
                if (this.walkingParticles && this.walkingParticles.emitting) this.walkingParticles.stop();
                if (this.walkSound && this.walkSound.isPlaying) this.walkSound.stop();
            }
        }
        
        if (this.walkingParticles && this.walkingParticles.emitting) {
             this.walkingParticles.setEmitterAngle({
                 min: my.sprite.player.flipX ? 20 : 160, 
                 max: my.sprite.player.flipX ? 60 : 200
            });
        }

        if (newAnimKey && (my.sprite.player.anims.currentAnim?.key !== newAnimKey)) {
            my.sprite.player.anims.play(newAnimKey, true);
        }

        if (my.sprite.player.body.blocked.down && Phaser.Input.Keyboard.JustDown(cursors.up)) {
            my.sprite.player.body.setVelocityY(this.JUMP_VELOCITY);
            if (this.jumpParticles) {
                this.jumpParticles.explode(10, my.sprite.player.x, my.sprite.player.y + my.sprite.player.displayHeight * 0.4);
            }
            if (this.jumpSound) this.jumpSound.play();
            if (this.walkSound && this.walkSound.isPlaying) this.walkSound.stop(); 
        }

        if (this.gems && my.sprite.player) {
            this.physics.overlap(my.sprite.player, this.gems, this.collectGem, null, this);
        }

        this.flagToggleTimer++;
        if (this.flagToggleTimer >= this.flagAnimationDelay) {
            this.flagToggleTimer = 0;
            this.isFlag1Visible = !this.isFlag1Visible;
            if (this.flag1Group) this.flag1Group.getChildren().forEach(flag => flag.setVisible(this.isFlag1Visible));
            if (this.flag2Group) this.flag2Group.getChildren().forEach(flag => flag.setVisible(!this.isFlag1Visible));
        }
        
        if (this.scoreText) {
             this.scoreText.x = this.cameras.main.worldView.x + 20;
             this.scoreText.y = this.cameras.main.worldView.y + 20;
        }

        if (this.scoreText) {
            this.scoreText.x = this.cameras.main.width - this.scoreText.width - 20;
            this.scoreText.y = 20;
        }
    }

    collectGem(player, gem) {
        if (this.gemCollectParticles) this.gemCollectParticles.explode(15, gem.x, gem.y);
        if (this.gemSound) this.gemSound.play();
        
        gem.disableBody(true, true); 
        this.score += 10; 
        if (this.scoreText) this.scoreText.setText('Score: ' + this.score);
    }

    reachFlag(player, flag) {
        if (this.levelOver) { 
            return;
        }
        this.levelOver = true; 
        this.isGamePaused = true; 

        // Stop player movement and sounds
        if (my.sprite.player && my.sprite.player.body) {
            my.sprite.player.body.setAccelerationX(0);
            my.sprite.player.body.setVelocity(0,0);
            my.sprite.player.anims.play('idle'); 
        }
        if (this.walkSound && this.walkSound.isPlaying) {
            this.walkSound.stop();
        }
        this.sound.stopAll();

        this.physics.pause(); 
        this.input.keyboard.enabled = false; 

        // Fade out and transition to EndScreenScene
        this.cameras.main.fadeOut(500, 50, 50, 78, (camera, progress) => {
            if (progress === 1) {
                this.scene.start('EndScreenScene', { score: this.score });
            }
        });
    }
}