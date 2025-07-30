# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## プロジェクト概要
このプロジェクトは、HTML5 Canvas を使用した ASTEROIDS 風のブラウザゲームです。TypeScript で開発され、JavaScript にコンパイルされています。

## 主要なファイル構成
- `index.html` - メインの HTML ファイル
- `game.ts` - TypeScript ソースコード（メインのゲームロジック）
- `game.js` - コンパイル済み JavaScript ファイル
- `style.css` - ゲームのスタイル
- `sounds/` - 効果音ファイル（laser.wav, explosion.wav, thruster.wav）

## 開発コマンド
このプロジェクトには現在、package.json や build script は設定されていません。

### TypeScript のコンパイル
TypeScript から JavaScript へのコンパイルは手動で行う必要があります：
```bash
tsc game.ts
```

### ゲームの実行
ローカルサーバーでの実行が推奨されます：
```bash
# Python を使用する場合
python -m http.server 8000

# Node.js の http-server を使用する場合
npx http-server
```

## コードアーキテクチャ

### 主要クラス・コンポーネント
- `SoundManager` - 効果音の管理（laser, explosion, thruster 音の制御）
- ゲーム状態管理：`ship`, `bullets`, `asteroids`, `score`, `lives`
- 型定義：`Vector`, `Ship`, `Bullet`, `Asteroid`

### ゲームループ構造
1. `initGame()` - ゲーム初期化
2. `gameLoop()` - メインループ（requestAnimationFrame 使用）
   - キー入力処理
   - 物理更新（`updateShip()`, `updateBullets()`, `updateAsteroids()`）
   - 衝突判定（`checkCollisions()`）
   - 描画処理（`drawShip()`, `drawBullets()`, `drawAsteroids()`）

### 入力システム
- 矢印キー：宇宙船の操縦（回転・推進）
- スペースキー：弾の発射
- クリック：ゲーム再開

### 物理・ゲームロジック
- 慣性物理：摩擦による減速
- 画面端ループ：オブジェクトが画面端を超えると反対側に出現
- 小惑星分裂：大きな小惑星は破壊時に 2 つの小さな小惑星に分裂

## 注意点
- TypeScript ファイルを編集後は、必ず JavaScript にコンパイルしてください
- ローカルサーバーでの実行が必要（ファイルプロトコルでは音声ファイルが正常に動作しない場合があります）
- game.js は game.ts から自動生成されるため、直接編集しないでください