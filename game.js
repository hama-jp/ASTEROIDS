var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var _a, _b;
// 効果音を管理するクラス
var SoundManager = /** @class */ (function () {
    function SoundManager() {
        this.sounds = {};
        // 効果音の読み込み
        this.loadSound('laser', 'sounds/laser.wav');
        this.loadSound('explosion', 'sounds/explosion.wav');
        this.loadSound('thruster', 'sounds/thruster.wav');
    }
    SoundManager.prototype.loadSound = function (name, path) {
        var audio = new Audio();
        audio.src = path;
        audio.preload = 'auto';
        audio.loop = name === 'thruster'; // thruster音はループ再生
        this.sounds[name] = audio;
    };
    SoundManager.prototype.play = function (name) {
        var sound = this.sounds[name];
        if (sound) {
            // 再生中なら最初から再生
            if (!sound.paused) {
                sound.currentTime = 0;
            }
            sound.play().catch(function (e) { return console.log("音声再生エラー:", e); });
        }
    };
    SoundManager.prototype.stop = function (name) {
        var sound = this.sounds[name];
        if (sound) {
            sound.pause();
            sound.currentTime = 0;
        }
    };
    SoundManager.prototype.isPlaying = function (name) {
        var sound = this.sounds[name];
        return sound ? !sound.paused : false;
    };
    return SoundManager;
}());
// ゲームの定数
var CANVAS_WIDTH = 800;
var CANVAS_HEIGHT = 600;
var SHIP_SIZE = 20;
var SHIP_SPEED = 2.5;
var ROTATION_SPEED = 0.003; // 姿勢制御スラスターの角加速度
var ROTATION_FRICTION = 0.95; // 回転摩擦（空気抵抗的な効果）
var MAX_ROTATION_SPEED = 0.15; // 最大回転速度制限
var RCS_THRUST_ARM = SHIP_SIZE * 0.7; // 回転スラスターの重心からの距離
var RCS_SIDE_THRUST = 0.008; // 回転スラスターの副次的な並進力（控えめに設定）
var FRICTION = 0.995;
var BULLET_SPEED = 10;
var ASTEROID_SPEED = 1.5; // 75%に減速（2 × 0.75 = 1.5）
var ASTEROID_SPEED_MIN = 0.5; // 最小速度倍率
var ASTEROID_SPEED_MAX = 2.5; // 最大速度倍率
var FAST_ASTEROID_CHANCE = 0.15; // 高速小惑星の出現確率
var ASTEROID_VERTICES = 10;
var ASTEROID_JAG = 0.4; // 頂点の凹凸の度合い(0-1)
var ASTEROID_SIZE = 100;
var ASTEROID_COUNT = 5;
var EXPLOSION_LINES = 12; // 爆発線の数
var EXPLOSION_DURATION = 30; // 爆発エフェクトの持続時間（フレーム）
// パワーアップタイプの定義
var PowerUpType;
(function (PowerUpType) {
    PowerUpType["SHIELD"] = "shield";
    PowerUpType["TRIPLE_SHOT"] = "triple_shot";
    PowerUpType["RAPID_FIRE"] = "rapid_fire";
    PowerUpType["SCORE_MULTIPLIER"] = "score_multiplier";
})(PowerUpType || (PowerUpType = {}));
// UFO敵キャラクターの型定義
var UFOType;
(function (UFOType) {
    UFOType["SMALL"] = "small";
    UFOType["LARGE"] = "large";
})(UFOType || (UFOType = {}));
// ゲーム状態
var ship;
var bullets = [];
var asteroids = [];
var explosionEffects = [];
// パワーアップ関連の変数
var powerUps = [];
var activePowerUps = [];
// パワーアップ設定
var POWER_UP_SIZE = 15;
var POWER_UP_SPAWN_CHANCE = 0.3; // 小惑星破壊時のスポーン確率
var POWER_UP_LIFETIME = 900; // 15秒（60fps想定）
var POWER_UP_SPEED = 0.5;
// パワーアップ効果時間（フレーム数）
var POWER_UP_DURATIONS = (_a = {},
    _a[PowerUpType.SHIELD] = 1200,
    _a[PowerUpType.TRIPLE_SHOT] = 960,
    _a[PowerUpType.RAPID_FIRE] = 720,
    _a[PowerUpType.SCORE_MULTIPLIER] = 840 // 14秒（倍）
,
    _a);
;
// UFO関連の変数
var ufos = [];
var ufoBullets = [];
var ufoSpawnTimer = 0;
// UFO設定
var UFO_SPAWN_INTERVAL = 1800; // 30秒（60fps想定）
var UFO_SPAWN_CHANCE = 0.3; // レベル3以降でのスポーン確率
var UFO_SETTINGS = (_b = {},
    _b[UFOType.SMALL] = {
        size: 15,
        health: 1,
        speed: 1.5,
        shootCooldown: 120, // 2秒
        changeDirectionInterval: 180, // 3秒
        points: 1000
    },
    _b[UFOType.LARGE] = {
        size: 25,
        health: 2,
        speed: 1.0,
        shootCooldown: 90, // 1.5秒
        changeDirectionInterval: 240, // 4秒
        points: 500
    },
    _b);
// UFO弾設定
var UFO_BULLET_SPEED = 3;
var UFO_BULLET_LIFE = 300; // 5秒
// ゲームジュース用の変数
var screenShake = null;
var particles = [];
var freezeFrames = 0;
// ゲームジュース設定
var SCREEN_SHAKE_INTENSITY = 8;
var SCREEN_SHAKE_DURATION = 40; // フレーム数
var FREEZE_FRAME_DURATION = 4; // フレーム数
var MAX_PARTICLES = 100;
var score = 0;
var lives = 3;
var level = 1;
var asteroidsDestroyed = 0;
var highScore = 0;
var gameOver = false;
var soundManager;
// DOM要素
var canvas = document.getElementById('gameCanvas');
var ctx = canvas.getContext('2d');
var scoreElement = document.getElementById('score');
var livesElement = document.getElementById('lives');
var levelElement = document.getElementById('level');
var highScoreElement = document.getElementById('high-score');
var gameOverElement = document.getElementById('game-over');
var finalScoreElement = document.getElementById('final-score');
var restartButton = document.getElementById('restart-button');
// キー状態管理
var keys = {};
// イベントリスナー
window.addEventListener('keydown', function (e) {
    keys[e.key] = true;
});
window.addEventListener('keyup', function (e) {
    keys[e.key] = false;
    // 上矢印キーが離されたら推進音を停止
    if (e.key === 'ArrowUp') {
        soundManager.stop('thruster');
    }
});
// ウィンドウリサイズイベントに対応
window.addEventListener('resize', function () {
    resizeCanvas();
});
restartButton.addEventListener('click', restartGame);
// ゲーム初期化
// キャンバスサイズをブラウザウィンドウに合わせて設定
// ハイスコア管理
function loadHighScore() {
    var saved = localStorage.getItem('asteroids-high-score');
    return saved ? parseInt(saved, 10) : 0;
}
function saveHighScore(score) {
    localStorage.setItem('asteroids-high-score', score.toString());
}
function updateHighScore() {
    if (score > highScore) {
        highScore = score;
        saveHighScore(highScore);
    }
}
function resizeCanvas() {
    var padding = 40; // 余白を確保
    CANVAS_WIDTH = window.innerWidth - padding;
    CANVAS_HEIGHT = window.innerHeight - padding;
    // 最小サイズを設定
    CANVAS_WIDTH = Math.max(CANVAS_WIDTH, 400);
    CANVAS_HEIGHT = Math.max(CANVAS_HEIGHT, 300);
    // キャンバス要素のサイズを更新
    canvas.width = CANVAS_WIDTH;
    canvas.height = CANVAS_HEIGHT;
    // 宇宙船が画面外にいる場合は中央に移動
    if (ship) {
        if (ship.position.x > CANVAS_WIDTH)
            ship.position.x = CANVAS_WIDTH / 2;
        if (ship.position.y > CANVAS_HEIGHT)
            ship.position.y = CANVAS_HEIGHT / 2;
    }
}
function initGame() {
    // 効果音マネージャーの初期化
    // キャンバスサイズを設定
    resizeCanvas();
    soundManager = new SoundManager();
    // ハイスコアを読み込み
    highScore = loadHighScore();
    // 宇宙船の初期化
    ship = {
        position: { x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT / 2 },
        velocity: { x: 0, y: 0 },
        rotation: 0,
        rotationVelocity: 0,
        thrusting: false
    };
    // 弾、小惑星、エフェクトの初期化
    bullets = [];
    asteroids = [];
    explosionEffects = [];
    // 初期小惑星を生成
    for (var i = 0; i < ASTEROID_COUNT; i++) {
        createAsteroid();
    }
    // スコアとライフのリセット
    score = 0;
    lives = 3;
    level = 1;
    asteroidsDestroyed = 0;
    gameOver = false;
    // UIの更新
    updateUI();
    gameOverElement.classList.add('hidden');
}
// 小惑星の生成
function createAsteroid() {
    // 画面端にランダムに生成
    var side = Math.floor(Math.random() * 4);
    var x, y;
    switch (side) {
        case 0: // 上
            x = Math.random() * CANVAS_WIDTH;
            y = -ASTEROID_SIZE;
            break;
        case 1: // 右
            x = CANVAS_WIDTH + ASTEROID_SIZE;
            y = Math.random() * CANVAS_HEIGHT;
            break;
        case 2: // 下
            x = Math.random() * CANVAS_WIDTH;
            y = CANVAS_HEIGHT + ASTEROID_SIZE;
            break;
        case 3: // 左
            x = -ASTEROID_SIZE;
            y = Math.random() * CANVAS_HEIGHT;
            break;
    }
    // ランダムな移動方向を設定（宇宙船に向かわない）
    // 画面端から入ってきた場合の自然な軌道を計算
    var angle;
    switch (side) {
        case 0: // 上から
            angle = Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 0.8; // 下方向中心に±72度
            break;
        case 1: // 右から
            angle = Math.PI + (Math.random() - 0.5) * Math.PI * 0.8; // 左方向中心に±72度
            break;
        case 2: // 下から  
            angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 0.8; // 上方向中心に±72度
            break;
        case 3: // 左から
            angle = 0 + (Math.random() - 0.5) * Math.PI * 0.8; // 右方向中心に±72度
            break;
    }
    // 速度バリエーション：通常・高速・低速の3種類
    var speedMultiplier;
    var speedType = Math.random();
    if (speedType < FAST_ASTEROID_CHANCE) {
        // 高速小惑星（15%の確率）
        speedMultiplier = ASTEROID_SPEED_MIN + (ASTEROID_SPEED_MAX - ASTEROID_SPEED_MIN) * (0.7 + Math.random() * 0.3);
    }
    else if (speedType < 0.35) {
        // 低速小惑星（20%の確率）
        speedMultiplier = ASTEROID_SPEED_MIN + (ASTEROID_SPEED_MAX - ASTEROID_SPEED_MIN) * Math.random() * 0.4;
    }
    else {
        // 通常速度（65%の確率）
        speedMultiplier = ASTEROID_SPEED_MIN + (ASTEROID_SPEED_MAX - ASTEROID_SPEED_MIN) * (0.3 + Math.random() * 0.5);
    }
    var speed = ASTEROID_SPEED * speedMultiplier;
    // 頂点の生成
    var vertices = [];
    var angleStep = (Math.PI * 2) / ASTEROID_VERTICES;
    for (var i = 0; i < ASTEROID_VERTICES; i++) {
        var radius = ASTEROID_SIZE / 2 * (0.8 + Math.random() * 0.4);
        vertices.push({
            x: Math.cos(angleStep * i) * radius,
            y: Math.sin(angleStep * i) * radius
        });
    }
    asteroids.push({
        position: { x: x, y: y },
        velocity: {
            x: Math.cos(angle) * speed,
            y: Math.sin(angle) * speed
        },
        radius: ASTEROID_SIZE / 2,
        angle: Math.random() * Math.PI * 2,
        vertices: vertices
    });
}
// 宇宙船の更新
// ===============================
// ユーティリティ関数
// ===============================
// 距離計算（衝突判定用）
function calculateDistance(obj1, obj2) {
    var dx = obj1.position.x - obj2.position.x;
    var dy = obj1.position.y - obj2.position.y;
    return Math.sqrt(dx * dx + dy * dy);
}
// 画面端ラップアラウンド処理（基本版）
function wrapAroundScreen(obj) {
    if (obj.position.x < 0)
        obj.position.x = CANVAS_WIDTH;
    if (obj.position.x > CANVAS_WIDTH)
        obj.position.x = 0;
    if (obj.position.y < 0)
        obj.position.y = CANVAS_HEIGHT;
    if (obj.position.y > CANVAS_HEIGHT)
        obj.position.y = 0;
}
// 画面端ラップアラウンド処理（サイズオフセット版）
function wrapAroundScreenWithSize(obj, size) {
    if (obj.position.x < -size)
        obj.position.x = CANVAS_WIDTH + size;
    if (obj.position.x > CANVAS_WIDTH + size)
        obj.position.x = -size;
    if (obj.position.y < -size)
        obj.position.y = CANVAS_HEIGHT + size;
    if (obj.position.y > CANVAS_HEIGHT + size)
        obj.position.y = -size;
}
// 位置更新処理
function updatePosition(obj) {
    obj.position.x += obj.velocity.x;
    obj.position.y += obj.velocity.y;
}
function updateShip() {
    // 姿勢制御スラスター（回転 + 副次的な並進力）
    if (keys['ArrowLeft']) {
        ship.rotationVelocity -= ROTATION_SPEED;
        // 左回転スラスター：宇宙船の右側面方向に力が発生
        var sideForceAngle = ship.rotation + Math.PI / 2; // 90度右回り
        ship.velocity.x += Math.cos(sideForceAngle) * RCS_SIDE_THRUST;
        ship.velocity.y += Math.sin(sideForceAngle) * RCS_SIDE_THRUST;
    }
    if (keys['ArrowRight']) {
        ship.rotationVelocity += ROTATION_SPEED;
        // 右回転スラスター：宇宙船の左側面方向に力が発生
        var sideForceAngle = ship.rotation - Math.PI / 2; // 90度左回り
        ship.velocity.x += Math.cos(sideForceAngle) * RCS_SIDE_THRUST;
        ship.velocity.y += Math.sin(sideForceAngle) * RCS_SIDE_THRUST;
    }
    // 推進
    ship.thrusting = false;
    if (keys['ArrowUp']) {
        ship.thrusting = true;
        ship.velocity.x += Math.cos(ship.rotation) * SHIP_SPEED * 0.05;
        ship.velocity.y += Math.sin(ship.rotation) * SHIP_SPEED * 0.05;
        // 推進音を再生（まだ再生中でなければ）
        if (!soundManager.isPlaying('thruster')) {
            soundManager.play('thruster');
        }
    }
    else {
        // 上矢印キーが離されていたら推進音を停止
        if (soundManager.isPlaying('thruster')) {
            soundManager.stop('thruster');
        }
    }
    // 回転速度制限
    if (ship.rotationVelocity > MAX_ROTATION_SPEED) {
        ship.rotationVelocity = MAX_ROTATION_SPEED;
    }
    if (ship.rotationVelocity < -MAX_ROTATION_SPEED) {
        ship.rotationVelocity = -MAX_ROTATION_SPEED;
    }
    // 回転摩擦（姿勢制御スラスターの空気抵抗的効果）
    ship.rotationVelocity *= ROTATION_FRICTION;
    // 回転角度の更新
    ship.rotation += ship.rotationVelocity;
    // 摩擦
    ship.velocity.x *= FRICTION;
    ship.velocity.y *= FRICTION;
    // 位置更新と画面端ループ処理
    updatePosition(ship);
    wrapAroundScreen(ship);
}
// 弾の更新
function updateBullets() {
    for (var i = bullets.length - 1; i >= 0; i--) {
        var bullet = bullets[i];
        // 位置更新
        updatePosition(bullet);
        // 画面外に出たら削除
        if (bullet.position.x < 0 ||
            bullet.position.x > CANVAS_WIDTH ||
            bullet.position.y < 0 ||
            bullet.position.y > CANVAS_HEIGHT) {
            bullets.splice(i, 1);
            continue;
        }
    }
}
// 小惑星の更新
function updateAsteroids() {
    for (var _i = 0, asteroids_1 = asteroids; _i < asteroids_1.length; _i++) {
        var asteroid = asteroids_1[_i];
        // 位置更新と画面端ループ処理
        updatePosition(asteroid);
        wrapAroundScreenWithSize(asteroid, ASTEROID_SIZE);
        // 回転
        asteroid.angle += 0.01;
    }
}
// 弾の発射
function shootBullet() {
    if (hasPowerUp(PowerUpType.TRIPLE_SHOT)) {
        // 3方向射撃
        var angles = [ship.rotation - 0.3, ship.rotation, ship.rotation + 0.3];
        angles.forEach(function (angle) {
            bullets.push({
                position: {
                    x: ship.position.x + Math.cos(angle) * SHIP_SIZE,
                    y: ship.position.y + Math.sin(angle) * SHIP_SIZE
                },
                velocity: {
                    x: Math.cos(angle) * BULLET_SPEED + ship.velocity.x,
                    y: Math.sin(angle) * BULLET_SPEED + ship.velocity.y
                }
            });
        });
    }
    else {
        // 通常射撃
        bullets.push({
            position: {
                x: ship.position.x + Math.cos(ship.rotation) * SHIP_SIZE,
                y: ship.position.y + Math.sin(ship.rotation) * SHIP_SIZE
            },
            velocity: {
                x: Math.cos(ship.rotation) * BULLET_SPEED + ship.velocity.x,
                y: Math.sin(ship.rotation) * BULLET_SPEED + ship.velocity.y
            }
        });
    }
    // レーザー音を再生
    soundManager.play('laser');
}
// 衝突判定
// パワーアップ生成関数
function createPowerUp(x, y) {
    if (Math.random() < POWER_UP_SPAWN_CHANCE) {
        var types = [PowerUpType.SHIELD, PowerUpType.TRIPLE_SHOT, PowerUpType.RAPID_FIRE, PowerUpType.SCORE_MULTIPLIER];
        var randomType = types[Math.floor(Math.random() * types.length)];
        var powerUp = {
            position: { x: x, y: y },
            velocity: {
                x: (Math.random() - 0.5) * POWER_UP_SPEED,
                y: (Math.random() - 0.5) * POWER_UP_SPEED
            },
            type: randomType,
            size: POWER_UP_SIZE,
            rotation: 0,
            lifeTime: 0,
            maxLifeTime: POWER_UP_LIFETIME
        };
        powerUps.push(powerUp);
    }
}
// パワーアップの更新
function updatePowerUps() {
    for (var i = powerUps.length - 1; i >= 0; i--) {
        var powerUp = powerUps[i];
        // 位置更新と画面端ラップアラウンド
        updatePosition(powerUp);
        powerUp.rotation += 0.02;
        powerUp.lifeTime++;
        wrapAroundScreen(powerUp);
        // ライフタイム終了で削除
        if (powerUp.lifeTime >= powerUp.maxLifeTime) {
            powerUps.splice(i, 1);
        }
    }
    // アクティブなパワーアップの時間管理
    for (var i = activePowerUps.length - 1; i >= 0; i--) {
        activePowerUps[i].duration--;
        if (activePowerUps[i].duration <= 0) {
            activePowerUps.splice(i, 1);
        }
    }
}
// パワーアップの描画
function drawPowerUps() {
    powerUps.forEach(function (powerUp) {
        ctx.save();
        ctx.translate(powerUp.position.x, powerUp.position.y);
        ctx.rotate(powerUp.rotation);
        // パワーアップタイプに応じて色を変更
        var color;
        switch (powerUp.type) {
            case PowerUpType.SHIELD:
                color = '#00FFFF'; // シアン
                break;
            case PowerUpType.TRIPLE_SHOT:
                color = '#FF4500'; // オレンジレッド
                break;
            case PowerUpType.RAPID_FIRE:
                color = '#FFD700'; // ゴールド
                break;
            case PowerUpType.SCORE_MULTIPLIER:
                color = '#9932CC'; // ダークオーキッド
                break;
        }
        // 点滅効果（ライフタイムが終わりに近づくと）
        var blinkThreshold = powerUp.maxLifeTime * 0.8;
        if (powerUp.lifeTime > blinkThreshold) {
            var blinkSpeed = Math.sin((powerUp.lifeTime - blinkThreshold) * 0.3);
            ctx.globalAlpha = blinkSpeed > 0 ? 1 : 0.3;
        }
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        // 六角形の描画
        for (var i = 0; i < 6; i++) {
            var angle = (i * Math.PI) / 3;
            var x = Math.cos(angle) * powerUp.size;
            var y = Math.sin(angle) * powerUp.size;
            if (i === 0)
                ctx.moveTo(x, y);
            else
                ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.stroke();
        // パワーアップタイプのアイコン描画
        ctx.fillStyle = color;
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        var symbol;
        switch (powerUp.type) {
            case PowerUpType.SHIELD:
                symbol = 'S';
                break;
            case PowerUpType.TRIPLE_SHOT:
                symbol = '3';
                break;
            case PowerUpType.RAPID_FIRE:
                symbol = 'R';
                break;
            case PowerUpType.SCORE_MULTIPLIER:
                symbol = 'M';
                break;
        }
        ctx.fillText(symbol, 0, 0);
        ctx.restore();
    });
}
// パワーアップ効果の適用
function applyPowerUp(type) {
    // 既存の同じパワーアップがあれば時間延長、なければ新規追加
    var existing;
    for (var _i = 0, activePowerUps_1 = activePowerUps; _i < activePowerUps_1.length; _i++) {
        var p = activePowerUps_1[_i];
        if (p.type === type) {
            existing = p;
            break;
        }
    }
    if (existing) {
        existing.duration = Math.max(existing.duration, POWER_UP_DURATIONS[type]);
    }
    else {
        activePowerUps.push({
            type: type,
            duration: POWER_UP_DURATIONS[type],
            maxDuration: POWER_UP_DURATIONS[type]
        });
    }
}
// パワーアップ効果の確認
function hasPowerUp(type) {
    for (var _i = 0, activePowerUps_2 = activePowerUps; _i < activePowerUps_2.length; _i++) {
        var p = activePowerUps_2[_i];
        if (p.type === type) {
            return true;
        }
    }
    return false;
}
// UFOの生成
function spawnUFO() {
    // レベル3以降でのみUFO出現
    if (level < 3)
        return;
    // スポーン確率チェック
    if (Math.random() > UFO_SPAWN_CHANCE)
        return;
    // 既にUFOが存在する場合は生成しない（1体まで）
    if (ufos.length > 0)
        return;
    // UFOタイプの決定（レベルが高いほど小UFOの確率増加）
    var ufoType = level < 5 || Math.random() < 0.7 ? UFOType.LARGE : UFOType.SMALL;
    var settings = UFO_SETTINGS[ufoType];
    // 画面端からランダムな位置で出現
    var x, y;
    var side = Math.floor(Math.random() * 4);
    switch (side) {
        case 0: // 上
            x = Math.random() * CANVAS_WIDTH;
            y = -settings.size;
            break;
        case 1: // 右
            x = CANVAS_WIDTH + settings.size;
            y = Math.random() * CANVAS_HEIGHT;
            break;
        case 2: // 下
            x = Math.random() * CANVAS_WIDTH;
            y = CANVAS_HEIGHT + settings.size;
            break;
        case 3: // 左
        default:
            x = -settings.size;
            y = Math.random() * CANVAS_HEIGHT;
            break;
    }
    // 初期移動方向をプレイヤー方向に設定
    var angle = Math.atan2(ship.position.y - y, ship.position.x - x);
    var ufo = {
        position: { x: x, y: y },
        velocity: {
            x: Math.cos(angle) * settings.speed,
            y: Math.sin(angle) * settings.speed
        },
        type: ufoType,
        size: settings.size,
        health: settings.health,
        maxHealth: settings.health,
        shootCooldown: 0,
        maxShootCooldown: settings.shootCooldown,
        changeDirectionTimer: settings.changeDirectionInterval,
        maxChangeDirectionTimer: settings.changeDirectionInterval,
        targetAngle: angle
    };
    ufos.push(ufo);
}
// UFOの更新
function updateUFOs() {
    // UFOスポーンタイマー
    ufoSpawnTimer++;
    if (ufoSpawnTimer >= UFO_SPAWN_INTERVAL) {
        ufoSpawnTimer = 0;
        spawnUFO();
    }
    for (var i = ufos.length - 1; i >= 0; i--) {
        var ufo = ufos[i];
        var settings = UFO_SETTINGS[ufo.type];
        // 移動方向変更タイマー
        ufo.changeDirectionTimer--;
        if (ufo.changeDirectionTimer <= 0) {
            // 新しい目標方向を設定（プレイヤーの方向 + ランダムな偏差）
            var playerAngle = Math.atan2(ship.position.y - ufo.position.y, ship.position.x - ufo.position.x);
            var randomOffset = (Math.random() - 0.5) * Math.PI * 0.5; // ±45度
            ufo.targetAngle = playerAngle + randomOffset;
            ufo.velocity.x = Math.cos(ufo.targetAngle) * settings.speed;
            ufo.velocity.y = Math.sin(ufo.targetAngle) * settings.speed;
            ufo.changeDirectionTimer = ufo.maxChangeDirectionTimer;
        }
        // 位置更新と画面端ラップアラウンド
        updatePosition(ufo);
        wrapAroundScreenWithSize(ufo, ufo.size);
        // 射撃クールダウン
        ufo.shootCooldown--;
        if (ufo.shootCooldown <= 0) {
            shootUFOBullet(ufo);
            ufo.shootCooldown = ufo.maxShootCooldown;
        }
    }
}
// 画面シェイクの開始
function startScreenShake(intensity) {
    screenShake = {
        intensity: intensity || SCREEN_SHAKE_INTENSITY,
        duration: SCREEN_SHAKE_DURATION,
        maxDuration: SCREEN_SHAKE_DURATION
    };
}
// 画面シェイクの更新
function updateScreenShake() {
    if (screenShake) {
        screenShake.duration--;
        if (screenShake.duration <= 0) {
            screenShake = null;
        }
    }
}
// UFO弾の発射
function shootUFOBullet(ufo) {
    // プレイヤーの位置を予測して射撃（簡易な先読み）
    var predictFrames = 30; // 0.5秒先を予測
    var predictedX = ship.position.x + ship.velocity.x * predictFrames;
    var predictedY = ship.position.y + ship.velocity.y * predictFrames;
    var angle = Math.atan2(predictedY - ufo.position.y, predictedX - ufo.position.x);
    // 少し精度を下げる（完璧すぎないように）
    var accuracy = ufo.type === UFOType.SMALL ? 0.9 : 0.7;
    var finalAngle = angle + (Math.random() - 0.5) * (1 - accuracy) * Math.PI * 0.3;
    var ufoBullet = {
        position: { x: ufo.position.x, y: ufo.position.y },
        velocity: {
            x: Math.cos(finalAngle) * UFO_BULLET_SPEED,
            y: Math.sin(finalAngle) * UFO_BULLET_SPEED
        },
        life: UFO_BULLET_LIFE,
        maxLife: UFO_BULLET_LIFE
    };
    ufoBullets.push(ufoBullet);
    // UFO射撃音（レーザー音を使用）
    soundManager.play('laser');
}
// UFO弾の更新
function updateUFOBullets() {
    for (var i = ufoBullets.length - 1; i >= 0; i--) {
        var bullet = ufoBullets[i];
        // 位置更新
        updatePosition(bullet);
        // ライフ減少
        bullet.life--;
        // 画面外または寿命が尽きたら削除
        if (bullet.life <= 0 ||
            bullet.position.x < -10 || bullet.position.x > CANVAS_WIDTH + 10 ||
            bullet.position.y < -10 || bullet.position.y > CANVAS_HEIGHT + 10) {
            ufoBullets.splice(i, 1);
        }
    }
}
// フリーズフレームの開始
function startFreezeFrame() {
    freezeFrames = FREEZE_FRAME_DURATION;
}
// パーティクルの生成
function createParticles(x, y, count, type) {
    for (var i = 0; i < count; i++) {
        if (particles.length >= MAX_PARTICLES)
            break;
        var angle = Math.random() * Math.PI * 2;
        var speed = type === 'thruster' ? 1 + Math.random() * 2 : 2 + Math.random() * 4;
        var color = void 0;
        var size = void 0;
        var life = void 0;
        switch (type) {
            case 'debris':
                color = '#888888';
                size = 2 + Math.random() * 3;
                life = 30 + Math.random() * 20;
                break;
            case 'spark':
                color = '#FFD700';
                size = 1 + Math.random() * 2;
                life = 15 + Math.random() * 10;
                break;
            case 'thruster':
                color = '#FF6600';
                size = 1 + Math.random() * 2;
                life = 20 + Math.random() * 15;
                break;
        }
        particles.push({
            position: { x: x + (Math.random() - 0.5) * 10, y: y + (Math.random() - 0.5) * 10 },
            velocity: {
                x: Math.cos(angle) * speed,
                y: Math.sin(angle) * speed
            },
            color: color,
            size: size,
            life: life,
            maxLife: life,
            type: type
        });
    }
}
// パーティクルの更新
function updateParticles() {
    for (var i = particles.length - 1; i >= 0; i--) {
        var particle = particles[i];
        // 位置更新
        particle.position.x += particle.velocity.x;
        particle.position.y += particle.velocity.y;
        // 摩擦
        particle.velocity.x *= 0.98;
        particle.velocity.y *= 0.98;
        // スラスターパーティクルは重力の影響
        if (particle.type === 'thruster') {
            particle.velocity.y += 0.1;
        }
        // ライフ減少
        particle.life--;
        // 画面端でのラップアラウンド
        if (particle.position.x < 0)
            particle.position.x = CANVAS_WIDTH;
        if (particle.position.x > CANVAS_WIDTH)
            particle.position.x = 0;
        if (particle.position.y < 0)
            particle.position.y = CANVAS_HEIGHT;
        if (particle.position.y > CANVAS_HEIGHT)
            particle.position.y = 0;
        // ライフが終了したら削除
        if (particle.life <= 0) {
            particles.splice(i, 1);
        }
    }
}
// UFOの描画
function drawUFOs() {
    ufos.forEach(function (ufo) {
        ctx.save();
        ctx.translate(ufo.position.x, ufo.position.y);
        // UFOタイプに応じた色
        var color = ufo.type === UFOType.SMALL ? '#FF6B35' : '#4ECDC4';
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        // UFO本体（楕円形）
        ctx.beginPath();
        ctx.ellipse(0, 0, ufo.size, ufo.size * 0.6, 0, 0, Math.PI * 2);
        ctx.stroke();
        // UFOドーム部分
        ctx.beginPath();
        ctx.ellipse(0, -ufo.size * 0.2, ufo.size * 0.6, ufo.size * 0.3, 0, 0, Math.PI * 2);
        ctx.stroke();
        // ダメージ表示（体力が減っている場合）
        if (ufo.health < ufo.maxHealth) {
            ctx.strokeStyle = '#FF0000';
            ctx.lineWidth = 1;
            var flashSpeed = Math.sin(Date.now() * 0.02);
            if (flashSpeed > 0) {
                ctx.stroke();
            }
        }
        ctx.restore();
    });
}
// パーティクルの描画
function drawParticles() {
    particles.forEach(function (particle) {
        ctx.save();
        // フェードアウト効果
        var alpha = particle.life / particle.maxLife;
        ctx.globalAlpha = alpha;
        ctx.fillStyle = particle.color;
        ctx.beginPath();
        ctx.arc(particle.position.x, particle.position.y, particle.size, 0, Math.PI * 2);
        ctx.fill();
        // スパークパーティクルは光る効果
        if (particle.type === 'spark') {
            ctx.globalCompositeOperation = 'lighter';
            ctx.fillStyle = '#FFFFFF';
            ctx.beginPath();
            ctx.arc(particle.position.x, particle.position.y, particle.size * 0.5, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
    });
}
// UFO弾の描画
function drawUFOBullets() {
    ctx.fillStyle = '#FF6B35';
    ufoBullets.forEach(function (bullet) {
        ctx.save();
        // フェード効果
        var alpha = bullet.life / bullet.maxLife;
        ctx.globalAlpha = alpha;
        ctx.beginPath();
        ctx.arc(bullet.position.x, bullet.position.y, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    });
}
function checkCollisions() {
    // 弾と小惑星の衝突判定
    for (var i = bullets.length - 1; i >= 0; i--) {
        var bullet = bullets[i];
        for (var j = asteroids.length - 1; j >= 0; j--) {
            var asteroid = asteroids[j];
            var distance = calculateDistance(bullet, asteroid);
            if (distance < asteroid.radius) {
                // 衝突処理
                bullets.splice(i, 1);
                asteroids.splice(j, 1);
                // ゲームジュース効果
                startScreenShake(6); // 小惑星破壊は軽めのシェイク
                startFreezeFrame();
                createParticles(asteroid.position.x, asteroid.position.y, 8, 'debris');
                createParticles(asteroid.position.x, asteroid.position.y, 5, 'spark');
                // 爆発音を再生
                soundManager.play('explosion');
                // スコア加算（スコア倍率パワーアップを考慮）
                var baseScore = 100;
                if (hasPowerUp(PowerUpType.SCORE_MULTIPLIER)) {
                    baseScore *= 2;
                }
                score += baseScore;
                updateUI();
                // パワーアップ生成チャンス
                createPowerUp(asteroid.position.x, asteroid.position.y);
                // 新しい小惑星を生成（分裂）
                if (asteroid.radius > 20) {
                    for (var k = 0; k < 2; k++) {
                        var angle = Math.random() * Math.PI * 2;
                        // 分裂時の速度バリエーション（より活発な動き）
                        var speedMultiplier = void 0;
                        var speedType = Math.random();
                        if (speedType < 0.3) {
                            // 高速破片（30%の確率）
                            speedMultiplier = 0.8 + Math.random() * 0.7;
                        }
                        else {
                            // 通常速度破片（70%の確率）
                            speedMultiplier = 0.4 + Math.random() * 0.6;
                        }
                        var newSize = asteroid.radius * 0.6;
                        // サイズと速度の逆比例関係（小さいほど速い）
                        var sizeSpeedBonus = Math.max(1.0, (ASTEROID_SIZE / 2) / newSize * 0.3);
                        var speed = ASTEROID_SPEED * speedMultiplier * sizeSpeedBonus;
                        // 頂点の生成
                        var vertices = [];
                        var angleStep = (Math.PI * 2) / ASTEROID_VERTICES;
                        for (var l = 0; l < ASTEROID_VERTICES; l++) {
                            var radius = newSize * (0.8 + Math.random() * 0.4);
                            vertices.push({
                                x: Math.cos(angleStep * l) * radius,
                                y: Math.sin(angleStep * l) * radius
                            });
                        }
                        asteroids.push({
                            position: __assign({}, asteroid.position),
                            velocity: {
                                x: Math.cos(angle) * speed,
                                y: Math.sin(angle) * speed
                            },
                            radius: newSize,
                            angle: Math.random() * Math.PI * 2,
                            vertices: vertices
                        });
                    }
                }
                break;
            }
        }
    }
    // 宇宙船と小惑星の衝突判定（シールドパワーアップを考慮）
    if (!hasPowerUp(PowerUpType.SHIELD)) {
        for (var _i = 0, asteroids_2 = asteroids; _i < asteroids_2.length; _i++) {
            var asteroid = asteroids_2[_i];
            var distance = calculateDistance(ship, asteroid);
            if (distance < asteroid.radius + SHIP_SIZE / 2) {
                // 衝突処理
                lives--;
                updateUI();
                // ゲームジュース効果（宇宙船破壊は強めの効果）
                startScreenShake(12);
                startFreezeFrame();
                createParticles(ship.position.x, ship.position.y, 15, 'debris');
                createParticles(ship.position.x, ship.position.y, 10, 'spark');
                // 爆発エフェクトを生成
                createExplosionEffect(ship.position.x, ship.position.y);
                // 爆発音を再生
                soundManager.play('explosion');
                if (lives <= 0) {
                    gameOver = true;
                    showGameOver();
                }
                else {
                    // 宇宙船を初期位置に戻す
                    ship.position = { x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT / 2 };
                    ship.velocity = { x: 0, y: 0 };
                    ship.rotationVelocity = 0;
                }
                break;
            }
        }
    }
    // プレイヤー弾とUFOの衝突判定
    for (var i = bullets.length - 1; i >= 0; i--) {
        var bullet = bullets[i];
        for (var j = ufos.length - 1; j >= 0; j--) {
            var ufo = ufos[j];
            var distance = calculateDistance(bullet, ufo);
            if (distance < ufo.size) {
                // 弾を削除
                bullets.splice(i, 1);
                // UFOのダメージ処理
                ufo.health--;
                if (ufo.health <= 0) {
                    // UFO破壊
                    ufos.splice(j, 1);
                    // スコア加算
                    var settings = UFO_SETTINGS[ufo.type];
                    var baseScore = settings.points;
                    if (hasPowerUp(PowerUpType.SCORE_MULTIPLIER)) {
                        baseScore *= 2;
                    }
                    score += baseScore;
                    updateUI();
                    // 爆発エフェクト
                    createExplosionEffect(ufo.position.x, ufo.position.y);
                    // パワーアップ生成チャンス（UFOは高確率）
                    if (Math.random() < 0.5) {
                        createPowerUp(ufo.position.x, ufo.position.y);
                    }
                }
                // 爆発音を再生
                soundManager.play('explosion');
                break;
            }
        }
    }
    // UFO弾と宇宙船の衝突判定（シールドパワーアップを考慮）
    if (!hasPowerUp(PowerUpType.SHIELD)) {
        for (var i = ufoBullets.length - 1; i >= 0; i--) {
            var ufoBullet = ufoBullets[i];
            var distance = calculateDistance(ship, ufoBullet);
            if (distance < SHIP_SIZE / 2 + 3) {
                // UFO弾を削除
                ufoBullets.splice(i, 1);
                // 宇宙船ダメージ処理
                lives--;
                updateUI();
                // 爆発エフェクト
                createExplosionEffect(ship.position.x, ship.position.y);
                // 爆発音を再生
                soundManager.play('explosion');
                if (lives <= 0) {
                    gameOver = true;
                    showGameOver();
                }
                else {
                    // 宇宙船を初期位置に戻す
                    ship.position = { x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT / 2 };
                    ship.velocity = { x: 0, y: 0 };
                    ship.rotationVelocity = 0;
                }
                break;
            }
        }
    }
    // 宇宙船とパワーアップの衝突判定
    for (var i = powerUps.length - 1; i >= 0; i--) {
        var powerUp = powerUps[i];
        var distance = calculateDistance(ship, powerUp);
        if (distance < SHIP_SIZE / 2 + powerUp.size) {
            // パワーアップ取得
            powerUps.splice(i, 1);
            applyPowerUp(powerUp.type);
            // パワーアップ取得音（レーザー音を代用）
            soundManager.play('laser');
        }
    }
}
// 爆発エフェクトの生成
function createExplosionEffect(x, y) {
    var lines = [];
    for (var i = 0; i < EXPLOSION_LINES; i++) {
        lines.push({
            angle: (Math.PI * 2 * i) / EXPLOSION_LINES + (Math.random() - 0.5) * 0.5,
            length: 15 + Math.random() * 25,
            opacity: 0.8 + Math.random() * 0.2
        });
    }
    explosionEffects.push({
        position: { x: x, y: y },
        lines: lines,
        duration: EXPLOSION_DURATION,
        maxDuration: EXPLOSION_DURATION
    });
}
// 爆発エフェクトの更新
function updateExplosionEffects() {
    for (var i = explosionEffects.length - 1; i >= 0; i--) {
        var effect = explosionEffects[i];
        effect.duration--;
        if (effect.duration <= 0) {
            explosionEffects.splice(i, 1);
        }
    }
}
// 爆発エフェクトの描画
function drawExplosionEffects() {
    ctx.save();
    ctx.strokeStyle = '#FF4444'; // 赤色
    ctx.lineWidth = 2;
    for (var _i = 0, explosionEffects_1 = explosionEffects; _i < explosionEffects_1.length; _i++) {
        var effect = explosionEffects_1[_i];
        var progress = 1 - (effect.duration / effect.maxDuration);
        var fadeOut = effect.duration / effect.maxDuration;
        ctx.globalAlpha = fadeOut;
        for (var _a = 0, _b = effect.lines; _a < _b.length; _a++) {
            var line = _b[_a];
            var currentLength = line.length * (0.3 + progress * 0.7);
            ctx.beginPath();
            ctx.moveTo(effect.position.x, effect.position.y);
            ctx.lineTo(effect.position.x + Math.cos(line.angle) * currentLength, effect.position.y + Math.sin(line.angle) * currentLength);
            ctx.stroke();
        }
    }
    ctx.restore();
}
// 宇宙船の描画
function drawShip() {
    ctx.save();
    ctx.translate(ship.position.x, ship.position.y);
    ctx.rotate(ship.rotation);
    // シールドエフェクト
    if (hasPowerUp(PowerUpType.SHIELD)) {
        var shieldPowerUp = void 0;
        for (var _i = 0, activePowerUps_3 = activePowerUps; _i < activePowerUps_3.length; _i++) {
            var p = activePowerUps_3[_i];
            if (p.type === PowerUpType.SHIELD) {
                shieldPowerUp = p;
                break;
            }
        }
        if (shieldPowerUp) {
            // 残り時間に応じて点滅
            var timeRatio = shieldPowerUp.duration / shieldPowerUp.maxDuration;
            if (timeRatio > 0.3 || Math.sin(Date.now() * 0.02) > 0) {
                ctx.strokeStyle = '#00FFFF';
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.arc(0, 0, SHIP_SIZE + 8, 0, Math.PI * 2);
                ctx.stroke();
            }
        }
    }
    // 宇宙船の本体
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(SHIP_SIZE, 0);
    ctx.lineTo(-SHIP_SIZE, -SHIP_SIZE / 1.5);
    ctx.lineTo(-SHIP_SIZE / 2, 0);
    ctx.lineTo(-SHIP_SIZE, SHIP_SIZE / 1.5);
    ctx.closePath();
    ctx.stroke();
    // 推進エフェクト
    if (ship.thrusting) {
        ctx.beginPath();
        ctx.moveTo(-SHIP_SIZE, 0);
        ctx.lineTo(-SHIP_SIZE - Math.random() * 15, 0);
        ctx.strokeStyle = '#ff6600';
        ctx.lineWidth = 3;
        ctx.stroke();
        // 推進時のパーティクル効果（たまに生成）
        if (Math.random() < 0.3) {
            var thrusterX = ship.position.x + Math.cos(ship.rotation + Math.PI) * SHIP_SIZE;
            var thrusterY = ship.position.y + Math.sin(ship.rotation + Math.PI) * SHIP_SIZE;
            createParticles(thrusterX, thrusterY, 2, 'thruster');
        }
    }
    ctx.restore();
}
// 弾の描画
function drawBullets() {
    ctx.fillStyle = '#ffffff';
    for (var _i = 0, bullets_1 = bullets; _i < bullets_1.length; _i++) {
        var bullet = bullets_1[_i];
        ctx.beginPath();
        ctx.arc(bullet.position.x, bullet.position.y, 3, 0, Math.PI * 2);
        ctx.fill();
    }
}
// 小惑星の描画
function drawAsteroids() {
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    for (var _i = 0, asteroids_3 = asteroids; _i < asteroids_3.length; _i++) {
        var asteroid = asteroids_3[_i];
        ctx.save();
        ctx.translate(asteroid.position.x, asteroid.position.y);
        ctx.rotate(asteroid.angle);
        ctx.beginPath();
        ctx.moveTo(asteroid.vertices[0].x, asteroid.vertices[0].y);
        for (var i = 1; i < asteroid.vertices.length; i++) {
            ctx.lineTo(asteroid.vertices[i].x, asteroid.vertices[i].y);
        }
        ctx.closePath();
        ctx.stroke();
        ctx.restore();
    }
}
// UIの更新
// レベルアップとアステロイド補充システム
function checkLevelProgress() {
    // 小惑星が少なくなったら補充
    if (asteroids.length <= 2) {
        var newAsteroids = level + 2; // レベルに応じて小惑星数を増加
        for (var i = 0; i < newAsteroids; i++) {
            createLevelAdjustedAsteroid();
        }
        // レベルアップ
        level++;
        updateUI();
    }
}
// レベルに応じた難易度調整された小惑星生成
function createLevelAdjustedAsteroid() {
    var speedMultiplier = 1 + (level - 1) * 0.2; // レベルに応じて速度増加
    var sizeMultiplier = Math.max(0.8, 1.2 - (level - 1) * 0.1); // レベルが上がると少し小さく
    var x, y;
    // 宇宙船から十分離れた場所に生成（より安全な距離）
    do {
        x = Math.random() * CANVAS_WIDTH;
        y = Math.random() * CANVAS_HEIGHT;
    } while (Math.sqrt(Math.pow((x - ship.position.x), 2) + Math.pow((y - ship.position.y), 2)) < 150);
    var angle = Math.random() * Math.PI * 2;
    // レベル調整 + 速度バリエーション
    var baseSpeedMultiplier;
    var speedType = Math.random();
    if (speedType < FAST_ASTEROID_CHANCE) {
        // 高速小惑星（15%の確率）
        baseSpeedMultiplier = ASTEROID_SPEED_MIN + (ASTEROID_SPEED_MAX - ASTEROID_SPEED_MIN) * (0.7 + Math.random() * 0.3);
    }
    else if (speedType < 0.35) {
        // 低速小惑星（20%の確率）
        baseSpeedMultiplier = ASTEROID_SPEED_MIN + (ASTEROID_SPEED_MAX - ASTEROID_SPEED_MIN) * Math.random() * 0.4;
    }
    else {
        // 通常速度（65%の確率）
        baseSpeedMultiplier = ASTEROID_SPEED_MIN + (ASTEROID_SPEED_MAX - ASTEROID_SPEED_MIN) * (0.3 + Math.random() * 0.5);
    }
    var speed = ASTEROID_SPEED * speedMultiplier * baseSpeedMultiplier;
    var size = ASTEROID_SIZE * sizeMultiplier * (0.8 + Math.random() * 0.4);
    // 頂点の生成
    var vertices = [];
    var angleStep = (Math.PI * 2) / ASTEROID_VERTICES;
    for (var i = 0; i < ASTEROID_VERTICES; i++) {
        var radius = size * (0.8 + Math.random() * 0.4);
        vertices.push({
            x: Math.cos(angleStep * i) * radius,
            y: Math.sin(angleStep * i) * radius
        });
    }
    asteroids.push({
        position: { x: x, y: y },
        velocity: {
            x: Math.cos(angle) * speed,
            y: Math.sin(angle) * speed
        },
        radius: size,
        angle: Math.random() * Math.PI * 2,
        vertices: vertices
    });
}
function updateUI() {
    scoreElement.textContent = "Score: ".concat(score);
    livesElement.textContent = "Lives: ".concat(lives);
    levelElement.textContent = "Level: ".concat(level);
    highScoreElement.textContent = "High Score: ".concat(highScore);
}
// パワーアップステータス表示の更新
function updatePowerUpUI() {
    // 既存のパワーアップ表示をクリア
    var existingStatus = document.getElementById('power-up-status');
    if (existingStatus) {
        existingStatus.remove();
    }
    if (activePowerUps.length > 0) {
        var statusDiv = document.createElement('div');
        statusDiv.id = 'power-up-status';
        statusDiv.style.position = 'absolute';
        statusDiv.style.top = '10px';
        statusDiv.style.right = '10px';
        statusDiv.style.color = '#fff';
        statusDiv.style.fontSize = '12px';
        statusDiv.style.background = 'rgba(0,0,0,0.7)';
        statusDiv.style.padding = '10px';
        statusDiv.style.borderRadius = '5px';
        var statusText_1 = 'Active Power-ups:<br>';
        activePowerUps.forEach(function (powerUp) {
            var seconds = Math.ceil(powerUp.duration / 60);
            var name = '';
            switch (powerUp.type) {
                case PowerUpType.SHIELD:
                    name = 'Shield';
                    break;
                case PowerUpType.TRIPLE_SHOT:
                    name = 'Triple Shot';
                    break;
                case PowerUpType.RAPID_FIRE:
                    name = 'Rapid Fire';
                    break;
                case PowerUpType.SCORE_MULTIPLIER:
                    name = 'Score x2';
                    break;
            }
            statusText_1 += "".concat(name, ": ").concat(seconds, "s<br>");
        });
        statusDiv.innerHTML = statusText_1;
        document.body.appendChild(statusDiv);
    }
}
// ゲームオーバー表示
function showGameOver() {
    updateHighScore();
    updateUI();
    finalScoreElement.textContent = score.toString();
    gameOverElement.classList.remove('hidden');
}
// ゲームの再開始
function restartGame() {
    // ゲームを再開する前に推進音を停止
    soundManager.stop('thruster');
    initGame();
}
// ゲームループ
function gameLoop() {
    // キー入力処理（スペースキーで弾を発射）
    if (keys[' '] && !gameOver) {
        // 連射パワーアップの処理
        if (hasPowerUp(PowerUpType.RAPID_FIRE)) {
            // 連射モード：毎フレーム発射可能
            shootBullet();
        }
        else {
            // 通常モード：一度押したあと連射しない
            shootBullet();
            keys[' '] = false;
        }
    }
    // フリーズフレーム処理
    if (freezeFrames > 0) {
        freezeFrames--;
        // フリーズ中は更新を停止
        if (freezeFrames > 0) {
            // 描画のみ実行
            ctx.save();
            // 画面シェイク効果
            if (screenShake) {
                var shakeX = (Math.random() - 0.5) * screenShake.intensity;
                var shakeY = (Math.random() - 0.5) * screenShake.intensity;
                ctx.translate(shakeX, shakeY);
            }
            ctx.fillStyle = '#000000';
            ctx.fillRect(-50, -50, CANVAS_WIDTH + 100, CANVAS_HEIGHT + 100);
            if (!gameOver) {
                drawShip();
            }
            drawBullets();
            drawAsteroids();
            drawPowerUps();
            drawParticles();
            drawExplosionEffects();
            ctx.restore();
            requestAnimationFrame(gameLoop);
            return;
        }
    }
    if (!gameOver) {
        // ゲーム状態の更新
        updateShip();
        updateBullets();
        updateAsteroids();
        updateUFOs();
        updateUFOBullets();
        updatePowerUps();
        updatePowerUpUI();
        updateParticles();
        updateScreenShake();
        updateExplosionEffects();
        checkCollisions();
        checkLevelProgress();
    }
    // 描画
    ctx.save();
    // 画面シェイク効果
    if (screenShake) {
        var shakeX = (Math.random() - 0.5) * screenShake.intensity;
        var shakeY = (Math.random() - 0.5) * screenShake.intensity;
        ctx.translate(shakeX, shakeY);
    }
    ctx.fillStyle = '#000000';
    ctx.fillRect(-50, -50, CANVAS_WIDTH + 100, CANVAS_HEIGHT + 100);
    if (!gameOver) {
        drawShip();
    }
    drawBullets();
    drawUFOBullets();
    drawAsteroids();
    drawUFOs();
    drawPowerUps();
    drawParticles();
    drawExplosionEffects();
    ctx.restore();
    requestAnimationFrame(gameLoop);
}
// ゲーム開始
initGame();
gameLoop();
