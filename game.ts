// 効果音を管理するクラス
class SoundManager {
    private sounds: { [key: string]: HTMLAudioElement } = {};

    constructor() {
        // 効果音の読み込み
        this.loadSound('laser', 'sounds/laser.wav');
        this.loadSound('explosion', 'sounds/explosion.wav');
        this.loadSound('thruster', 'sounds/thruster.wav');
    }

    private loadSound(name: string, path: string) {
        const audio = new Audio();
        audio.src = path;
        audio.preload = 'auto';
        audio.loop = name === 'thruster'; // thruster音はループ再生
        this.sounds[name] = audio;
    }

    public play(name: string) {
        const sound = this.sounds[name];
        if (sound) {
            // 再生中なら最初から再生
            if (!sound.paused) {
                sound.currentTime = 0;
            }
            sound.play().catch(e => console.log("音声再生エラー:", e));
        }
    }

    public stop(name: string) {
        const sound = this.sounds[name];
        if (sound) {
            sound.pause();
            sound.currentTime = 0;
        }
    }

    public isPlaying(name: string): boolean {
        const sound = this.sounds[name];
        return sound ? !sound.paused : false;
    }
}

// ゲームの定数
let CANVAS_WIDTH = 800;
let CANVAS_HEIGHT = 600;
const SHIP_SIZE = 20;
const SHIP_SPEED = 5;
const ROTATION_SPEED = 0.08;
const FRICTION = 0.98;
const BULLET_SPEED = 10;
const ASTEROID_SPEED = 2;
const ASTEROID_VERTICES = 10;
const ASTEROID_JAG = 0.4; // 頂点の凹凸の度合い(0-1)
const ASTEROID_SIZE = 100;
const ASTEROID_COUNT = 5;

// ゲームオブジェクトの型定義
type Vector = {
    x: number;
    y: number;
};

type Ship = {
    position: Vector;
    velocity: Vector;
    rotation: number; // ラジアン
    thrusting: boolean;
};

type Bullet = {
    position: Vector;
    velocity: Vector;
};

type Asteroid = {
    position: Vector;
    velocity: Vector;
    radius: number;
    angle: number;
    vertices: Vector[];
};

// ゲーム状態
let ship: Ship;
let bullets: Bullet[] = [];
let asteroids: Asteroid[] = [];
let score = 0;
let lives = 3;
let level = 1;
let asteroidsDestroyed = 0;
let highScore = 0;
let gameOver = false;
let soundManager: SoundManager;

// DOM要素
const canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
const ctx = canvas.getContext('2d')!;
const scoreElement = document.getElementById('score')!;
const livesElement = document.getElementById('lives')!;
const levelElement = document.getElementById('level')!;
const highScoreElement = document.getElementById('high-score')!;
const gameOverElement = document.getElementById('game-over')!;
const finalScoreElement = document.getElementById('final-score')!;
const restartButton = document.getElementById('restart-button')!;

// キー状態管理
const keys: { [key: string]: boolean } = {};

// イベントリスナー
window.addEventListener('keydown', (e) => {
    keys[e.key] = true;
});

window.addEventListener('keyup', (e) => {
    keys[e.key] = false;
    
    // 上矢印キーが離されたら推進音を停止
    if (e.key === 'ArrowUp') {
        soundManager.stop('thruster');
    }
});

// ウィンドウリサイズイベントに対応
window.addEventListener('resize', () => {
    resizeCanvas();
});

restartButton.addEventListener('click', restartGame);

// ゲーム初期化
// キャンバスサイズをブラウザウィンドウに合わせて設定
// ハイスコア管理
function loadHighScore(): number {
    const saved = localStorage.getItem('asteroids-high-score');
    return saved ? parseInt(saved, 10) : 0;
}

function saveHighScore(score: number): void {
    localStorage.setItem('asteroids-high-score', score.toString());
}

function updateHighScore(): void {
    if (score > highScore) {
        highScore = score;
        saveHighScore(highScore);
    }
}

function resizeCanvas() {
    const padding = 40; // 余白を確保
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
        if (ship.position.x > CANVAS_WIDTH) ship.position.x = CANVAS_WIDTH / 2;
        if (ship.position.y > CANVAS_HEIGHT) ship.position.y = CANVAS_HEIGHT / 2;
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
        thrusting: false
    };

    // 弾と小惑星の初期化
    bullets = [];
    asteroids = [];
    
    // 初期小惑星を生成
    for (let i = 0; i < ASTEROID_COUNT; i++) {
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
    const side = Math.floor(Math.random() * 4);
    let x, y;
    
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
    
    // ランダムな速度を設定
    const angle = Math.atan2(
        ship.position.y - y,
        ship.position.x - x
    );
    
    const speed = ASTEROID_SPEED * (0.5 + Math.random() * 0.5);
    
    // 頂点の生成
    const vertices: Vector[] = [];
    const angleStep = (Math.PI * 2) / ASTEROID_VERTICES;
    
    for (let i = 0; i < ASTEROID_VERTICES; i++) {
        const radius = ASTEROID_SIZE / 2 * (0.8 + Math.random() * 0.4);
        vertices.push({
            x: Math.cos(angleStep * i) * radius,
            y: Math.sin(angleStep * i) * radius
        });
    }
    
    asteroids.push({
        position: { x, y },
        velocity: {
            x: Math.cos(angle) * speed,
            y: Math.sin(angle) * speed
        },
        radius: ASTEROID_SIZE / 2,
        angle: Math.random() * Math.PI * 2,
        vertices
    });
}

// 宇宙船の更新
function updateShip() {
    // 回転
    if (keys['ArrowLeft']) {
        ship.rotation -= ROTATION_SPEED;
    }
    if (keys['ArrowRight']) {
        ship.rotation += ROTATION_SPEED;
    }
    
    // 推進
    ship.thrusting = false;
    if (keys['ArrowUp']) {
        ship.thrusting = true;
        ship.velocity.x += Math.cos(ship.rotation) * SHIP_SPEED * 0.1;
        ship.velocity.y += Math.sin(ship.rotation) * SHIP_SPEED * 0.1;
        
        // 推進音を再生（まだ再生中でなければ）
        if (!soundManager.isPlaying('thruster')) {
            soundManager.play('thruster');
        }
    } else {
        // 上矢印キーが離されていたら推進音を停止
        if (soundManager.isPlaying('thruster')) {
            soundManager.stop('thruster');
        }
    }
    
    // 摩擦
    ship.velocity.x *= FRICTION;
    ship.velocity.y *= FRICTION;
    
    // 位置更新
    ship.position.x += ship.velocity.x;
    ship.position.y += ship.velocity.y;
    
    // 画面端のループ処理
    if (ship.position.x < 0) ship.position.x = CANVAS_WIDTH;
    if (ship.position.x > CANVAS_WIDTH) ship.position.x = 0;
    if (ship.position.y < 0) ship.position.y = CANVAS_HEIGHT;
    if (ship.position.y > CANVAS_HEIGHT) ship.position.y = 0;
}

// 弾の更新
function updateBullets() {
    for (let i = bullets.length - 1; i >= 0; i--) {
        const bullet = bullets[i];
        
        // 位置更新
        bullet.position.x += bullet.velocity.x;
        bullet.position.y += bullet.velocity.y;
        
        // 画面外に出たら削除
        if (
            bullet.position.x < 0 ||
            bullet.position.x > CANVAS_WIDTH ||
            bullet.position.y < 0 ||
            bullet.position.y > CANVAS_HEIGHT
        ) {
            bullets.splice(i, 1);
            continue;
        }
    }
}

// 小惑星の更新
function updateAsteroids() {
    for (const asteroid of asteroids) {
        // 位置更新
        asteroid.position.x += asteroid.velocity.x;
        asteroid.position.y += asteroid.velocity.y;
        
        // 画面端のループ処理
        if (asteroid.position.x < -ASTEROID_SIZE) asteroid.position.x = CANVAS_WIDTH + ASTEROID_SIZE;
        if (asteroid.position.x > CANVAS_WIDTH + ASTEROID_SIZE) asteroid.position.x = -ASTEROID_SIZE;
        if (asteroid.position.y < -ASTEROID_SIZE) asteroid.position.y = CANVAS_HEIGHT + ASTEROID_SIZE;
        if (asteroid.position.y > CANVAS_HEIGHT + ASTEROID_SIZE) asteroid.position.y = -ASTEROID_SIZE;
        
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
    for (let i = bullets.length - 1; i >= 0; i--) {
        const bullet = bullets[i];
        
        for (let j = asteroids.length - 1; j >= 0; j--) {
            const asteroid = asteroids[j];
            
            const dx = bullet.position.x - asteroid.position.x;
            const dy = bullet.position.y - asteroid.position.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
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
                    for (let k = 0; k < 2; k++) {
                        const angle = Math.random() * Math.PI * 2;
                        const speed = ASTEROID_SPEED * (0.5 + Math.random() * 0.5);
                        
                        // 頂点の生成
                        const vertices: Vector[] = [];
                        const angleStep = (Math.PI * 2) / ASTEROID_VERTICES;
                        const newSize = asteroid.radius * 0.6;
                        
                        for (let l = 0; l < ASTEROID_VERTICES; l++) {
                            const radius = newSize * (0.8 + Math.random() * 0.4);
                            vertices.push({
                                x: Math.cos(angleStep * l) * radius,
                                y: Math.sin(angleStep * l) * radius
                            });
                        }
                        
                        asteroids.push({
                            position: { ...asteroid.position },
                            velocity: {
                                x: Math.cos(angle) * speed,
                                y: Math.sin(angle) * speed
                            },
                            radius: newSize,
                            angle: Math.random() * Math.PI * 2,
                            vertices
                        });
                    }
                }
                
                break;
            }
        }
    }
    
    // 宇宙船と小惑星の衝突判定
    for (const asteroid of asteroids) {
        const dx = ship.position.x - asteroid.position.x;
        const dy = ship.position.y - asteroid.position.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < asteroid.radius + SHIP_SIZE / 2) {
            // 衝突処理
            lives--;
            updateUI();
            
            // 爆発音を再生
            soundManager.play('explosion');
            
            if (lives <= 0) {
                gameOver = true;
                showGameOver();
            } else {
                // 宇宙船を初期位置に戻す
                ship.position = { x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT / 2 };
                ship.velocity = { x: 0, y: 0 };
            }
            
            break;
        }
    }
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
    for (const bullet of bullets) {
        ctx.beginPath();
        ctx.arc(bullet.position.x, bullet.position.y, 3, 0, Math.PI * 2);
        ctx.fill();
    }
}

// 小惑星の描画
function drawAsteroids() {
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    
    for (const asteroid of asteroids) {
        ctx.save();
        ctx.translate(asteroid.position.x, asteroid.position.y);
        ctx.rotate(asteroid.angle);
        
        ctx.beginPath();
        ctx.moveTo(asteroid.vertices[0].x, asteroid.vertices[0].y);
        
        for (let i = 1; i < asteroid.vertices.length; i++) {
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
        const newAsteroids = level + 2; // レベルに応じて小惑星数を増加
        for (let i = 0; i < newAsteroids; i++) {
            createLevelAdjustedAsteroid();
        }
        
        // レベルアップ
        level++;
        updateUI();
    }
}

// レベルに応じた難易度調整された小惑星生成
function createLevelAdjustedAsteroid() {
    const speedMultiplier = 1 + (level - 1) * 0.2; // レベルに応じて速度増加
    const sizeMultiplier = Math.max(0.8, 1.2 - (level - 1) * 0.1); // レベルが上がると少し小さく
    
    let x, y;
    do {
        x = Math.random() * CANVAS_WIDTH;
        y = Math.random() * CANVAS_HEIGHT;
    } while (
        Math.sqrt((x - ship.position.x) ** 2 + (y - ship.position.y) ** 2) < 100
    );

    const angle = Math.random() * Math.PI * 2;
    const speed = ASTEROID_SPEED * speedMultiplier * (0.5 + Math.random() * 0.5);
    const size = ASTEROID_SIZE * sizeMultiplier * (0.8 + Math.random() * 0.4);

    // 頂点の生成
    const vertices: Vector[] = [];
    const angleStep = (Math.PI * 2) / ASTEROID_VERTICES;

    for (let i = 0; i < ASTEROID_VERTICES; i++) {
        const radius = size * (0.8 + Math.random() * 0.4);
        vertices.push({
            x: Math.cos(angleStep * i) * radius,
            y: Math.sin(angleStep * i) * radius
        });
    }

    asteroids.push({
        position: { x, y },
        velocity: {
            x: Math.cos(angle) * speed,
            y: Math.sin(angle) * speed
        },
        radius: size,
        angle: Math.random() * Math.PI * 2,
        vertices
    });
}

function updateUI() {
    scoreElement.textContent = `Score: ${score}`;
    livesElement.textContent = `Lives: ${lives}`;
    levelElement.textContent = `Level: ${level}`;
    highScoreElement.textContent = `High Score: ${highScore}`;
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
        checkCollisions();
        checkLevelProgress();
    }
    
    // 描画
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    if (!gameOver) {
        drawShip();
        drawBullets();
        drawAsteroids();
    }
    
    requestAnimationFrame(gameLoop);
}

// ゲーム開始
initGame();
gameLoop();