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
// ゲーム状態
var ship;
var bullets = [];
var asteroids = [];
var explosionEffects = [];
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
    // 位置更新
    ship.position.x += ship.velocity.x;
    ship.position.y += ship.velocity.y;
    // 画面端のループ処理
    if (ship.position.x < 0)
        ship.position.x = CANVAS_WIDTH;
    if (ship.position.x > CANVAS_WIDTH)
        ship.position.x = 0;
    if (ship.position.y < 0)
        ship.position.y = CANVAS_HEIGHT;
    if (ship.position.y > CANVAS_HEIGHT)
        ship.position.y = 0;
}
// 弾の更新
function updateBullets() {
    for (var i = bullets.length - 1; i >= 0; i--) {
        var bullet = bullets[i];
        // 位置更新
        bullet.position.x += bullet.velocity.x;
        bullet.position.y += bullet.velocity.y;
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
        // 位置更新
        asteroid.position.x += asteroid.velocity.x;
        asteroid.position.y += asteroid.velocity.y;
        // 画面端のループ処理
        if (asteroid.position.x < -ASTEROID_SIZE)
            asteroid.position.x = CANVAS_WIDTH + ASTEROID_SIZE;
        if (asteroid.position.x > CANVAS_WIDTH + ASTEROID_SIZE)
            asteroid.position.x = -ASTEROID_SIZE;
        if (asteroid.position.y < -ASTEROID_SIZE)
            asteroid.position.y = CANVAS_HEIGHT + ASTEROID_SIZE;
        if (asteroid.position.y > CANVAS_HEIGHT + ASTEROID_SIZE)
            asteroid.position.y = -ASTEROID_SIZE;
        // 回転
        asteroid.angle += 0.01;
    }
}
// 弾の発射
function shootBullet() {
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
    // レーザー音を再生
    soundManager.play('laser');
}
// 衝突判定
function checkCollisions() {
    // 弾と小惑星の衝突判定
    for (var i = bullets.length - 1; i >= 0; i--) {
        var bullet = bullets[i];
        for (var j = asteroids.length - 1; j >= 0; j--) {
            var asteroid = asteroids[j];
            var dx = bullet.position.x - asteroid.position.x;
            var dy = bullet.position.y - asteroid.position.y;
            var distance = Math.sqrt(dx * dx + dy * dy);
            if (distance < asteroid.radius) {
                // 衝突処理
                bullets.splice(i, 1);
                asteroids.splice(j, 1);
                // 爆発音を再生
                soundManager.play('explosion');
                // スコア加算
                score += 100;
                updateUI();
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
    // 宇宙船と小惑星の衝突判定
    for (var _i = 0, asteroids_2 = asteroids; _i < asteroids_2.length; _i++) {
        var asteroid = asteroids_2[_i];
        var dx = ship.position.x - asteroid.position.x;
        var dy = ship.position.y - asteroid.position.y;
        var distance = Math.sqrt(dx * dx + dy * dy);
        if (distance < asteroid.radius + SHIP_SIZE / 2) {
            // 衝突処理
            lives--;
            updateUI();
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
        shootBullet();
        // スペースキーを一度押したあと、連射しないようにキー状態をリセット
        keys[' '] = false;
    }
    if (!gameOver) {
        // ゲーム状態の更新
        updateShip();
        updateBullets();
        updateAsteroids();
        updateExplosionEffects();
        checkCollisions();
        checkLevelProgress();
    }
    // 描画
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    if (!gameOver) {
        drawShip();
    }
    drawBullets();
    drawAsteroids();
    drawExplosionEffects();
    requestAnimationFrame(gameLoop);
}
// ゲーム開始
initGame();
gameLoop();
