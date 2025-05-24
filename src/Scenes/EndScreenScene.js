// src/Scenes/EndScreenScene.js
class EndScreenScene extends Phaser.Scene {
    constructor() {
        super("EndScreenScene");
    }

    init(data) {
        this.finalScore = data.score !== undefined ? data.score : 0;
    }

    create() {
        this.cameras.main.setBackgroundColor('#1a1a2e');

        const centerX = this.cameras.main.worldView.x + this.cameras.main.width / 2;
        const centerY = this.cameras.main.worldView.y + this.cameras.main.height / 2;

        // Title Text
        this.add.text(centerX, centerY - 200, 'Level Complete!', {
            fontSize: '64px',
            fill: '#ffffff',
            fontFamily: 'Arial, sans-serif',
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 6
        }).setOrigin(0.5);

        // Score Text
        this.add.text(centerX, centerY - 80, 'Your Score: ' + this.finalScore, {
            fontSize: '48px',
            fill: '#ffd700', // Gold
            fontFamily: 'Arial, sans-serif',
            fontStyle: 'bold',
        }).setOrigin(0.5);

        // Restart Button
        const restartButton = this.add.text(centerX, centerY + 50, 'Restart Level', {
            fontSize: '40px',
            fill: '#2ecc71', // Green
            backgroundColor: '#ffffff',
            padding: { left: 25, right: 25, top: 12, bottom: 12 },
            fontFamily: 'Arial, sans-serif',
            fontStyle: 'bold',
            shadow: { offsetX: 2, offsetY: 2, color: '#000000', blur: 4, stroke: true, fill: true }
        })
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true });

        restartButton.on('pointerover', () => restartButton.setStyle({ fill: '#27ae60' }));
        restartButton.on('pointerout', () => restartButton.setStyle({ fill: '#2ecc71' }));
        restartButton.on('pointerdown', () => {
            this.cameras.main.fadeOut(300, 0, 0, 0);
            this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
                this.sound.stopAll(); 
                this.scene.start('platformerScene'); 
            });
        });

        // Main Menu Button
        const mainMenuButton = this.add.text(centerX, centerY + 150, 'Main Menu', {
            fontSize: '40px',
            fill: '#e74c3c', // Red
            backgroundColor: '#ffffff',
            padding: { left: 25, right: 25, top: 12, bottom: 12 },
            fontFamily: 'Arial, sans-serif',
            fontStyle: 'bold',
            shadow: { offsetX: 2, offsetY: 2, color: '#000000', blur: 4, stroke: true, fill: true }
        })
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true });

        mainMenuButton.on('pointerover', () => mainMenuButton.setStyle({ fill: '#c0392b' }));
        mainMenuButton.on('pointerout', () => mainMenuButton.setStyle({ fill: '#e74c3c' }));
        mainMenuButton.on('pointerdown', () => {
            this.cameras.main.fadeOut(300, 0, 0, 0);
            this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
                this.sound.stopAll(); 
                this.scene.start('MainMenuScene');
            });
        });

        this.cameras.main.fadeIn(500, 0, 0, 0); 
    }
}