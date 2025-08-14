#!/usr/bin/env node

const fs = require('fs');

// 音楽パラメータ
const SAMPLE_RATE = 48000;
const DURATION = 30; // 30秒
const BPM = 128;
const CHANNELS = 2;

// Bマイナー ドリアンスケール
const B_MINOR_DORIAN = {
    B: 246.94,   // B4
    D: 293.66,   // D5  
    E: 329.63,   // E5
    Fs: 369.99,  // F#5
    G: 392.00,   // G5
    A: 440.00,   // A5
    B_high: 493.88 // B5
};

// 複数のコード進行パターン
const CHORD_PROGRESSIONS = [
    // Pattern 0: オリジナル
    [[B_MINOR_DORIAN.B, B_MINOR_DORIAN.D, B_MINOR_DORIAN.Fs, B_MINOR_DORIAN.A], 
     [B_MINOR_DORIAN.G, B_MINOR_DORIAN.B, B_MINOR_DORIAN.D, B_MINOR_DORIAN.Fs], 
     [B_MINOR_DORIAN.E, B_MINOR_DORIAN.G, B_MINOR_DORIAN.B, B_MINOR_DORIAN.D],  
     [B_MINOR_DORIAN.Fs, B_MINOR_DORIAN.B, B_MINOR_DORIAN.E, B_MINOR_DORIAN.A]],
    // Pattern 1: ダーク
    [[B_MINOR_DORIAN.B, B_MINOR_DORIAN.D, B_MINOR_DORIAN.Fs], 
     [B_MINOR_DORIAN.E, B_MINOR_DORIAN.G, B_MINOR_DORIAN.B], 
     [B_MINOR_DORIAN.D, B_MINOR_DORIAN.Fs, B_MINOR_DORIAN.A],  
     [B_MINOR_DORIAN.G, B_MINOR_DORIAN.B, B_MINOR_DORIAN.D]],
    // Pattern 2: アッパー
    [[B_MINOR_DORIAN.B, B_MINOR_DORIAN.D, B_MINOR_DORIAN.Fs, B_MINOR_DORIAN.A, B_MINOR_DORIAN.B_high], 
     [B_MINOR_DORIAN.G, B_MINOR_DORIAN.B, B_MINOR_DORIAN.D, B_MINOR_DORIAN.Fs, B_MINOR_DORIAN.A], 
     [B_MINOR_DORIAN.E, B_MINOR_DORIAN.G, B_MINOR_DORIAN.B, B_MINOR_DORIAN.D, B_MINOR_DORIAN.Fs],  
     [B_MINOR_DORIAN.Fs, B_MINOR_DORIAN.A, B_MINOR_DORIAN.B, B_MINOR_DORIAN.D, B_MINOR_DORIAN.Fs]],
    // Pattern 3-9: バリエーション（以下省略形式で定義）
];

// アルペジオパターン
const ARPEGGIO_PATTERNS = [
    // Pattern 0: オリジナル
    [B_MINOR_DORIAN.B, B_MINOR_DORIAN.Fs, B_MINOR_DORIAN.A, B_MINOR_DORIAN.B,
     B_MINOR_DORIAN.D, B_MINOR_DORIAN.A, B_MINOR_DORIAN.Fs, B_MINOR_DORIAN.D],
    // Pattern 1: 上昇
    [B_MINOR_DORIAN.B, B_MINOR_DORIAN.D, B_MINOR_DORIAN.E, B_MINOR_DORIAN.Fs,
     B_MINOR_DORIAN.G, B_MINOR_DORIAN.A, B_MINOR_DORIAN.B_high, B_MINOR_DORIAN.A],
    // Pattern 2: 下降
    [B_MINOR_DORIAN.B_high, B_MINOR_DORIAN.A, B_MINOR_DORIAN.G, B_MINOR_DORIAN.Fs,
     B_MINOR_DORIAN.E, B_MINOR_DORIAN.D, B_MINOR_DORIAN.B, B_MINOR_DORIAN.D],
    // Pattern 3-9: その他のバリエーション
];

// ベースパターン
const BASS_PATTERNS = [
    // Pattern 0: オリジナル
    [B_MINOR_DORIAN.B / 2, B_MINOR_DORIAN.Fs / 2, B_MINOR_DORIAN.G / 2, B_MINOR_DORIAN.E / 2],
    // Pattern 1: ルート重視
    [B_MINOR_DORIAN.B / 2, B_MINOR_DORIAN.B / 2, B_MINOR_DORIAN.G / 2, B_MINOR_DORIAN.G / 2],
    // Pattern 2: ウォーキング
    [B_MINOR_DORIAN.B / 2, B_MINOR_DORIAN.D / 2, B_MINOR_DORIAN.E / 2, B_MINOR_DORIAN.Fs / 2],
    // Pattern 3-9: その他のバリエーション
];

// 不足分のパターンを自動生成
function generatePatterns() {
    // コード進行パターンを10個まで拡張
    while (CHORD_PROGRESSIONS.length < 10) {
        const basePattern = CHORD_PROGRESSIONS[CHORD_PROGRESSIONS.length % 3];
        const variation = basePattern.map(chord => 
            chord.map(note => note * (0.98 + Math.random() * 0.04)) // 微細な音程変化
        );
        CHORD_PROGRESSIONS.push(variation);
    }

    // アルペジオパターンを10個まで拡張
    while (ARPEGGIO_PATTERNS.length < 10) {
        const basePattern = ARPEGGIO_PATTERNS[ARPEGGIO_PATTERNS.length % 3];
        const shuffled = [...basePattern].sort(() => Math.random() - 0.5);
        ARPEGGIO_PATTERNS.push(shuffled);
    }

    // ベースパターンを10個まで拡張
    while (BASS_PATTERNS.length < 10) {
        const basePattern = BASS_PATTERNS[BASS_PATTERNS.length % 3];
        const variation = basePattern.map(note => note * (0.95 + Math.random() * 0.1));
        BASS_PATTERNS.push(variation);
    }
}

function createBuffer() {
    const samples = SAMPLE_RATE * DURATION;
    return {
        left: new Float32Array(samples),
        right: new Float32Array(samples),
        samples: samples
    };
}

// Base Layer生成 (パターン別)
function generateBasePattern(patternIndex) {
    console.log(`Base Pattern ${patternIndex} 生成中...`);
    const buffer = createBuffer();
    const progression = CHORD_PROGRESSIONS[patternIndex];
    
    const filterFreq = 0.3 + (patternIndex * 0.07); // パターン毎にフィルター変化
    const lfoRate = 0.4 + (patternIndex * 0.02); // LFO速度変化
    
    for (let i = 0; i < buffer.samples; i++) {
        const t = i / SAMPLE_RATE;
        const chordIndex = Math.floor(t / 7.5) % 4;
        const chord = progression[chordIndex];
        
        let sample = 0;
        chord.forEach(freq => {
            const lfo = Math.sin(t * 2 * Math.PI * lfoRate) * 0.003;
            const wave = Math.sin(2 * Math.PI * freq * (t + lfo)) * 0.08;
            sample += wave;
        });
        
        // パターン別フィルター効果
        const filter = filterFreq + 0.2 * Math.sin(t * 2 * Math.PI * 0.1);
        sample *= filter;
        
        buffer.left[i] = sample;
        buffer.right[i] = sample * 0.9;
    }
    
    // ノイズテクスチャ
    for (let i = 0; i < buffer.samples; i++) {
        const noise = (Math.random() - 0.5) * 0.005;
        buffer.left[i] += noise;
        buffer.right[i] += noise;
    }
    
    return buffer;
}

// Drums Layer生成 (パターン別)
function generateDrumsPattern(patternIndex) {
    console.log(`Drums Pattern ${patternIndex} 生成中...`);
    const buffer = createBuffer();
    
    const kickPattern = patternIndex; // パターンによるキックバリエーション
    const hatVariation = patternIndex / 10; // ハイハットのバリエーション
    
    const beatLength = 60 / BPM * SAMPLE_RATE;
    const sixteenthLength = beatLength / 4;
    const totalBeats = Math.floor(DURATION * BPM / 60);
    
    for (let beat = 0; beat < totalBeats; beat++) {
        const beatStart = Math.floor(beat * beatLength);
        
        // パターン別キック
        if (kickPattern < 5) {
            // 4つ打ち
            addKick(buffer, beatStart, 0.7);
        } else {
            // オフビートキック
            if (beat % 8 === 0 || beat % 8 === 3 || beat % 8 === 6) {
                addKick(buffer, beatStart, 0.7);
            }
        }
        
        // 2・4拍目クラップ
        if (beat % 4 === 1 || beat % 4 === 3) {
            addClap(buffer, beatStart);
        }
        
        // パターン別ハイハット
        for (let i = 0; i < 4; i++) {
            const hatStart = beatStart + Math.floor(i * sixteenthLength);
            let velocity;
            
            if (patternIndex < 3) {
                velocity = (i % 2 === 0) ? 0.6 : 0.3; // 基本パターン
            } else if (patternIndex < 7) {
                velocity = [0.6, 0.2, 0.4, 0.1][i]; // 複雑パターン
            } else {
                velocity = Math.random() * 0.5 + 0.1; // ランダム
            }
            
            addHiHat(buffer, hatStart, velocity * (1 + hatVariation));
        }
        
        // パターン別フィル (16小節毎)
        if (beat % 64 === 60 + patternIndex % 4) {
            addDrumFill(buffer, beatStart, patternIndex);
        }
    }
    
    return buffer;
}

function addKick(buffer, start, intensity = 0.7) {
    const length = Math.floor(SAMPLE_RATE * 0.1);
    for (let i = 0; i < length && start + i < buffer.samples; i++) {
        const t = i / SAMPLE_RATE;
        const envelope = Math.exp(-t * 30);
        const pitch = 55 * Math.exp(-t * 40);
        const wave = Math.sin(2 * Math.PI * pitch * t) * envelope * intensity;
        buffer.left[start + i] += wave;
        buffer.right[start + i] += wave;
    }
}

function addClap(buffer, start) {
    const length = Math.floor(SAMPLE_RATE * 0.05);
    for (let i = 0; i < length && start + i < buffer.samples; i++) {
        const noise = (Math.random() - 0.5) * 0.4;
        const envelope = Math.exp(-i / SAMPLE_RATE * 25);
        buffer.left[start + i] += noise * envelope;
        buffer.right[start + i] += noise * envelope;
    }
}

function addHiHat(buffer, start, velocity) {
    const length = Math.floor(SAMPLE_RATE * 0.02);
    for (let i = 0; i < length && start + i < buffer.samples; i++) {
        const noise = (Math.random() - 0.5) * velocity * 0.25;
        const envelope = Math.exp(-i / SAMPLE_RATE * 60);
        buffer.left[start + i] += noise * envelope;
        buffer.right[start + i] += noise * envelope;
    }
}

function addDrumFill(buffer, start, pattern) {
    const length = Math.floor(SAMPLE_RATE * 0.5);
    for (let i = 0; i < length && start + i < buffer.samples; i++) {
        const t = i / SAMPLE_RATE;
        const freq = 200 + pattern * 50 + t * 600;
        const noise = (Math.random() - 0.5) * 0.15;
        const tone = Math.sin(2 * Math.PI * freq * t) * 0.08;
        const envelope = Math.sin(t * Math.PI / (length / SAMPLE_RATE));
        buffer.left[start + i] += (noise + tone) * envelope;
        buffer.right[start + i] += (noise + tone) * envelope;
    }
}

// Synth Layer生成 (パターン別)
function generateSynthPattern(patternIndex) {
    console.log(`Synth Pattern ${patternIndex} 生成中...`);
    const buffer = createBuffer();
    const arpPattern = ARPEGGIO_PATTERNS[patternIndex];
    
    const sixteenthLength = (60 / BPM / 4) * SAMPLE_RATE;
    const filterMod = 0.3 + (patternIndex * 0.1); // フィルター変調
    const pwmRate = 0.2 + (patternIndex * 0.05); // PWM変調速度
    
    for (let i = 0; i < buffer.samples; i++) {
        const noteIndex = Math.floor(i / sixteenthLength) % arpPattern.length;
        const freq = arpPattern[noteIndex];
        const t = (i % sixteenthLength) / SAMPLE_RATE;
        const noteDuration = sixteenthLength / SAMPLE_RATE;
        
        if (t < noteDuration * 0.8) {
            const envelope = Math.exp(-t * 4) * Math.sin(t * Math.PI / (noteDuration * 0.8));
            
            // パターン別PWMオシレーター
            const phase = 2 * Math.PI * freq * t;
            const lfoRate = pwmRate + Math.sin(i / SAMPLE_RATE * 2 * Math.PI * 0.1) * 0.1;
            const pwm = Math.sin(phase) > Math.sin(t * 2 * Math.PI * lfoRate) ? 1 : -1;
            
            // パターン別フィルター
            const cutoff = 800 + Math.sin(i / SAMPLE_RATE * 2 * Math.PI * filterMod) * 400;
            const filtered = pwm * envelope * 0.15;
            
            // パターン別エフェクト
            let processed = filtered;
            if (patternIndex >= 5) {
                // ビットクラッシャー
                processed = Math.floor(filtered * 12) / 12;
            }
            
            buffer.left[i] += processed;
            buffer.right[i] += processed * 0.8;
        }
    }
    
    return buffer;
}

// Bass Layer生成 (パターン別)
function generateBassPattern(patternIndex) {
    console.log(`Bass Pattern ${patternIndex} 生成中...`);
    const buffer = createBuffer();
    const bassPattern = BASS_PATTERNS[patternIndex];
    
    const beatLength = 60 / BPM * SAMPLE_RATE;
    const resonance = 0.5 + (patternIndex * 0.05); // レゾナンス変化
    const filterFreq = 1.5 + (patternIndex * 0.2); // フィルター変化
    
    for (let i = 0; i < buffer.samples; i++) {
        const beatIndex = Math.floor(i / beatLength) % 4;
        const freq = bassPattern[beatIndex];
        const t = (i % beatLength) / SAMPLE_RATE;
        const beatDuration = beatLength / SAMPLE_RATE;
        
        if (t < beatDuration * 0.9) {
            const envelope = Math.exp(-t * 2) * (1 - Math.exp(-t * 20));
            
            // パターン別波形
            const phase = 2 * Math.PI * freq * t;
            let wave;
            
            if (patternIndex < 3) {
                // ソウ波
                wave = 2 * (phase / (2 * Math.PI) - Math.floor(phase / (2 * Math.PI) + 0.5));
            } else if (patternIndex < 7) {
                // 矩形波
                wave = Math.sin(phase) > 0 ? 1 : -1;
            } else {
                // サイン波 + ハーモニクス
                wave = Math.sin(phase) + 0.3 * Math.sin(phase * 2);
            }
            
            // パターン別フィルター
            const cutoff = freq * (filterFreq + Math.sin(i / SAMPLE_RATE * 2 * Math.PI * 0.25) * resonance);
            const filtered = wave * envelope * 0.25;
            
            // サブオシレーター
            const sub = Math.sin(phase / 2) * envelope * 0.15;
            
            const bass = filtered + sub;
            buffer.left[i] += bass;
            buffer.right[i] += bass;
        }
    }
    
    return buffer;
}

// WAVファイル出力
function bufferToWav(buffer, filename) {
    const length = buffer.samples;
    const arrayBuffer = new ArrayBuffer(44 + length * CHANNELS * 2);
    const view = new DataView(arrayBuffer);
    
    const writeString = (offset, string) => {
        for (let i = 0; i < string.length; i++) {
            view.setUint8(offset + i, string.charCodeAt(i));
        }
    };
    
    writeString(0, 'RIFF');
    view.setUint32(4, 36 + length * CHANNELS * 2, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, CHANNELS, true);
    view.setUint32(24, SAMPLE_RATE, true);
    view.setUint32(28, SAMPLE_RATE * CHANNELS * 2, true);
    view.setUint16(32, CHANNELS * 2, true);
    view.setUint16(34, 16, true);
    writeString(36, 'data');
    view.setUint32(40, length * CHANNELS * 2, true);
    
    let offset = 44;
    for (let i = 0; i < length; i++) {
        const leftSample = Math.max(-1, Math.min(1, buffer.left[i]));
        view.setInt16(offset, leftSample * 0x7FFF, true);
        offset += 2;
        
        const rightSample = Math.max(-1, Math.min(1, buffer.right[i]));
        view.setInt16(offset, rightSample * 0x7FFF, true);
        offset += 2;
    }
    
    fs.writeFileSync(filename, Buffer.from(arrayBuffer));
    console.log(`${filename} を出力しました (${(arrayBuffer.byteLength / 1024 / 1024).toFixed(1)} MB)`);
}

// メイン実行
console.log('🎵 ASTEROIDS マルチパターン音楽生成開始');
console.log(`仕様: 各トラック10パターン, ${BPM} BPM, ${DURATION}秒, Bマイナードリアン`);
console.log('');

// パターン自動生成
generatePatterns();

// 音楽ディレクトリ構造作成
const dirs = ['music/patterns', 'music/patterns/base', 'music/patterns/drums', 'music/patterns/synth', 'music/patterns/bass'];
dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        console.log(`${dir}/ ディレクトリを作成しました`);
    }
});

// 各トラック10パターンずつ生成
for (let i = 0; i < 10; i++) {
    console.log(`\n=== Pattern ${i} 生成中 ===`);
    
    const baseBuffer = generateBasePattern(i);
    bufferToWav(baseBuffer, `music/patterns/base/base_${i.toString().padStart(2, '0')}.wav`);
    
    const drumsBuffer = generateDrumsPattern(i);
    bufferToWav(drumsBuffer, `music/patterns/drums/drums_${i.toString().padStart(2, '0')}.wav`);
    
    const synthBuffer = generateSynthPattern(i);
    bufferToWav(synthBuffer, `music/patterns/synth/synth_${i.toString().padStart(2, '0')}.wav`);
    
    const bassBuffer = generateBassPattern(i);
    bufferToWav(bassBuffer, `music/patterns/bass/bass_${i.toString().padStart(2, '0')}.wav`);
}

console.log('');
console.log('🎵 全パターン生成完了！');
console.log('出力ファイル:');
console.log('  - music/patterns/base/base_00.wav ~ base_09.wav');
console.log('  - music/patterns/drums/drums_00.wav ~ drums_09.wav');
console.log('  - music/patterns/synth/synth_00.wav ~ synth_09.wav');
console.log('  - music/patterns/bass/bass_00.wav ~ bass_09.wav');
console.log('');
console.log('合計40ファイル, 10,000通りの組み合わせ可能！');
console.log('静的ページ対応の動的音楽システムに利用できます。');