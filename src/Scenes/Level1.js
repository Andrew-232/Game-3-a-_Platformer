// Platformer.js
class Level1 extends Phaser.Scene {
    constructor() {
        super("Level1Scene");
        this.score = 0;
        this.flagToggleTimer = 0;
        this.flagAnimationDelay = 15;
        this.isFlag1Visible = true;
        this.isGamePaused = false;
        this.levelOver = false;
        this.enemies = null;

        this.walkSound = null;
        this.jumpSound = null;
        this.gemSound = null;

        this.PROJECTILE_SPEED = 600;
        this.projectileCooldown = 0; 
        this.PROJECTILE_COOLDOWN_FRAMES = 15;
    }

    init() {
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

        // Water Layer 1
        this.waterLayer1 = this.map.createLayer("Water_1", this.tileset, 0, 0);
        if (this.waterLayer1) {
            this.waterLayer1.setScale(SCALE);
            this.waterLayer1.setVisible(this.isFlag1Visible);
        } else {
            console.warn("Tilemap layer 'Water_1' not found.");
        }

        // Water Layer 2
        this.waterLayer2 = this.map.createLayer("Water_2", this.tileset, 0, 0);
        if (this.waterLayer2) {
            this.waterLayer2.setScale(SCALE);
            this.waterLayer2.setVisible(!this.isFlag1Visible);
        } else {
            console.warn("Tilemap layer 'Water_2' not found.");
        }

        // Player
        my.sprite.player = this.physics.add.sprite((game.config.width / 10) + 50, (game.config.height / 2) + 320, "platformer_characters", "tile_0000.png").setScale(SCALE);
        my.sprite.player.setCollideWorldBounds(true);
        my.sprite.player.body.setSize(15, 15);
        my.sprite.player.setOffset(5, 10);


        if (this.groundLayer) {
            this.physics.add.collider(my.sprite.player, this.groundLayer);
        }

        this.deathBoxes = this.physics.add.staticGroup();

        const deathBoxObjectLayer = this.map.getObjectLayer('DeathBox'); 

        if (deathBoxObjectLayer && deathBoxObjectLayer.objects) {
            deathBoxObjectLayer.objects.forEach(deathBoxObj => {
                const boxX = (deathBoxObj.x * SCALE) + (deathBoxObj.width * SCALE / 2);
                const boxY = (deathBoxObj.y * SCALE) + (deathBoxObj.height * SCALE / 2);
                const boxWidth = deathBoxObj.width * SCALE;
                const boxHeight = deathBoxObj.height * SCALE;

                const deathZone = this.deathBoxes.create(boxX, boxY, null); 
                deathZone.setSize(boxWidth, boxHeight);
                deathZone.setVisible(false); 
                deathZone.body.isSensor = true;
            });
            console.log(`DeathBox layer processed, ${this.deathBoxes.getChildren().length} death zones created.`);
        } else {
            console.warn("'DeathBox' object layer not found in tilemap or it contains no objects.");
        }


        // Overlap check between the player and the deathBoxes group
        if (my.sprite.player && this.deathBoxes.getChildren().length > 0) {
            this.physics.add.overlap(my.sprite.player, this.deathBoxes, this.handlePlayerDeath, null, this);
        }

        // Cursors
        cursors = this.input.keyboard.createCursorKeys();
        this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

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

        // Projectiles Group
        this.projectiles = this.physics.add.group({
            defaultKey: 'kenny-particles',
            defaultFrame: 'flare_01.png',
            maxSize: 10
        });
        // Collider for projectiles and ground
        if (this.groundLayer) {
            this.physics.add.collider(this.projectiles, this.groundLayer, this.handleProjectileGroundCollision, null, this);
        }

        // Enemy Setup
        this.enemies = this.physics.add.group();
        const enemyLayer = this.map.getObjectLayer("Enemies"); 

        if (enemyLayer) {
            enemyLayer.objects.forEach(enemyObj => {
                const enemySprite = this.enemies.create(enemyObj.x * SCALE, enemyObj.y * SCALE - (18 * SCALE / 2), "platformer_characters", "tile_0015.png");
                enemySprite.setScale(SCALE);
                enemySprite.setSize(14,15);
                enemySprite.setOffset(5,10);
                enemySprite.setCollideWorldBounds(true);
                enemySprite.anims.play('enemy_idle', true); 

                if (enemySprite.body) { 
                    enemySprite.body.setAllowGravity(false); 
                    enemySprite.body.setImmovable(true);
                }
            });
        } else {
            console.warn("'Enemies' object layer not found in tilemap.");
        }

        // Colliders for enemies
        if (this.groundLayer) {
            this.physics.add.collider(this.enemies, this.groundLayer);
        }

        // Collision between player and enemies
        if (my.sprite.player && this.enemies) {
            this.physics.add.overlap(my.sprite.player, this.enemies, this.handlePlayerEnemyCollision, null, this);
        }

        // Collision between projectiles and enemies
        if (this.projectiles && this.enemies) {
            this.physics.add.collider(this.projectiles, this.enemies, this.handleProjectileEnemyCollision, null, this);
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

        fireProjectile() {
            if (!my.sprite.player || this.projectileCooldown > 0) return;

            let projectile = this.projectiles.get(my.sprite.player.x, my.sprite.player.y);
            if (projectile) {
                projectile.setActive(true).setVisible(true);
                projectile.body.setAllowGravity(false);
                projectile.setScale(SCALE * 0.05);

                const projectileHitboxWidth = 150;  // Desired width at 1x scale of the projectile's frame
                const projectileHitboxHeight = 150; // Desired height at 1x scale

                if (projectile.body) { // Check if body exists
                    projectile.body.setSize(projectileHitboxWidth, projectileHitboxHeight);
                }

                let velocityX;
                if (my.sprite.player.flipX) {
                    velocityX = this.PROJECTILE_SPEED;
                    projectile.setFlipX(false);
                } else {
                    velocityX = -this.PROJECTILE_SPEED;
                    projectile.setFlipX(true);
                }
            
                projectile.setVelocity(velocityX, 0);
                projectile.body.setCollideWorldBounds(false);

                this.projectileCooldown = this.PROJECTILE_COOLDOWN_FRAMES;
            }
        }

        handleProjectileGroundCollision(projectile, groundTile) {
            projectile.setActive(false).setVisible(false);
            projectile.body.stop();
        }

    update(time, delta) {
        if (this.projectileCooldown > 0) {
            this.projectileCooldown--;
        }

        if (this.isGamePaused || this.levelOver || !my.sprite.player || !my.sprite.player.body) {
            if (this.walkSound && this.walkSound.isPlaying) { 
                 this.walkSound.stop();
            }
            return;
        }

        // Handles projectile firing
        if (Phaser.Input.Keyboard.JustDown(this.spaceKey)) {
            this.fireProjectile();
        }

        // Update active projectiles
        this.projectiles.getChildren().forEach(projectile => {
            if (projectile.active) {
                if (projectile.x < 0 || projectile.x > this.physics.world.bounds.width ||
                    projectile.y < 0 || projectile.y > this.physics.world.bounds.height) {
                    projectile.setActive(false).setVisible(false).body.stop();
                }
                if (my.sprite.player && Phaser.Math.Distance.Between(projectile.x, projectile.y, my.sprite.player.x, my.sprite.player.y) > 500) {
                    projectile.setActive(false).setVisible(false).body.stop();
                }
            }
        });

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

            if (this.waterLayer1) {
                this.waterLayer1.setVisible(this.isFlag1Visible);
            }
            if (this.waterLayer2) {
                this.waterLayer2.setVisible(!this.isFlag1Visible);
            }
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
                this.scene.start('EndScreenScene', {
                    score: this.score,
                    currentLevelKey: 'Level1Scene', // The level just completed
                    nextLevelKey: 'Level2Scene'     // The next level to go to
                });            
            }
        });
    }

    handlePlayerDeath(player, deathBox) {
        if (this.levelOver) { 
            return;
        }
        this.levelOver = true; 
        console.log("Player touched a DeathBox zone!");

        // Stop player movement and animations
        if (player && player.body) {
            player.body.setAccelerationX(0);
            player.body.setVelocity(0, 0);
            player.anims.play('idle');
        }

        // Stop sounds
        if (this.walkSound && this.walkSound.isPlaying) {
            this.walkSound.stop();
        }
        this.sound.stopAll();

        // Pause the physics simulation for the scene
        this.physics.pause();

        // Disable keyboard input
        this.input.keyboard.enabled = false;

        // Fade the camera out, then restart the scene
        this.cameras.main.fadeOut(500, 0, 0, 0, (camera, progress) => {
            if (progress === 1) {
                this.scene.restart();
            }
        });
    }

    handlePlayerEnemyCollision(player, enemy) {
        if (this.levelOver || !enemy.active) return; // Don't do anything if level is already over or enemy is inactive

        console.log("Player collided with enemy!");
        // For now, let's make the player "die" similar to falling into a deathBox.
        // You can customize this later (e.g., lose health, bounce off, etc.)

        this.levelOver = true;
        this.isGamePaused = true; // Prevent further actions

        if (player && player.body) {
            player.body.setAccelerationX(0);
            player.body.setVelocity(0, -200); // Slight bounce up
            player.anims.stop(); // Stop current animation
            // player.setTint(0xff0000); // Optional: make player flash red
        }

        if (this.walkSound && this.walkSound.isPlaying) {
            this.walkSound.stop();
        }
        this.sound.stopAll();
        this.physics.pause();
        if(this.input && this.input.keyboard) this.input.keyboard.enabled = false;

        this.cameras.main.fadeOut(500, 0, 0, 0, (camera, progress) => {
            if (progress === 1) {
                this.scene.restart(); // Restart the level
            }
        });
    }

    handleProjectileEnemyCollision(projectile, enemy){
        if (!projectile.active || !enemy.active) return; // Don't do anything if projectile or enemy is already inactive

        console.log("Projectile hit enemy!");

        // Deactivate projectile
        projectile.setActive(false).setVisible(false);
        projectile.body.stop();

        // "Kill" the enemy
        enemy.setActive(false).setVisible(false);
        enemy.body.enable = false; // Disable physics body

        // Add score for defeating an enemy
        this.score += 25; // Example score value
        if (this.scoreText) this.scoreText.setText('Score: ' + this.score);
    }
}