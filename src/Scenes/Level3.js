// Level3.js
class Level3 extends Phaser.Scene {
    constructor() {
        super("Level3Scene");
        this.score = 0;
        this.flagToggleTimer = 0;
        this.flagAnimationDelay = 250;
        this.isFlag1Visible = true;
        this.isGamePaused = false;
        this.levelOver = false;
        this.enemies = null;

        this.walkSound = null;
        this.jumpSound = null;
        this.gemSound = null;

        this.PROJECTILE_SPEED = 600;
        this.projectileCooldown = 0;
        this.PROJECTILE_COOLDOWN_MS = 250;
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
        this.flagToggleTimer = 0;
    }

    create() {
        if (this.input && this.input.keyboard) {
            this.input.keyboard.enabled = true;
        }

        this.map = this.add.tilemap("Level_3", 18, 18, 45, 25);
        this.tileset = this.map.addTilesetImage("Tilemap", "tilemap_tiles");
        this.tilesetBack = this.map.addTilesetImage("Tilemap_Backgrounds", "tilemap_tiles_background");

        this.backgroundLayer = this.map.createLayer("background", this.tilesetBack, 0, 0);
        this.foilageLayer = this.map.createLayer("Foilage", this.tileset, 0, 0);
        this.groundLayer = this.map.createLayer("Ground_Platforms", this.tileset, 0, 0);

        this.backgroundLayer?.setScale(SCALE).setDepth(-1);
        this.foilageLayer?.setScale(SCALE);
        if (this.groundLayer) {
            this.groundLayer.setScale(SCALE);
            this.groundLayer.setCollisionByProperty({ collision: true });
        } else {
            console.warn("Tilemap layer 'Ground_Platforms' not found in Level_3.tmj.");
        }

        // Player Setup
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
        if (deathBoxObjectLayer) {
            deathBoxObjectLayer.objects.forEach(deathBoxObj => {
                const boxX = (deathBoxObj.x * SCALE) + (deathBoxObj.width * SCALE / 2);
                const boxY = (deathBoxObj.y * SCALE) + (deathBoxObj.height * SCALE / 2);
                const deathZone = this.deathBoxes.create(boxX, boxY, null);
                deathZone.setSize(deathBoxObj.width * SCALE, deathBoxObj.height * SCALE).setVisible(false);
                deathZone.body.isSensor = true;
            });
            this.physics.add.overlap(my.sprite.player, this.deathBoxes, this.handlePlayerDeath, null, this);
        }

        // Gems
        this.gems = this.physics.add.group();
        const gemsLayer = this.map.getObjectLayer("Gems");
        if (gemsLayer) {
            gemsLayer.objects.forEach(obj => {
                const gem = this.gems.create(obj.x * SCALE + 17, obj.y * SCALE - 10, "tilemap_tiles", 67);
                gem.setScale(SCALE).body.setAllowGravity(false).setImmovable(true);
            });
        }

        // Enemies
        this.enemies = this.physics.add.group();
        const enemyLayer = this.map.getObjectLayer("Enemies");
        if (enemyLayer) {
            enemyLayer.objects.forEach(enemyObj => {
                const enemySprite = this.enemies.create(enemyObj.x * SCALE, enemyObj.y * SCALE - (18 * SCALE / 2), "platformer_characters", "tile_0015.png");
                enemySprite.setScale(SCALE).setCollideWorldBounds(true).anims.play('enemy_idle', true);
                enemySprite.setSize(14,15);
                enemySprite.setOffset(5,10);
                if (enemySprite.body) {
                    enemySprite.body.setAllowGravity(false);
                    enemySprite.body.setImmovable(true);
                }
            });
        }

        // Animated Flags
        this.flag1Group = this.physics.add.group({ allowGravity: false, immovable: true });
        const flag1Layer = this.map.getObjectLayer("Flag1");
        if (flag1Layer) {
            flag1Layer.objects.forEach(obj => {
                const flag1 = this.flag1Group.create(obj.x * SCALE + 25, obj.y * SCALE - 10, "tilemap_tiles", 111);
                flag1.setScale(SCALE).setVisible(this.isFlag1Visible);
            });
        }

        this.flag2Group = this.physics.add.group({ allowGravity: false, immovable: true });
        const flag2Layer = this.map.getObjectLayer("Flag2");
        if (flag2Layer) {
            flag2Layer.objects.forEach(obj => {
                const flag2 = this.flag2Group.create(obj.x * SCALE + 25, obj.y * SCALE - 10, "tilemap_tiles", 112);
                flag2.setScale(SCALE).setVisible(!this.isFlag1Visible);
            });
        }

        // Colliders & Overlaps
        this.physics.add.overlap(my.sprite.player, this.gems, this.collectGem, null, this);
        this.physics.add.overlap(my.sprite.player, this.flag1Group, this.reachFlag, null, this);
        this.physics.add.overlap(my.sprite.player, this.flag2Group, this.reachFlag, null, this);
        if (this.enemies.getChildren().length > 0) {
            this.physics.add.collider(this.enemies, this.groundLayer);
            this.physics.add.overlap(my.sprite.player, this.enemies, this.handlePlayerEnemyCollision, null, this);
        }

        cursors = this.input.keyboard.createCursorKeys();
        this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
        this.projectiles = this.physics.add.group({ defaultKey: 'kenny-particles', defaultFrame: 'flare_01.png', maxSize: 10 });
        this.physics.add.collider(this.projectiles, this.groundLayer, this.handleProjectileGroundCollision, null, this);

        if (this.enemies.getChildren().length > 0) {
            this.physics.add.collider(this.projectiles, this.enemies, this.handleProjectileEnemyCollision, null, this);
        }

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

        this.walkingParticles.setDepth(my.sprite.player.depth - 1);
        this.jumpParticles.setDepth(my.sprite.player.depth - 1);
        this.gemCollectParticles.setDepth(10);
        this.cameras.main.setBounds(0, 0, this.map.widthInPixels * SCALE, this.map.heightInPixels * SCALE).startFollow(my.sprite.player, true, 0.25, 0.25);
        this.physics.world.setBounds(0, 0, this.map.widthInPixels * SCALE, this.map.heightInPixels * SCALE);

        this.scoreText = this.add.text(20, 20, 'Score: ' + this.score, { 
            fontFamily: 'Arial, sans-serif', 
            fontSize: '28px', 
            fill: '#ffffff', 
            stroke: '#000000', 
            strokeThickness: 4 
        }).setScrollFactor(0).setDepth(100);

        this.walkSound = this.sound.add('sfx_walk', { loop: true, volume: 0.35 });
        this.gemSound = this.sound.add('sfx_gem_collect', { volume: 0.6 });
        this.jumpSound = this.sound.add('sfx_jump', { volume: 0.5 });
        this.input.keyboard.on('keydown-TAB', () => { 
            if(!this.levelOver){ 
                this.scene.launch('pauseScene', { 
                    currentLevelKey: 'Level3Scene' 
                }); 
                this.scene.pause();
            } 
        });

        this.events.on('resume', () => { 
            this.isGamePaused = false; 
            this.physics.resume(); 
            this.sound.resumeAll(); 
        });

        this.cameras.main.fadeIn(300, 0, 0, 0);
    }

    update(time, delta) {
        if (this.projectileCooldown > 0) {
            this.projectileCooldown -= delta;
        }

        if (this.isGamePaused || this.levelOver) {
            if (this.walkSound?.isPlaying) this.walkSound.stop();
            return;
        }

        const MAX_FALL_SPEED = 1000;
        if (my.sprite.player.body.velocity.y > MAX_FALL_SPEED) {
            my.sprite.player.body.velocity.y = MAX_FALL_SPEED;
        }

        if (Phaser.Input.Keyboard.JustDown(this.spaceKey)) {
            this.fireProjectile();
        }

        // Player Movement and Animation Logic 
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

        if (my.sprite.player.body.blocked.down) {
            if (playerIsMovingHorizontally) my.sprite.player.anims.play('walk', true);
            else my.sprite.player.anims.play('idle', true);
        } else {
            my.sprite.player.anims.play('jump', true);
        }

        if (my.sprite.player.body.blocked.down && Phaser.Input.Keyboard.JustDown(cursors.up)) {
            my.sprite.player.body.setVelocityY(this.JUMP_VELOCITY);
            this.jumpParticles.explode(10, my.sprite.player.x, my.sprite.player.y);
            this.jumpSound.play();
        }

        // Flag Animation Logic
        this.flagToggleTimer += delta;
        if (this.flagToggleTimer >= this.flagAnimationDelay) {
            this.flagToggleTimer = 0;
            this.isFlag1Visible = !this.isFlag1Visible;
            this.flag1Group?.getChildren().forEach(flag => flag.setVisible(this.isFlag1Visible));
            this.flag2Group?.getChildren().forEach(flag => flag.setVisible(!this.isFlag1Visible));
        }

        if (this.scoreText) {
            this.scoreText.x = this.cameras.main.width - this.scoreText.width - 20;
            this.scoreText.y = 20;
        }

    }

    fireProjectile() {
        if (this.projectileCooldown > 0) return;
        let projectile = this.projectiles.get(my.sprite.player.x, my.sprite.player.y);
        if (projectile) {
            projectile.setActive(true).setVisible(true).setScale(SCALE * 0.05);
            projectile.body.setAllowGravity(false).setSize(80, 80);
            const velocityX = my.sprite.player.flipX ? this.PROJECTILE_SPEED : -this.PROJECTILE_SPEED;
            projectile.setVelocity(velocityX, 0);
            this.projectileCooldown = this.PROJECTILE_COOLDOWN_MS;
        }
    }

    handleProjectileGroundCollision(projectile, groundTile) {
        projectile.setActive(false).setVisible(false).body.stop();
    }

    collectGem(player, gem) {
        gem.disableBody(true, true);
        this.gemCollectParticles.explode(15, gem.x, gem.y);
        this.gemSound.play();
        this.score += 10;
        this.scoreText.setText('Score: ' + this.score);
    }

    reachFlag(player, flagSprite) {
        if (this.levelOver) return;
        this.levelOver = true;
        this.isGamePaused = true;
        my.sprite.player.body.setVelocity(0,0).setAccelerationX(0);
        this.sound.stopAll();
        this.physics.pause();
        this.input.keyboard.enabled = false;
        
        this.cameras.main.fadeOut(500, 50, 50, 78, (camera, progress) => {
            if (progress === 1) {
                this.scene.start('EndScreenScene', {
                    score: this.score,
                    currentLevelKey: 'Level3Scene',
                    nextLevelKey: null
                });
            }
        });
    }

    handlePlayerDeath(player, deathBox) {
        if (this.levelOver) return;
        this.levelOver = true;
        this.isGamePaused = true;
        my.sprite.player.body.setVelocity(0, 0).setAccelerationX(0);
        this.sound.stopAll();
        this.physics.pause();
        this.input.keyboard.enabled = false;
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
        my.sprite.player.body.setVelocity(player.x < enemy.x ? -150 : 150, -250).setAccelerationX(0);
        my.sprite.player.anims.play('jump');
        this.sound.stopAll();
        this.physics.pause();
        this.input.keyboard.enabled = false;
        this.cameras.main.shake(200, 0.01);
        this.cameras.main.fadeOut(500, 0, 0, 0, (camera, progress) => {
            if (progress === 1) {
                this.scene.restart({ score: this.score > 20 ? this.score - 20 : 0 });
            }
        });
    }

    handleProjectileEnemyCollision(projectile, enemy) {
        if (!projectile.active || !enemy.active) return;
        projectile.setActive(false).setVisible(false).body.stop();
        enemy.disableBody(true, true);
        this.score += 25;
        this.scoreText.setText('Score: ' + this.score);
    }
}