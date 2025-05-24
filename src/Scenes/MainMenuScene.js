// MainMenuScene.js
class MainMenuScene extends Phaser.Scene {
    constructor() {
        super("MainMenuScene");
    }

    preload() {
    }

    create() {
        this.cameras.main.setBackgroundColor('#2c3e50');

        const centerX = this.cameras.main.worldView.x + this.cameras.main.width / 2;
        const centerY = this.cameras.main.worldView.y + this.cameras.main.height / 2;

        // Game Title
        this.add.text(centerX, centerY - 200, 'Fairy Jumper', {
            fontSize: '64px',
            fill: '#ffffff', // White
            fontFamily: 'Arial, sans-serif',
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 6
        }).setOrigin(0.5);

        // Start Button
        const startButton = this.add.text(centerX, centerY - 50, 'Start Game', {
            fontSize: '48px',
            fill: '#2ecc71', // Green
            backgroundColor: '#ffffff',
            padding: { left: 30, right: 30, top: 15, bottom: 15 },
            fontFamily: 'Arial, sans-serif',
            fontStyle: 'bold',
            shadow: { offsetX: 2, offsetY: 2, color: '#000000', blur: 4, stroke: true, fill: true }
        })
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true });

        startButton.on('pointerover', () => startButton.setStyle({ fill: '#27ae60' }));
        startButton.on('pointerout', () => startButton.setStyle({ fill: '#2ecc71' }));
        startButton.on('pointerdown', () => {
            this.cameras.main.fadeOut(300, 0, 0, 0);
            this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
                this.scene.start('loadScene'); 
            });
        });

        // Controls Button
        const controlsButton = this.add.text(centerX, centerY + 70, 'Controls', {
            fontSize: '48px',
            fill: '#e67e22', // Orange
            backgroundColor: '#ffffff',
            padding: { left: 30, right: 30, top: 15, bottom: 15 },
            fontFamily: 'Arial, sans-serif',
            fontStyle: 'bold',
            shadow: { offsetX: 2, offsetY: 2, color: '#000000', blur: 4, stroke: true, fill: true }
        })
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true });

        controlsButton.on('pointerover', () => controlsButton.setStyle({ fill: '#d35400' }));
        controlsButton.on('pointerout', () => controlsButton.setStyle({ fill: '#e67e22' }));
        controlsButton.on('pointerdown', () => {
            this.cameras.main.fadeOut(300, 0, 0, 0);
            this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
                this.scene.start('controlsScene');
            });
        });

        this.cameras.main.fadeIn(500, 0, 0, 0);
    }
}