// main.js
"use strict"

// game config
let config = {
    parent: 'phaser-game',
    type: Phaser.AUTO,
    width: window.innerWidth,
    height: window.innerHeight,
    render: {
        pixelArt: true
    },
    physics: {
        default: 'arcade',
        arcade: {
            debug: true,
            gravity: {
                x: 0,
                y: 0
            }
        }
    },
    scale: {
        mode: Phaser.Scale.RESIZE,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        parent: 'phaser-game',
    },
    fps: {
        forceSetTimeOut: true,
        target: 60
    },
    scene: [MainMenuScene, ControlsScene, Load, Level1,, Level2, Level3, PauseScene, EndScreenScene]
}

var cursors;
const SCALE = 2.0;
var my = {sprite: {}, text: {}};

const game = new Phaser.Game(config);