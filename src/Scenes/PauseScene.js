// PauseScene.js
class PauseScene extends Phaser.Scene {
    constructor() {
        super("pauseScene");
    }

    create(data) {
        this.platformerSceneKey = data.platformerSceneKey || 'platformerScene'; 

        this.add.rectangle(0, 0, this.cameras.main.width, this.cameras.main.height, 0x000000, 0.65)
            .setOrigin(0, 0)
            .setScrollFactor(0);

        const centerX = this.cameras.main.worldView.x + this.cameras.main.width / 2;
        const centerY = this.cameras.main.worldView.y + this.cameras.main.height / 2;

        this.add.text(centerX, centerY - 150, 'Paused', {
            fontSize: '72px',
            fill: '#ffffff', // White
            fontFamily: 'Arial, sans-serif',
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 6
        }).setOrigin(0.5).setScrollFactor(0);

        // Continue Button
        const continueButton = this.add.text(centerX, centerY, 'Continue', {
            fontSize: '48px',
            fill: '#2ecc71', // Green
            backgroundColor: '#ffffff',
            padding: { left: 30, right: 30, top: 15, bottom: 15 },
            fontFamily: 'Arial, sans-serif',
            fontStyle: 'bold',
            shadow: { offsetX: 2, offsetY: 2, color: '#000000', blur: 4, stroke: true, fill: true }
        })
        .setOrigin(0.5)
        .setScrollFactor(0)
        .setInteractive({ useHandCursor: true });

        continueButton.on('pointerover', () => continueButton.setStyle({ fill: '#27ae60' }));
        continueButton.on('pointerout', () => continueButton.setStyle({ fill: '#2ecc71' }));
        continueButton.on('pointerdown', () => {
            this.scene.resume(this.platformerSceneKey); 
            this.scene.stop(); 
        });

        // Quit Button
        const quitButton = this.add.text(centerX, centerY + 120, 'Quit to Menu', {
            fontSize: '48px',
            fill: '#e74c3c', // Red
            backgroundColor: '#ffffff',
            padding: { left: 30, right: 30, top: 15, bottom: 15 },
            fontFamily: 'Arial, sans-serif',
            fontStyle: 'bold',
            shadow: { offsetX: 2, offsetY: 2, color: '#000000', blur: 4, stroke: true, fill: true }
        })
        .setOrigin(0.5)
        .setScrollFactor(0)
        .setInteractive({ useHandCursor: true });

        quitButton.on('pointerover', () => quitButton.setStyle({ fill: '#c0392b' }));
        quitButton.on('pointerout', () => quitButton.setStyle({ fill: '#e74c3c' }));
        quitButton.on('pointerdown', () => {
            this.scene.stop(this.platformerSceneKey); 
            this.scene.stop(); 
            this.scene.start('MainMenuScene');
        });
    }
}