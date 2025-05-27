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

          enemy.setScale(0.6);
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
        X_POSITION.CENTER,
        Y_POSITION.BOTTOM - 200,
        "char"
      );

      activeScene.physics.add.collider(
        activeScene.player,
        activeScene.platforms
      );
      activeScene.player.setGravity(0, 500);
      activeScene.player.setBounce(0.2);
      activeScene.player.setCollideWorldBounds(true);
      activeScene.player.setVisible(false);
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
      activeScene.gameState = "playing";
      activeScene.gameStarted = true;

      // Hide all menu elements
      activeScene.playButton.setVisible(false);
      activeScene.gameOverImage.setVisible(false);
      activeScene.restartButton.setVisible(false);
      activeScene.gameCompleteImage.setVisible(false);
      activeScene.finalScoreText.setVisible(false);
      activeScene.playAgainButton.setVisible(false);

      // Show game elements
      // Show game elements
      activeScene.coinPanel.setVisible(true);
      activeScene.coinText.setVisible(true);
      activeScene.levelText.setVisible(true);
      activeScene.player.setVisible(true);

      // Tampilkan joystick hanya jika perangkat touch
      if (activeScene.isTouchDevice()) {
        activeScene.showJoystick();
      }

      // Start music
      activeScene.music_play.play();

      // Start music
      activeScene.music_play.play();

      // Initialize game - start from level 1
      activeScene.currentLevel = 1;
      activeScene.countCoin = 0;
      activeScene.coinText.setText("0");
      activeScene.levelText.setText("Level: " + activeScene.currentLevel);

      // Prepare world and set up collisions
      activeScene.prepareWorld();
      activeScene.setupCollisions();

      // Reset player position
      activeScene.player.setPosition(
        X_POSITION.CENTER,
        Y_POSITION.BOTTOM - 200
      );
      activeScene.player.setVelocity(0, 0);
      activeScene.player.clearTint();
    };

    this.restartGame = function () {
      activeScene.startGame();
    };

    this.showGameOver = function () {
      activeScene.gameState = "gameover";
      activeScene.gameStarted = false;

      // Stop music
      activeScene.music_play.stop();

      // Hide game elements
      activeScene.coinPanel.setVisible(false);
      activeScene.coinText.setVisible(false);
      activeScene.levelText.setVisible(false);
      activeScene.player.setVisible(false);

      // Sembunyikan joystick
      activeScene.hideJoystick();

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

      // Stop music
      activeScene.music_play.stop();

      // Hide game elements
      activeScene.coinPanel.setVisible(false);
      activeScene.coinText.setVisible(false);
      activeScene.levelText.setVisible(false);
      activeScene.player.setVisible(false);

      // Sembunyikan joystick
      activeScene.hideJoystick();

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
      // Clear existing collision detection
      activeScene.physics.world.removeAllListeners();

      // Set up collision detection
      activeScene.physics.add.overlap(
        activeScene.player,
        activeScene.coins,
        activeScene.collectCoin,
        null,
        activeScene
      );
      activeScene.physics.add.collider(
        activeScene.player,
        activeScene.enemies,
        activeScene.hitEnemy,
        null,
        activeScene
      );
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
            activeScene.player.setPosition(
              X_POSITION.CENTER,
              Y_POSITION.BOTTOM - 200
            );
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

    // Virtual Controller (Tombol Lingkaran Berwarna)
    this.joystick = {
      left: { active: false },
      right: { active: false },
      jump: { active: false },
    };

    const screenWidth = this.sys.game.canvas.width;
    const screenHeight = this.sys.game.canvas.height;
    const radius = 40;
    const padding = 20;

    function createButton(scene, x, y, color, labelText) {
      const container = scene.add.container(x, y);
      const bg = scene.add
        .circle(0, 0, radius, color)
        .setInteractive()
        .setDepth(1000);
      const label = scene.add
        .text(0, 0, labelText, {
          fontSize: "24px",
          color: "#ffffff",
          fontStyle: "bold",
        })
        .setOrigin(0.5)
        .setDepth(1001);
      container.add([bg, label]);
      container.setDepth(1000);
      container.setVisible(false); // TAMBAH BARIS INI
      return { container, bg };
    }

    this.anims.create({
      key: "left",
      frames: this.anims.generateFrameNumbers("char", { start: 0, end: 3 }),
      frameRate: 10,
      repeat: -1,
    });

    this.anims.create({
      key: "turn",
      frames: [{ key: "char", frame: 4 }],
      frameRate: 20,
    });

    this.anims.create({
      key: "right",
      frames: this.anims.generateFrameNumbers("char", { start: 5, end: 8 }),
      frameRate: 10,
      repeat: -1,
    });

    // Tombol Kiri
    this.joystick.leftButton = createButton(
      this,
      padding + radius,
      screenHeight - radius - padding,
      0x3498db,
      "←"
    );
    // Tombol Kanan
    this.joystick.rightButton = createButton(
      this,
      padding + radius * 3 + 20,
      screenHeight - radius - padding,
      0x2ecc71,
      "→"
    );
    // Tombol Lompat
    this.joystick.jumpButton = createButton(
      this,
      screenWidth - radius - padding,
      screenHeight - radius - padding,
      0xe67e22,
      "↑"
    );

    // Event Tombol
    const setTouchEvents = (button, key) => {
      button.bg.on("pointerdown", () => (this.joystick[key].active = true));
      button.bg.on("pointerup", () => (this.joystick[key].active = false));
      button.bg.on("pointerout", () => (this.joystick[key].active = false)); // jika jari keluar dari tombol
    };

    setTouchEvents(this.joystick.leftButton, "left");
    setTouchEvents(this.joystick.rightButton, "right");
    setTouchEvents(this.joystick.jumpButton, "jump");

    // Fungsi untuk menampilkan/menyembunyikan joystick
    this.showJoystick = function () {
      activeScene.joystick.leftButton.container.setVisible(true);
      activeScene.joystick.rightButton.container.setVisible(true);
      activeScene.joystick.jumpButton.container.setVisible(true);
    };

    this.hideJoystick = function () {
      activeScene.joystick.leftButton.container.setVisible(false);
      activeScene.joystick.rightButton.container.setVisible(false);
      activeScene.joystick.jumpButton.container.setVisible(false);
    };

    // Deteksi perangkat touch
    this.isTouchDevice = function () {
      return (
        "ontouchstart" in window ||
        navigator.maxTouchPoints > 0 ||
        navigator.msMaxTouchPoints > 0
      );
    };
  },

  update: function () {
    if (!this.gameStarted || this.gameState !== "playing") return;

    // Movement tracking
    let isMoving = false;
    const speed = 200;

    // Check both keyboard and joystick input
    const leftPressed = this.cursors.left.isDown || this.joystick.left.active;
    const rightPressed =
      this.cursors.right.isDown || this.joystick.right.active;
    const jumpPressed =
      (this.cursors.up.isDown || this.joystick.jump.active) &&
      this.player.body.touching.down;

    // Handle horizontal movement
    if (rightPressed) {
      this.player.setVelocityX(speed);
      this.player.anims.play("right", true);
      isMoving = true;
    } else if (leftPressed) {
      this.player.setVelocityX(-speed);
      this.player.anims.play("left", true);
      isMoving = true;
    } else {
      this.player.setVelocityX(0);
      this.player.anims.play("front");
      isMoving = false;
    }

    // Handle jumping
    if (jumpPressed) {
      this.player.setVelocityY(-420);
      this.snd_jump.play();

      if (this.isWalkingSoundPlaying) {
        this.snd_walk.stop();
        this.isWalkingSoundPlaying = false;
      }
    }

    // Walking sound management
    if (isMoving && this.player.body.touching.down) {
      if (!this.isWalkingSoundPlaying) {
        this.snd_walk.play();
        this.isWalkingSoundPlaying = true;
      }
    } else {
      if (this.isWalkingSoundPlaying) {
        this.snd_walk.stop();
        this.isWalkingSoundPlaying = false;
      }
    }

    // Enemy AI - simple patrol behavior
    if (this.enemies) {
      this.enemies.children.iterate(function (enemy) {
        if (enemy && enemy.active) {
          // Simple patrol behavior
          if (enemy.patrol) {
            enemy.setVelocityX(enemy.patrol.speed * enemy.patrol.direction);

            // Cek jika musuh stuck (kecepatan 0 terlalu lama)
            if (Math.abs(enemy.body.velocity.x) < 1) {
              enemy.patrol.direction *= -1;
              enemy.setVelocityX(enemy.patrol.speed * enemy.patrol.direction);
            }

            // Change direction at world bounds or randomly
            if (
              enemy.x <= 50 ||
              enemy.x >= enemy.scene.sys.game.canvas.width - 50
            ) {
              enemy.patrol.direction *= -1;
            }

            // Occasionally change direction
            if (Phaser.Math.Between(1, 1000) < 8) {
              enemy.patrol.direction *= -1;
            }
          }
        }
      });
    }

    // Game over condition - player falls off screen
    if (this.player.y > this.sys.game.canvas.height + 100) {
      this.sound.stopAll();
      this.snd_lose.play();

      this.time.delayedCall(2000, () => {
        this.physics.resume();
        this.showGameOver();
      });
    }
  },
});
