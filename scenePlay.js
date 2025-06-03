let game;
let joystickState = {
  left: { active: false },
  right: { active: false },
  jump: { active: false },
};

// Initialize game function
function initializeGame() {
  const config = {
    type: Phaser.AUTO,
    width: 1024,
    height: 768,
    parent: "game-container",
    physics: {
      default: "arcade",
      arcade: {
        debug: false,
      },
    },
    scene: scenePlay,
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
  };

  game = new Phaser.Game(config);
  setupMobileControls();
}

// Setup mobile control buttons
function setupMobileControls() {
  const buttons = {
    left: document.getElementById("gamepad-left"),
    right: document.getElementById("gamepad-right"),
    jump: document.getElementById("gamepad-jump"),
  };

  // Setup button event listeners
  Object.keys(buttons).forEach((key) => {
    const button = buttons[key];

    // Touch events
    button.addEventListener("touchstart", (e) => {
      e.preventDefault();
      joystickState[key].active = true;
      button.style.transform = "scale(0.9)";
      button.style.filter = "brightness(0.8)";
    });

    button.addEventListener("touchend", (e) => {
      e.preventDefault();
      joystickState[key].active = false;
      button.style.transform = "scale(1)";
      button.style.filter = "brightness(1)";
    });

    button.addEventListener("touchcancel", (e) => {
      e.preventDefault();
      joystickState[key].active = false;
      button.style.transform = "scale(1)";
      button.style.filter = "brightness(1)";
    });

    // Mouse events for desktop testing
    button.addEventListener("mousedown", (e) => {
      e.preventDefault();
      joystickState[key].active = true;
      button.style.transform = "scale(0.9)";
      button.style.filter = "brightness(0.8)";
    });

    button.addEventListener("mouseup", (e) => {
      e.preventDefault();
      joystickState[key].active = false;
      button.style.transform = "scale(1)";
      button.style.filter = "brightness(1)";
    });

    button.addEventListener("mouseleave", (e) => {
      joystickState[key].active = false;
      button.style.transform = "scale(1)";
      button.style.filter = "brightness(1)";
    });

    // Prevent context menu
    button.addEventListener("contextmenu", (e) => {
      e.preventDefault();
    });
  });
}

// Show/hide mobile controls
function showMobileControls() {
  const buttons = document.querySelectorAll(".game-button");
  buttons.forEach((button) => {
    button.style.display = "flex";
  });
}

function hideMobileControls() {
  const buttons = document.querySelectorAll(".game-button");
  buttons.forEach((button) => {
    button.style.display = "none";
  });
}

// Check if device is touch-enabled
function isTouchDevice() {
  return (
    "ontouchstart" in window ||
    navigator.maxTouchPoints > 0 ||
    navigator.msMaxTouchPoints > 0 ||
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    )
  );
}

var scenePlay = new Phaser.Class({
  Extends: Phaser.Scene,

  initialize: function () {
    Phaser.Scene.call(this, { key: "scenePlay" });
  },

  init: function (data) {
    // Start with level 1 by default
    this.startingLevel = 1;
  },

  preload: function () {
    this.load.setBaseURL("assets/");

    // Load images
    this.load.image("background", "images/BG.png");
    this.load.image("btn_play", "images/ButtonPlay.png");
    this.load.image("gameover", "images/GameOver.png");
    this.load.image("coin", "images/Koin.png");
    this.load.image("enemy1", "images/Musuh01.png");
    this.load.image("enemy2", "images/Musuh02.png");
    this.load.image("enemy3", "images/Musuh03.png");
    this.load.image("coin_panel", "images/PanelCoin.png");
    this.load.image("ground", "images/Tile50.png");
    this.load.image("winner", "images/CONGRATULATIONS.png");
    this.load.spritesheet("char", "images/CharaSpriteAnim.png", {
      frameWidth: 44.8,
      frameHeight: 93,
    });

    // Load audio
    this.load.audio("snd_coin", "audio/koin.mp3");
    this.load.audio("snd_lose", "audio/kalah.mp3");
    this.load.audio("snd_jump", "audio/lompat.mp3");
    this.load.audio("snd_leveling", "audio/ganti_level.mp3");
    this.load.audio("snd_walk", "audio/jalan.mp3");
    this.load.audio("snd_touch", "audio/touch.mp3");
    this.load.audio("music_play", "audio/music_play.mp3");
  },

  create: function () {
    // Layout and positioning setup
    let layoutSize = { w: 1024, h: 768 };

    let X_POSITION = {
      LEFT: 0,
      CENTER: this.sys.game.canvas.width / 2,
      RIGHT: this.sys.game.canvas.width,
    };
    let Y_POSITION = {
      TOP: 0,
      CENTER: this.sys.game.canvas.height / 2,
      BOTTOM: this.sys.game.canvas.height,
    };

    let relativeSize = {
      w: (this.sys.game.canvas.width - layoutSize.w) / 2,
      h: (this.sys.game.canvas.height - layoutSize.h) / 2,
    };

    let activeScene = this;

    // Game state variables
    this.currentLevel = this.startingLevel;
    this.countCoin = 0;
    this.gameStarted = false;
    this.gameState = "menu";

    // ====================
    // Sound System Setup
    // ====================

    this.music_play = this.sound.add("music_play");
    this.music_play.loop = true;
    this.music_play.setVolume(0.3);

    this.snd_coin = this.sound.add("snd_coin");
    this.snd_jump = this.sound.add("snd_jump");
    this.snd_leveling = this.sound.add("snd_leveling");
    this.snd_lose = this.sound.add("snd_lose");
    this.snd_touch = this.sound.add("snd_touch");

    this.snd_walk = this.sound.add("snd_walk");
    this.snd_walk.loop = true;
    this.snd_walk.setVolume(0.5);

    this.isWalkingSoundPlaying = false;

    // Background
    this.add.image(X_POSITION.CENTER, Y_POSITION.CENTER, "background");

    // ====================
    // UI Elements - PINDAHKAN KE ATAS SEBELUM DIGUNAKAN
    // ====================

    // Game Complete elements (dibuat di awal)
    this.gameCompleteImage = this.add
      .image(X_POSITION.CENTER, Y_POSITION.CENTER - 160, "winner")
      .setDepth(15)
      .setVisible(false)
      .setScale(0.3); // Add setScale to adjust the image size

    this.finalScoreText = this.add
      .text(X_POSITION.CENTER, Y_POSITION.CENTER, "Final Score: 0", {
        fontFamily: "Verdana, Arial",
        fontSize: "28px",
        color: "#ffffff",
        align: "center",
      })
      .setOrigin(0.5)
      .setDepth(15)
      .setVisible(false);

    this.playAgainButton = this.add
      .image(X_POSITION.CENTER, Y_POSITION.CENTER + 100, "btn_play")
      .setInteractive()
      .setDepth(15)
      .setVisible(false);

    this.playAgainButton.on("pointerdown", function () {
      activeScene.snd_touch.play();
      activeScene.restartGame();
    });

    // Play Button (initially visible)
    this.playButton = this.add
      .image(X_POSITION.CENTER, Y_POSITION.CENTER, "btn_play")
      .setInteractive()
      .setDepth(20);

    this.playButton.on("pointerdown", function () {
      activeScene.snd_touch.play();
      activeScene.startGame();
    });

    // Game Over elements (initially hidden)
    this.gameOverImage = this.add
      .image(X_POSITION.CENTER, Y_POSITION.CENTER - 150, "gameover")
      .setDepth(15)
      .setVisible(false);

    this.restartButton = this.add
      .image(X_POSITION.CENTER, Y_POSITION.CENTER + 80, "btn_play")
      .setInteractive()
      .setDepth(15)
      .setVisible(false);

    this.restartButton.on("pointerdown", function () {
      activeScene.snd_touch.play();
      activeScene.restartGame();
    });

    // Coin panel & text (initially hidden)
    this.coinPanel = this.add
      .image(X_POSITION.CENTER, 30, "coin_panel")
      .setDepth(10)
      .setVisible(false);

    this.coinText = this.add
      .text(X_POSITION.CENTER, 30, "0", {
        fontFamily: "Verdana, Arial",
        fontSize: "37px",
        color: "#adadad",
      })
      .setOrigin(0.5)
      .setDepth(10)
      .setVisible(false);

    // Level display (initially hidden)
    this.levelText = this.add
      .text(50, 30, "Level: " + this.currentLevel, {
        fontFamily: "Verdana, Arial",
        fontSize: "24px",
        color: "#ffffff",
      })
      .setDepth(10)
      .setVisible(false);

    // ====================
    // Platform System
    // ====================

    let groundTemp = this.add.image(0, 0, "ground").setVisible(false);
    let groundSize = {
      width: groundTemp.width,
      height: groundTemp.height,
    };

    this.platforms = this.physics.add.staticGroup();

    // Function to prepare world based on current level
    this.prepareWorld = function () {
      // Clear existing platforms except base ground
      activeScene.platforms.clear(true, true);

      // Always create base ground platforms
      for (let i = -4; i <= 4; i++) {
        activeScene.platforms.create(
          X_POSITION.CENTER + groundSize.width * i,
          Y_POSITION.BOTTOM - groundSize.height / 2,
          "ground"
        );
      }

      // Store platform positions for coin placement
      let platformPositions = [];

      // Level-specific platform layouts
      if (activeScene.currentLevel == 1) {
        let p1 = activeScene.platforms.create(
          150 + relativeSize.w,
          Y_POSITION.BOTTOM - 400,
          "ground"
        );
        platformPositions.push({ x: p1.x, y: p1.y - 60 });

        let p2 = activeScene.platforms.create(
          320 + relativeSize.w,
          Y_POSITION.BOTTOM - 250,
          "ground"
        );
        platformPositions.push({ x: p2.x, y: p2.y - 60 });

        let p3 = activeScene.platforms.create(
          490 + relativeSize.w,
          Y_POSITION.BOTTOM - 300,
          "ground"
        );
        platformPositions.push({ x: p3.x, y: p3.y - 60 });

        let p4 = activeScene.platforms.create(
          660 + relativeSize.w,
          Y_POSITION.BOTTOM - 200,
          "ground"
        );
        platformPositions.push({ x: p4.x, y: p4.y - 60 });

        let p5 = activeScene.platforms.create(
          820 + relativeSize.w,
          Y_POSITION.BOTTOM - 200,
          "ground"
        );
        platformPositions.push({ x: p5.x, y: p5.y - 60 });

        let pLow1 = activeScene.platforms.create(
          80 + relativeSize.w,
          Y_POSITION.BOTTOM - 75,
          "ground"
        );
        platformPositions.push({ x: pLow1.x, y: pLow1.y - 60 });
      } else if (activeScene.currentLevel == 2) {
        let p1 = activeScene.platforms.create(
          80 + relativeSize.w,
          Y_POSITION.BOTTOM - 130,
          "ground"
        );
        platformPositions.push({ x: p1.x, y: p1.y - 60 });

        let p2 = activeScene.platforms.create(
          280 + relativeSize.w,
          Y_POSITION.BOTTOM - 280,
          "ground"
        );
        platformPositions.push({ x: p2.x, y: p2.y - 60 });

        let p3 = activeScene.platforms.create(
          420 + relativeSize.w,
          Y_POSITION.BOTTOM - 180,
          "ground"
        );
        platformPositions.push({ x: p3.x, y: p3.y - 60 });

        let p4 = activeScene.platforms.create(
          560 + relativeSize.w,
          Y_POSITION.BOTTOM - 340,
          "ground"
        );
        platformPositions.push({ x: p4.x, y: p4.y - 60 });

        let p5 = activeScene.platforms.create(
          700 + relativeSize.w,
          Y_POSITION.BOTTOM - 290,
          "ground"
        );
        platformPositions.push({ x: p5.x, y: p5.y - 60 });

        let p6 = activeScene.platforms.create(
          840 + relativeSize.w,
          Y_POSITION.BOTTOM - 240,
          "ground"
        );
        platformPositions.push({ x: p6.x, y: p6.y - 60 });

        let pLow2 = activeScene.platforms.create(
          930 + relativeSize.w,
          Y_POSITION.BOTTOM - 75,
          "ground"
        );
        platformPositions.push({ x: pLow2.x, y: pLow2.y - 60 });
      } else {
        let p1 = activeScene.platforms.create(
          180 + relativeSize.w,
          Y_POSITION.BOTTOM - 250,
          "ground"
        );
        platformPositions.push({ x: p1.x, y: p1.y - 60 });

        let p2 = activeScene.platforms.create(
          350 + relativeSize.w,
          Y_POSITION.BOTTOM - 360,
          "ground"
        );
        platformPositions.push({ x: p2.x, y: p2.y - 60 });

        let p3 = activeScene.platforms.create(
          520 + relativeSize.w,
          Y_POSITION.BOTTOM - 200,
          "ground"
        );
        platformPositions.push({ x: p3.x, y: p3.y - 60 });

        let p4 = activeScene.platforms.create(
          670 + relativeSize.w,
          Y_POSITION.BOTTOM - 320,
          "ground"
        );
        platformPositions.push({ x: p4.x, y: p4.y - 60 });

        let p5 = activeScene.platforms.create(
          940 + relativeSize.w,
          Y_POSITION.BOTTOM - 200,
          "ground"
        );
        platformPositions.push({ x: p5.x, y: p5.y - 60 });

        let pLow1 = activeScene.platforms.create(
          90 + relativeSize.w,
          Y_POSITION.BOTTOM - 75,
          "ground"
        );
        platformPositions.push({ x: pLow1.x, y: pLow1.y - 60 });

        let pLow2 = activeScene.platforms.create(
          780 + relativeSize.w,
          Y_POSITION.BOTTOM - 100,
          "ground"
        );
        platformPositions.push({ x: pLow2.x, y: pLow2.y - 60 });
      }

      // Create coins
      if (activeScene.coins) {
        activeScene.coins.clear(true, true);
      }

      activeScene.coins = activeScene.physics.add.group();

      platformPositions.forEach((pos, index) => {
        let coin = activeScene.coins.create(pos.x, pos.y, "coin");
        coin.setBounceY(0.1);
        coin.setGravityY(300);

        if (
          index % 2 === 0 &&
          pos.x > 100 &&
          pos.x < activeScene.sys.game.canvas.width - 100
        ) {
          let extraCoin = activeScene.coins.create(pos.x + 60, pos.y, "coin");
          extraCoin.setBounceY(0.1);
          extraCoin.setGravityY(300);
        }
      });

      for (let i = 0; i < 4; i++) {
        let x = 200 + i * 150 + relativeSize.w;
        if (x < activeScene.sys.game.canvas.width - 100) {
          let coin = activeScene.coins.create(
            x,
            Y_POSITION.BOTTOM - 100,
            "coin"
          );
          coin.setBounceY(0.1);
          coin.setGravityY(300);
        }
      }

      activeScene.physics.add.collider(
        activeScene.coins,
        activeScene.platforms
      );

      // Create enemies
      if (activeScene.enemies) {
        activeScene.enemies.clear(true, true);
      }

      activeScene.enemies = activeScene.physics.add.group();
      activeScene.physics.add.collider(
        activeScene.enemies,
        activeScene.platforms
      );

      if (activeScene.currentLevel >= 2) {
        let enemyCount = activeScene.currentLevel >= 3 ? 3 : 2;

        for (let i = 0; i < enemyCount; i++) {
          let x = Phaser.Math.Between(
            200 + relativeSize.w,
            activeScene.sys.game.canvas.width - 200
          );
          let enemyType = "enemy" + Phaser.Math.Between(1, 3);
          let enemy = activeScene.enemies.create(x, 100, enemyType);

          enemy.setScale(0.5);
          enemy.setBounce(0.8);
          enemy.setCollideWorldBounds(true);
          enemy.setVelocity(Phaser.Math.Between(-120, 120), 20);
          enemy.setGravityY(300);

          enemy.patrol = {
            direction: Phaser.Math.Between(0, 1) ? 1 : -1,
            speed: Phaser.Math.Between(60, 120),
          };
        }
      }
    };

    // ====================
    // Player Character
    // ====================

    this.createPlayer = function () {
      if (activeScene.player) {
        activeScene.player.destroy();
      }

      activeScene.player = activeScene.physics.add.sprite(
        100,
        Y_POSITION.BOTTOM - 200,
        "char"
      );

      activeScene.physics.add.collider(
        activeScene.player,
        activeScene.platforms
      );

      // PERBAIKAN: Tingkatkan gravity untuk turun lebih cepat
      activeScene.player.body.setGravityY(300); // Dari 300 ke 500
      activeScene.player.setBounce(0.1); // Kurangi bounce dari 0.2 ke 0.1
      activeScene.player.setCollideWorldBounds(true);
      activeScene.player.setVisible(false);

      // Pastikan velocity awal adalah 0
      activeScene.player.setVelocity(0, 0);
    };

    this.createPlayer();
    this.cursors = this.input.keyboard.createCursorKeys();

    // Character animations
    this.anims.create({
      key: "left",
      frames: this.anims.generateFrameNumbers("char", { start: 0, end: 3 }),
      frameRate: 12,
      repeat: -1,
    });

    this.anims.create({
      key: "front",
      frames: [{ key: "char", frame: 4 }],
      frameRate: 20,
    });

    this.anims.create({
      key: "right",
      frames: this.anims.generateFrameNumbers("char", { start: 5, end: 8 }),
      frameRate: 10,
      repeat: -1,
    });

    // ====================
    // Game Control Functions - DEFINISIKAN HANYA SEKALI
    // ====================

    this.startGame = function () {
      // PERBAIKAN: Reset semua state dengan benar
      activeScene.gameState = "playing";
      activeScene.gameStarted = true;
      activeScene.gameActive = true; // Tambahkan ini

      // PERBAIKAN: Pastikan physics aktif
      if (activeScene.physics.world.isPaused) {
        activeScene.physics.resume();
      }

      // Hide all menu elements
      activeScene.playButton.setVisible(false);
      activeScene.gameOverImage.setVisible(false);
      activeScene.restartButton.setVisible(false);
      activeScene.gameCompleteImage.setVisible(false);
      activeScene.finalScoreText.setVisible(false);
      activeScene.playAgainButton.setVisible(false);

      // Show game elements
      activeScene.coinPanel.setVisible(true);
      activeScene.coinText.setVisible(true);
      activeScene.levelText.setVisible(true);
      activeScene.player.setVisible(true);

      // Tampilkan joystick hanya jika perangkat touch
      if (activeScene.isTouchDevice()) {
        activeScene.showJoystick();
      }

      // PERBAIKAN: Stop music sebelum play untuk menghindari overlap
      activeScene.music_play.stop();
      activeScene.music_play.play();

      // Initialize game - start from level 1
      activeScene.currentLevel = 1;
      activeScene.countCoin = 0;
      activeScene.coinText.setText("0");
      activeScene.levelText.setText("Level: " + activeScene.currentLevel);

      // PERBAIKAN: Reset player terlebih dahulu
      activeScene.resetPlayer();

      // Prepare world and set up collisions
      activeScene.prepareWorld();
      activeScene.setupCollisions();
    };

    this.resetPlayer = function () {
      if (activeScene.player) {
        // Reset posisi dan velocity
        activeScene.player.setPosition(30, Y_POSITION.BOTTOM - 200);
        activeScene.player.setVelocity(0, 0);
        activeScene.player.clearTint();

        // PERBAIKAN: Pastikan physics body aktif
        activeScene.player.body.enable = true;
        activeScene.player.body.setGravityY(300);
        activeScene.player.setBounce(0.1);
        activeScene.player.setCollideWorldBounds(true);

        // Reset animation
        activeScene.player.anims.play("front");
      }
    };

    this.restartGame = function () {
      // PERBAIKAN: Cleanup dan reset sebelum start

      // Stop semua sound
      activeScene.sound.stopAll();
      activeScene.isWalkingSoundPlaying = false;

      // Reset physics jika ter-pause
      if (activeScene.physics.world.isPaused) {
        activeScene.physics.resume();
      }

      // Enable kembali physics bodies yang di-disable
      if (activeScene.player && activeScene.player.body) {
        activeScene.player.body.enable = true;
      }

      if (activeScene.enemies) {
        activeScene.enemies.children.entries.forEach((enemy) => {
          if (enemy && enemy.body) {
            enemy.body.enable = true;
          }
        });
      }

      // Panggil startGame
      activeScene.startGame();
    };

    this.showGameOver = function () {
      activeScene.gameState = "gameover";
      activeScene.gameStarted = false;
      activeScene.gameActive = false;

      // Stop music dan semua sound
      activeScene.music_play.stop();
      activeScene.snd_walk.stop();
      activeScene.isWalkingSoundPlaying = false;

      // PERBAIKAN: Hentikan semua movement tanpa pause physics
      if (activeScene.player) {
        activeScene.player.setVelocity(0, 0);
        activeScene.player.body.enable = false; // Disable player physics body
      }

      // Stop all enemies
      if (activeScene.enemies) {
        activeScene.enemies.children.entries.forEach((enemy) => {
          if (enemy && enemy.body) {
            enemy.setVelocity(0, 0);
            enemy.body.enable = false;
          }
        });
      }

      // Hide game elements
      activeScene.coinPanel.setVisible(false);
      activeScene.coinText.setVisible(false);
      activeScene.levelText.setVisible(false);
      activeScene.player.setVisible(false);

      // Hide joystick
      if (activeScene.isTouchDevice()) {
        activeScene.hideJoystick();
      }

      // Hide game complete elements
      activeScene.gameCompleteImage.setVisible(false);
      activeScene.finalScoreText.setVisible(false);
      activeScene.playAgainButton.setVisible(false);

      // Show game over elements
      activeScene.gameOverImage.setVisible(true);
      activeScene.restartButton.setVisible(true);
    };

    this.showGameComplete = function () {
      activeScene.gameState = "completed";
      activeScene.gameStarted = false;
      activeScene.gameActive = false;

      // Stop music dan semua sound
      activeScene.music_play.stop();
      activeScene.snd_walk.stop();
      activeScene.isWalkingSoundPlaying = false;

      // PERBAIKAN: Sama seperti showGameOver, jangan pause physics
      if (activeScene.player) {
        activeScene.player.setVelocity(0, 0);
        activeScene.player.body.enable = false;
      }

      // Hide game elements
      activeScene.coinPanel.setVisible(false);
      activeScene.coinText.setVisible(false);
      activeScene.levelText.setVisible(false);
      activeScene.player.setVisible(false);

      // Hide joystick
      if (activeScene.isTouchDevice()) {
        activeScene.hideJoystick();
      }

      // Show game complete elements
      activeScene.gameCompleteImage.setVisible(true);
      activeScene.finalScoreText.setText(
        "Final Score: " + activeScene.countCoin
      );
      activeScene.finalScoreText.setVisible(true);
      activeScene.playAgainButton.setVisible(true);

      // Play level completion sound
      activeScene.snd_leveling.play();
    };
    // ====================
    // Collision Functions
    // ====================

    this.setupCollisions = function () {
      // PERBAIKAN: Jangan hapus semua listeners, hanya cleanup yang spesifik

      // Hapus overlap/collision yang sudah ada untuk objek game ini saja
      if (activeScene.coinOverlap) {
        activeScene.coinOverlap.destroy();
      }
      if (activeScene.enemyCollider) {
        activeScene.enemyCollider.destroy();
      }

      // Set up collision detection yang baru
      activeScene.coinOverlap = activeScene.physics.add.overlap(
        activeScene.player,
        activeScene.coins,
        activeScene.collectCoin,
        null,
        activeScene
      );

      activeScene.enemyCollider = activeScene.physics.add.collider(
        activeScene.player,
        activeScene.enemies,
        activeScene.hitEnemy,
        null,
        activeScene
      );

      // PERBAIKAN: Pastikan collision player-platform tetap ada
      if (!activeScene.playerPlatformCollider) {
        activeScene.playerPlatformCollider = activeScene.physics.add.collider(
          activeScene.player,
          activeScene.platforms
        );
      }
    };

    // Coin collection function
    this.collectCoin = function (player, coin) {
      activeScene.countCoin += 10;
      activeScene.coinText.setText(activeScene.countCoin);
      coin.disableBody(true, true);
      activeScene.snd_coin.play();

      // Check for level completion
      if (activeScene.coins.countActive(true) === 0) {
        // Check if this is level 3 (final level)
        if (activeScene.currentLevel >= 3) {
          // Game completed! Show completion screen
          activeScene.time.delayedCall(1500, () => {
            activeScene.showGameComplete();
          });
        } else {
          // Continue to next level
          activeScene.currentLevel++;
          activeScene.levelText.setText("Level: " + activeScene.currentLevel);
          activeScene.snd_leveling.play();

          // Prepare next level after a short delay
          activeScene.time.delayedCall(1500, () => {
            activeScene.prepareWorld();
            activeScene.setupCollisions();
            // Reset player position
            activeScene.player.setPosition(30, Y_POSITION.BOTTOM - 200);
            activeScene.player.setVelocity(0, 0);
          });
        }
      }
    };

    // Enemy collision function
    this.hitEnemy = function (player, enemy) {
      // Pause physics
      activeScene.physics.pause();

      // Change player color to indicate hit
      activeScene.player.setTint(0xff0000);

      // Stop all sounds and play game over sound
      activeScene.sound.stopAll();
      activeScene.snd_lose.play();

      // Show game over screen after delay
      activeScene.time.delayedCall(2000, () => {
        activeScene.physics.resume();
        activeScene.showGameOver();
      });
    };

    // ====================
    // Virtual Controller System (Button di Luar Canvas)
    // ====================

    // Initialize joystick state
    this.joystick = {
      left: { active: false },
      right: { active: false },
      jump: { active: false },
    };

    // Konfigurasi untuk button external
    // ====================
    // Virtual Controller System dengan Ukuran Lebih Besar
    // ====================

    // Initialize joystick state
    this.joystick = {
      left: { active: false },
      right: { active: false },
      jump: { active: false },
    };

    // Konfigurasi untuk button external - DIPERBESAR dengan warna menarik
    const buttonConfig = {
      radius: 35, // Diperbesar dari 60 ke 80
      padding: 10, // Changed from 40 to 100 to move buttons lower
      spacing: 20, // Jarak antar button
      colors: {
        left: {
          primary: "#667eea", // Gradient purple-blue
          secondary: "#764ba2",
          shadow: "rgba(102, 126, 234, 0.4)",
        },
        right: {
          primary: "#f093fb", // Gradient pink-purple
          secondary: "#f5576c",
          shadow: "rgba(240, 147, 251, 0.4)",
        },
        jump: {
          primary: "#4facfe", // Gradient blue-cyan
          secondary: "#00f2fe",
          shadow: "rgba(79, 172, 254, 0.4)",
        },
      },
    };

    // Fungsi untuk membuat DOM button di luar canvas
    this.createExternalButton = function (id, text, color, position) {
      // Hapus button lama jika ada
      const existingBtn = document.getElementById(id);
      if (existingBtn) {
        existingBtn.remove();
      }

      const button = document.createElement("div");
      button.id = id;
      button.innerHTML = text;

      // Style untuk button - DIPERBESAR
      Object.assign(button.style, {
        position: "fixed",
        width: buttonConfig.radius * 2 + "px",
        height: buttonConfig.radius * 2 + "px",
        borderRadius: "50%",
        backgroundColor: color,
        color: "white",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "42px", // Diperbesar dari 32px ke 42px
        fontWeight: "bold",
        cursor: "pointer",
        userSelect: "none",
        zIndex: "1000",
        border: "4px solid rgba(255,255,255,0.4)", // Border lebih tebal
        boxShadow: "0 6px 20px rgba(0,0,0,0.4)", // Shadow lebih besar
        transition: "all 0.15s ease",
        left: position.x + "px",
        bottom: position.y + "px",
        display: "none", // Hidden by default
        // Tambahan untuk mobile
        touchAction: "manipulation",
        WebkitTouchCallout: "none",
        WebkitUserSelect: "none",
        KhtmlUserSelect: "none",
        MozUserSelect: "none",
        msUserSelect: "none",
      });

      // Hover effects - lebih responsif
      button.addEventListener("mouseenter", () => {
        button.style.transform = "scale(1.15)"; // Lebih besar saat hover
        button.style.boxShadow = "0 8px 25px rgba(0,0,0,0.5)";
      });

      button.addEventListener("mouseleave", () => {
        button.style.transform = "scale(1)";
        button.style.boxShadow = "0 6px 20px rgba(0,0,0,0.4)";
      });

      document.body.appendChild(button);
      return button;
    };

    // Buat button-button external dengan posisi yang lebih baik
    this.externalButtons = {
      left: this.createExternalButton(
        "gamepad-left",
        "←",
        buttonConfig.colors.left,
        {
          x: buttonConfig.padding,
          y: buttonConfig.padding,
        }
      ),
      right: this.createExternalButton(
        "gamepad-right",
        "→",
        buttonConfig.colors.right,
        {
          x:
            buttonConfig.padding +
            buttonConfig.radius * 2 +
            buttonConfig.spacing,
          y: buttonConfig.padding,
        }
      ),
      jump: this.createExternalButton(
        "gamepad-jump",
        "↑",
        buttonConfig.colors.jump,
        {
          x: window.innerWidth - buttonConfig.radius * 2 - buttonConfig.padding,
          y: buttonConfig.padding,
        }
      ),
    };

    // Set up event listeners untuk external buttons dengan feedback yang lebih baik
    const setupButtonEvents = (button, joystickKey) => {
      const activateButton = () => {
        activeScene.joystick[joystickKey].active = true;
        button.style.transform = "scale(0.9)"; // Efek tekan lebih terlihat
        button.style.backgroundColor = button.style.backgroundColor
          .replace(")", ", 0.7)")
          .replace("rgb", "rgba");
        button.style.boxShadow = "0 2px 10px rgba(0,0,0,0.6)";
      };

      const deactivateButton = () => {
        activeScene.joystick[joystickKey].active = false;
        button.style.transform = "scale(1)";
        button.style.backgroundColor = button.style.backgroundColor
          .replace(", 0.7)", ")")
          .replace("rgba", "rgb");
        button.style.boxShadow = "0 6px 20px rgba(0,0,0,0.4)";
      };

      // Mouse events
      button.addEventListener("mousedown", (e) => {
        e.preventDefault();
        activateButton();
      });

      button.addEventListener("mouseup", (e) => {
        e.preventDefault();
        deactivateButton();
      });

      button.addEventListener("mouseleave", (e) => {
        deactivateButton();
      });

      // Touch events - lebih responsif
      button.addEventListener("touchstart", (e) => {
        e.preventDefault();
        e.stopPropagation();
        activateButton();
      });

      button.addEventListener("touchend", (e) => {
        e.preventDefault();
        e.stopPropagation();
        deactivateButton();
      });

      button.addEventListener("touchcancel", (e) => {
        e.preventDefault();
        deactivateButton();
      });

      // Prevent context menu dan drag
      button.addEventListener("contextmenu", (e) => {
        e.preventDefault();
      });

      button.addEventListener("dragstart", (e) => {
        e.preventDefault();
      });
    };

    // Setup semua button events
    setupButtonEvents(this.externalButtons.left, "left");
    setupButtonEvents(this.externalButtons.right, "right");
    setupButtonEvents(this.externalButtons.jump, "jump");

    // Fungsi untuk menampilkan/menyembunyikan external buttons
    this.showJoystick = function () {
      Object.values(activeScene.externalButtons).forEach((button) => {
        button.style.display = "flex";
      });
    };

    this.hideJoystick = function () {
      Object.values(activeScene.externalButtons).forEach((button) => {
        button.style.display = "none";
      });
    };

    // Update posisi button saat window resize dengan ukuran yang responsive
    this.updateButtonPositions = function () {
      if (activeScene.externalButtons) {
        // Update jump button position
        activeScene.externalButtons.jump.style.left =
          window.innerWidth -
          buttonConfig.radius * 2 -
          buttonConfig.padding +
          "px";

        // Update right button position
        activeScene.externalButtons.right.style.left =
          buttonConfig.padding +
          buttonConfig.radius * 2 +
          buttonConfig.spacing +
          "px";
      }
    };

    // Listen untuk window resize
    window.addEventListener("resize", this.updateButtonPositions);

    // Deteksi perangkat touch dengan lebih akurat
    this.isTouchDevice = function () {
      return (
        "ontouchstart" in window ||
        navigator.maxTouchPoints > 0 ||
        navigator.msMaxTouchPoints > 0 ||
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
          navigator.userAgent
        )
      );
    };

    // Cleanup function untuk menghapus button saat scene destroyed
    this.events.on("destroy", () => {
      Object.values(this.externalButtons || {}).forEach((button) => {
        if (button && button.remove) {
          button.remove();
        }
      });
      window.removeEventListener("resize", this.updateButtonPositions);
    });
  },

  update: function () {
    if (!this.gameStarted || this.gameState !== "playing") return;

    // Player movement handling
    if (this.cursors.left.isDown || this.joystick.left.active) {
      this.player.setVelocityX(-210);
      this.player.anims.play("left", true);

      // Play walking sound
      if (!this.isWalkingSoundPlaying) {
        this.snd_walk.play();
        this.isWalkingSoundPlaying = true;
      }
    } else if (this.cursors.right.isDown || this.joystick.right.active) {
      this.player.setVelocityX(210);
      this.player.anims.play("right", true);

      // Play walking sound
      if (!this.isWalkingSoundPlaying) {
        this.snd_walk.play();
        this.isWalkingSoundPlaying = true;
      }
    } else {
      this.player.setVelocityX(0);
      this.player.anims.play("front");

      // Stop walking sound
      if (this.isWalkingSoundPlaying) {
        this.snd_walk.stop();
        this.isWalkingSoundPlaying = false;
      }
    }

    // Jumping
    if (
      (this.cursors.up.isDown || this.joystick.jump.active) &&
      this.player.body.touching.down
    ) {
      this.player.setVelocityY(-330);
      this.snd_jump.play();
    }

    // Enemy movement AI
    if (this.enemies) {
      this.enemies.children.entries.forEach((enemy) => {
        if (!enemy.active) return;

        // Simple patrol behavior
        if (enemy.patrol) {
          enemy.setVelocityX(enemy.patrol.speed * enemy.patrol.direction);

          // Change direction at world bounds or platform edges
          if (enemy.x <= 50 || enemy.x >= this.sys.game.canvas.width - 50) {
            enemy.patrol.direction *= -1;
          }

          // Random direction change occasionally
          if (Phaser.Math.Between(0, 200) === 1) {
            enemy.patrol.direction *= -1;
          }
        }
      });
    }
  },
});
