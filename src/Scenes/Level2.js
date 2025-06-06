// Level2Scene.js
class Level2 extends Phaser.Scene {
    constructor() {
        super("Level2Scene"); 
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

    init(data) {
        this.ACCELERATION = 500;
        this.MAX_SPEED = 300;
        this.DRAG = 900;
        this.physics.world.gravity.y = 1500;
        this.JUMP_VELOCITY = -900;
        this.score = data.score || 0; 
        this.isGamePaused = false;
        this.levelOver = false;
        this.projectileCooldown = 0;
    }

    create() {
        if (this.input && this.input.keyboard) {
            this.input.keyboard.enabled = true;
        }

        this.map = this.add.tilemap("Level_2", 18, 18, 45, 25);
        this.tileset = this.map.addTilesetImage("Tilemap", "tilemap_tiles");
        this.tilesetBack = this.map.addTilesetImage("Tilemap_Backgrounds", "tilemap_tiles_background");

        this.backgroundLayer = this.map.createLayer("background", this.tilesetBack, 0, 0);
        if (this.backgroundLayer) {
            this.backgroundLayer.setScale(SCALE);
            this.backgroundLayer.setDepth(-1);
        } else {
            console.warn("Tilemap layer 'background' not found in Level_2.tmj.");
        }

        this.foilageLayer = this.map.createLayer("Foilage", this.tileset, 0, 0);
        if (this.foilageLayer) {
            this.foilageLayer.setScale(SCALE);
        } else {
            console.warn("Tilemap layer 'Foilage' not found in Level_2.tmj.");
        }

        this.groundLayer = this.map.createLayer("Ground_Platforms", this.tileset, 0, 0);
        if (this.groundLayer) {
            this.groundLayer.setScale(SCALE);
            this.groundLayer.setCollisionByProperty({ collision: true });
        } else {
            console.warn("Tilemap layer 'Ground_Platforms' not found in Level_2.tmj. Player and other physics interactions may fail.");
        }

        this.waterLayer1 = this.map.createLayer("Water_1", this.tileset, 0, 0);
        if (this.waterLayer1) {
            this.waterLayer1.setScale(SCALE);
            this.waterLayer1.setVisible(this.isFlag1Visible);
        } else {
            console.warn("Tilemap layer 'Water_1' not found in Level_2.tmj.");
        }

        this.waterLayer2 = this.map.createLayer("Water_2", this.tileset, 0, 0);
        if (this.waterLayer2) {
            this.waterLayer2.setScale(SCALE);
            this.waterLayer2.setVisible(!this.isFlag1Visible);
        } else {
            console.warn("Tilemap layer 'Water_2' (used for animation) not found in Level_2.tmj.");
        }


        // Player
        my.sprite.player = this.physics.add.sprite(100, 600, "platformer_characters", "tile_0000.png").setScale(SCALE); 
        my.sprite.player.setCollideWorldBounds(true);
        my.sprite.player.body.setSize(15, 15); 
        my.sprite.player.setOffset(5, 10);  

        if (this.groundLayer) {
            this.physics.add.collider(my.sprite.player, this.groundLayer);
        }


        // DeathBox
        this.deathBoxes = this.physics.add.staticGroup();
        const deathBoxObjectLayer = this.map.getObjectLayer('DeathBox');
        if (deathBoxObjectLayer && deathBoxObjectLayer.objects) {
            deathBoxObjectLayer.objects.forEach(deathBoxObj => {
                const boxX = (deathBoxObj.x * SCALE) + (deathBoxObj.width * SCALE / 2);
                const boxY = (deathBoxObj.y * SCALE) + (deathBoxObj.height * SCALE / 2);
                const deathZone = this.deathBoxes.create(boxX, boxY, null);
                deathZone.setSize(deathBoxObj.width * SCALE, deathBoxObj.height * SCALE).setVisible(false);
                deathZone.body.isSensor = true;
            });
        } 

        if (my.sprite.player && this.deathBoxes.getChildren().length > 0) {
            this.physics.add.overlap(my.sprite.player, this.deathBoxes, this.handlePlayerDeath, null, this);
        }


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
        } else {
             console.warn("Object layer 'Gems' not found in Level_2.tmj.");
        }


        // Enemies 
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
            console.warn("Object layer 'Enemies' not found in Level_2.tmj.");
        }
        // Colliders for enemies
        if (this.groundLayer && this.enemies.getChildren().length > 0) {
            this.physics.add.collider(this.enemies, this.groundLayer);
        }
        if (my.sprite.player && this.enemies.getChildren().length > 0) {
            this.physics.add.overlap(my.sprite.player, this.enemies, this.handlePlayerEnemyCollision, null, this);
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
        } else {
            console.warn("Object layer 'Flag1' not found in Level_2.tmj.");
        }

        // Flag2 (Object Layer)
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
        } else {
            console.warn("Object layer 'Flag2' not found in Level_2.tmj.");
        }

        // end level trigger
        if (my.sprite.player) {
            if (this.flag1Group.getChildren().length > 0) {
                this.physics.add.overlap(my.sprite.player, this.flag1Group, this.reachFlag, null, this);
            }
            if (this.flag2Group.getChildren().length > 0) {
                this.physics.add.overlap(my.sprite.player, this.flag2Group, this.reachFlag, null, this);
            }
        }


        // Cursors and Space Key
        cursors = this.input.keyboard.createCursorKeys();
        this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

        // Projectiles Group
        this.projectiles = this.physics.add.group({
            defaultKey: 'kenny-particles',
            defaultFrame: 'flare_01.png',
            maxSize: 10
        });
        if (this.groundLayer) {
            this.physics.add.collider(this.projectiles, this.groundLayer, this.handleProjectileGroundCollision, null, this);
        }
        // Projectile vs Enemy collision
        if (this.projectiles && this.enemies && this.enemies.getChildren().length > 0) {
            this.physics.add.collider(this.projectiles, this.enemies, this.handleProjectileEnemyCollision, null, this);
        }

        // Particle Emitters
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

        if (this.walkingParticles && my.sprite.player) this.walkingParticles.setDepth(my.sprite.player.depth - 1);

        this.jumpParticles = this.add.particles(0, 0, 'kenny-particles', { 
            frame: ['muzzle_01.png', 'muzzle_02.png', 'muzzle_03.png', 'muzzle_04.png', 'muzzle_05.png'], 
            lifespan: 400, 
            speed: { min: 100, max: 250 }, 
            angle: { min: 240, max: 300 }, 
            gravityY: 300, 
            scale: { start: SCALE * 0.15, 
                end: 0 
            }, 
            quantity: 1, 
            emitting: false 
        });

        if (this.jumpParticles && my.sprite.player) this.jumpParticles.setDepth(my.sprite.player.depth - 1);

        this.gemCollectParticles = this.add.particles(0, 0, 'kenny-particles', { 
            frame: ['star_01.png', 'star_02.png', 'star_03.png'], 
            lifespan: 600, 
            speed: { min: 50, max: 150 }, 
            angle: { min: 0, max: 360 }, 
            gravityY: 100, 
            scale: { start: SCALE * 0.1, 
                end: 0 
            }, 
            quantity: 1, 
            emitting: false 
        });

        if (this.gemCollectParticles) this.gemCollectParticles.setDepth(10);

        // Camera and World Bounds
        if (this.map && this.map.widthInPixels && this.map.heightInPixels) {
            this.cameras.main.setBounds(0, 0, this.map.widthInPixels * SCALE, this.map.heightInPixels * SCALE);
            this.physics.world.setBounds(0, 0, this.map.widthInPixels * SCALE, this.map.heightInPixels * SCALE);
        }
        if (my.sprite.player) {
            this.cameras.main.startFollow(my.sprite.player, true, 0.25, 0.25);
        }

        // Score Display
        this.scoreText = this.add.text(20, 20, 'Score: ' + this.score, { 
            fontFamily: 'Arial, sans-serif', 
            fontSize: '28px', 
            fill: '#ffffff', 
            stroke: '#000000', 
            strokeThickness: 4 
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
                if(my.sprite.player?.anims) my.sprite.player.anims.pause();
                this.sound.pauseAll();
                this.scene.launch('pauseScene', { Level1SceneKey: 'Level2Scene' });
                this.scene.pause();
            }
        }, this);

        // Listen for resume event from PauseScene
        this.events.on('resume', () => {
            if (this.levelOver) return;
            this.isGamePaused = false;
            this.physics.resume();
            if(my.sprite.player?.anims) my.sprite.player.anims.resume();
            this.sound.resumeAll();
            if (cursors) { cursors.left.reset(); cursors.right.reset(); cursors.up.reset(); }
            this.input.keyboard.resetKeys();
        });

        this.cameras.main.fadeIn(300,0,0,0);
    }

    update(time, delta) { 
        if (this.projectileCooldown > 0) { 
            this.projectileCooldown--; 
        }

        if (this.isGamePaused || this.levelOver || !my.sprite.player || !my.sprite.player.body) { 
            if (this.walkSound && this.walkSound.isPlaying) { 
                 this.walkSound.stop(); 
            }
            if (this.enemies) {
                this.enemies.getChildren().forEach(enemy => {
                    if (enemy.active && enemy.anims && enemy.anims.isPlaying) enemy.anims.pause();
                });
            }
            return; 
        } else {
             if (this.enemies) {
                this.enemies.getChildren().forEach(enemy => {
                    if (enemy.active && enemy.anims && enemy.anims.isPaused) enemy.anims.resume();
                });
            }
        }

        if (Phaser.Input.Keyboard.JustDown(this.spaceKey)) { 
            this.fireProjectile(); 
        }

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
             this.walkingParticles.setEmitterAngle({ min: my.sprite.player.flipX ? 20 : 160, max: my.sprite.player.flipX ? 60 : 200 });
        }
        if (newAnimKey && (my.sprite.player.anims.currentAnim?.key !== newAnimKey)) { 
            my.sprite.player.anims.play(newAnimKey, true); 
        }

        if (my.sprite.player.body.blocked.down && Phaser.Input.Keyboard.JustDown(cursors.up)) { 
            my.sprite.player.body.setVelocityY(this.JUMP_VELOCITY); 
            if (this.jumpParticles) this.jumpParticles.explode(10, my.sprite.player.x, my.sprite.player.y + my.sprite.player.displayHeight * 0.4); 
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
            if (this.waterLayer1) this.waterLayer1.setVisible(this.isFlag1Visible); 
            if (this.waterLayer2) this.waterLayer2.setVisible(!this.isFlag1Visible); 
        }

        if (this.scoreText) {
            this.scoreText.x = this.cameras.main.width - this.scoreText.width - 20;
            this.scoreText.y = 20;
        }

    }

    fireProjectile() { 
        if (!my.sprite.player || this.projectileCooldown > 0) return; 
        let projectile = this.projectiles.get(my.sprite.player.x, my.sprite.player.y); 
        if (projectile) { 
            projectile.setActive(true).setVisible(true).setScale(SCALE * 0.05);
            projectile.body.setAllowGravity(false);
            const projectileHitboxWidth = 150;  
            const projectileHitboxHeight = 150; 

            if (projectile.body) { 
                projectile.body.setSize(projectileHitboxWidth, projectileHitboxHeight);
            }

            let velocityX = my.sprite.player.flipX ? this.PROJECTILE_SPEED : -this.PROJECTILE_SPEED; 
            projectile.setFlipX(my.sprite.player.flipX);
            projectile.setVelocity(velocityX, 0); 
            projectile.body.setCollideWorldBounds(false); 
            this.projectileCooldown = this.PROJECTILE_COOLDOWN_FRAMES; 
        }
    }

    handleProjectileGroundCollision(projectile, groundTile) { 
        projectile.setActive(false).setVisible(false).body.stop(); 
    }

    collectGem(player, gem) { 
        if (this.gemCollectParticles) this.gemCollectParticles.explode(15, gem.x, gem.y); 
        if (this.gemSound) this.gemSound.play(); 
        gem.disableBody(true, true); 
        this.score += 10; 
        if (this.scoreText) this.scoreText.setText('Score: ' + this.score);
    }

    reachFlag(player, flagSprite) { 
        if (this.levelOver) return;
        this.levelOver = true;
        this.isGamePaused = true;

        if (my.sprite.player?.body) { 
            my.sprite.player.body.setAccelerationX(0).setVelocity(0,0); 
            my.sprite.player.anims.play('idle'); 
        }
        if (this.walkSound?.isPlaying) this.walkSound.stop(); 
        this.sound.stopAll(); 
        this.physics.pause(); 
        if (this.input?.keyboard) this.input.keyboard.enabled = false; 

        this.cameras.main.fadeOut(500, 50, 50, 78, (camera, progress) => { 
            if (progress === 1) { 
                this.scene.start('EndScreenScene', {
                score: this.score,
                currentLevelKey: 'Level2Scene', 
                nextLevelKey: 'Level3Scene'             
                });
            }
        });
    }

    handlePlayerDeath(player, deathBox) { 
        if (this.levelOver) return; 
        this.levelOver = true; 
        if (player?.body) { 
            player.body.setAccelerationX(0).setVelocity(0, 0); 
            player.anims.play('idle'); 
        }
        if (this.walkSound?.isPlaying) this.walkSound.stop(); 
        this.sound.stopAll(); 
        this.physics.pause(); 
        if (this.input?.keyboard) this.input.keyboard.enabled = false; 
        this.cameras.main.fadeOut(500, 0, 0, 0, (camera, progress) => { 
            if (progress === 1) { 
                this.scene.restart({ score: this.score > 50 ? this.score - 50 : 0 });
            }
        });
    }

    handlePlayerEnemyCollision(player, enemy) { 
        if (this.levelOver || !enemy.active) return; 
        this.levelOver = true; 
        this.isGamePaused = true; 
        if (player?.body) { 
            player.body.setAccelerationX(0).setVelocity(0, -200); 
            player.anims.stop(); 
        }
        if (this.walkSound?.isPlaying) this.walkSound.stop(); 
        this.sound.stopAll(); 
        this.physics.pause(); 
        if (this.input?.keyboard) this.input.keyboard.enabled = false; 
        this.cameras.main.fadeOut(500, 0, 0, 0, (camera, progress) => { 
            if (progress === 1) { 
                this.scene.restart({ score: this.score > 20 ? this.score - 20 : 0 });
            }
        });
    }

    handleProjectileEnemyCollision(projectile, enemy) { 
        if (!projectile.active || !enemy.active) return; 
        projectile.setActive(false).setVisible(false).body.stop(); 
        enemy.setActive(false).setVisible(false).body.enable = false; 
        this.score += 25; 
        if (this.scoreText) this.scoreText.setText('Score: ' + this.score); 
    }
}