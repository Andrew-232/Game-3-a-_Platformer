// ControlsScene.js
class ControlsScene extends Phaser.Scene {
    constructor() {
        super("controlsScene");
    }

    create() {
        this.cameras.main.setBackgroundColor('#34495e');

        const centerX = this.cameras.main.worldView.x + this.cameras.main.width / 2;
        const centerY = this.cameras.main.worldView.y + this.cameras.main.height / 2;

        this.add.text(centerX, centerY - 250, 'Controls', {
            fontSize: '56px',
            fill: '#ffffff',
            fontFamily: 'Arial, sans-serif',
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 5
        }).setOrigin(0.5);

        const controlsInfo = [
            "Up Arrow   :  Jump",
            "Left Arrow :  Move Left",
            "Right Arrow:  Move Right",
            "Tab Key    :  Pause Game"
        ];

        controlsInfo.forEach((text, index) => {
            this.add.text(centerX, centerY - 120 + (index * 60), text, {
                fontSize: '36px',
                fill: '#ecf0f1',
                fontFamily: 'Consolas, monospace',
            }).setOrigin(0.5);
        });

        // Back Button
        const backButton = this.add.text(centerX, centerY + 180, 'Back to Menu', {
            fontSize: '40px',
            fill: '#e74c3c',
            backgroundColor: '#ffffff',
            padding: { left: 25, right: 25, top: 12, bottom: 12 },
            fontFamily: 'Arial, sans-serif',
            fontStyle: 'bold',
            shadow: { offsetX: 2, offsetY: 2, color: '#000000', blur: 4, stroke: true, fill: true }
        })
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true });

        backButton.on('pointerover', () => backButton.setStyle({ fill: '#c0392b' }));
        backButton.on('pointerout', () => backButton.setStyle({ fill: '#e74c3c' }));
        backButton.on('pointerdown', () => {
            this.cameras.main.fadeOut(300, 0, 0, 0);
            this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
                this.scene.start('MainMenuScene');
            });
        });
        this.cameras.main.fadeIn(300, 0, 0, 0);
    }
}