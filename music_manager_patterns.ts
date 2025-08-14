// マルチパターン対応 MusicManager
class MusicManagerPatterns {
    private musicLayers: { [key: string]: HTMLAudioElement[] } = {};
    private layerVolumes: { [key: string]: number } = {};
    private targetVolumes: { [key: string]: number } = {};
    private currentPatterns: { [key: string]: number } = {};
    private targetPatterns: { [key: string]: number } = {};
    private isInitialized: boolean = false;
    private currentMusicPhase: number = 0;
    private fadeSpeed: number = 0.01;
    private patternCount: number = 10;
    
    // パターン選択ルール
    private patternRules = {
        base: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],    // スコアフェーズ毎
        drums: [0, 0, 1, 2, 3, 4, 5, 6, 7, 8],   // 戦闘の激しさで変化
        synth: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],   // UFO・ボス戦で変化
        bass: [0, 1, 1, 2, 2, 3, 3, 4, 4, 5]     // グルーヴの深さで変化
    };

    constructor() {
        // 各レイヤー10パターンずつ読み込み
        this.loadMusicPatterns('base', 'music/patterns/base/base_', 10);
        this.loadMusicPatterns('drums', 'music/patterns/drums/drums_', 10);
        this.loadMusicPatterns('synth', 'music/patterns/synth/synth_', 10);
        this.loadMusicPatterns('bass', 'music/patterns/bass/bass_', 10);
        
        // 初期設定
        this.layerVolumes = { base: 1.0, drums: 0.0, synth: 0.0, bass: 0.0 };
        this.targetVolumes = { base: 1.0, drums: 0.0, synth: 0.0, bass: 0.0 };
        this.currentPatterns = { base: 0, drums: 0, synth: 0, bass: 0 };
        this.targetPatterns = { base: 0, drums: 0, synth: 0, bass: 0 };
    }

    private loadMusicPatterns(layerName: string, basePath: string, count: number) {
        this.musicLayers[layerName] = [];
        
        for (let i = 0; i < count; i++) {
            const audio = new Audio();
            const filename = `${basePath}${i.toString().padStart(2, '0')}.wav`;
            audio.src = filename;
            audio.preload = 'auto';
            audio.loop = true;
            audio.volume = 0;
            
            // パターン読み込み完了チェック
            audio.addEventListener('canplaythrough', () => {
                this.checkInitialization();
            });
            
            this.musicLayers[layerName].push(audio);
        }
    }

    private checkInitialization() {
        // 全パターンが読み込まれたかチェック
        const totalPatterns = Object.keys(this.musicLayers).length * this.patternCount;
        let loadedPatterns = 0;
        
        Object.values(this.musicLayers).forEach(patterns => {
            patterns.forEach(audio => {
                if (audio.readyState >= 3) { // HAVE_FUTURE_DATA 以上
                    loadedPatterns++;
                }
            });
        });
        
        if (loadedPatterns >= totalPatterns && !this.isInitialized) {
            this.initializeMusic();
        }
    }

    private initializeMusic() {
        console.log('🎵 マルチパターン音楽システム初期化完了');
        
        // 初期パターンを同時開始
        Object.keys(this.musicLayers).forEach(layerName => {
            const pattern = this.currentPatterns[layerName];
            const audio = this.musicLayers[layerName][pattern];
            if (audio) {
                audio.currentTime = 0;
                audio.play().catch(e => console.log(`音楽再生エラー (${layerName}[${pattern}]):`, e));
            }
        });
        
        this.isInitialized = true;
    }

    public startMusic() {
        if (!this.isInitialized) {
            console.log('🎵 音楽システム初期化待機中...');
            return;
        }
        this.setLayerVolume('base', 1.0);
    }

    public stopMusic() {
        Object.keys(this.targetVolumes).forEach(layer => {
            this.setLayerVolume(layer, 0.0);
        });
    }

    public setLayerVolume(layerName: string, targetVolume: number, immediate: boolean = false) {
        if (layerName in this.targetVolumes) {
            this.targetVolumes[layerName] = Math.max(0, Math.min(1, targetVolume));
            
            if (immediate) {
                this.layerVolumes[layerName] = this.targetVolumes[layerName];
                this.updateLayerAudio(layerName);
            }
        }
    }

    private updateLayerAudio(layerName: string) {
        const pattern = this.currentPatterns[layerName];
        const audio = this.musicLayers[layerName]?.[pattern];
        if (audio) {
            audio.volume = this.layerVolumes[layerName];
        }
    }

    // パターン変更（滑らかな切り替え）
    public setLayerPattern(layerName: string, patternIndex: number) {
        if (layerName in this.currentPatterns && patternIndex >= 0 && patternIndex < this.patternCount) {
            this.targetPatterns[layerName] = patternIndex;
        }
    }

    private switchPattern(layerName: string, newPattern: number) {
        if (!this.musicLayers[layerName] || newPattern === this.currentPatterns[layerName]) {
            return;
        }

        const oldAudio = this.musicLayers[layerName][this.currentPatterns[layerName]];
        const newAudio = this.musicLayers[layerName][newPattern];
        
        if (oldAudio && newAudio) {
            // 新しいパターンを現在の再生位置で開始
            newAudio.currentTime = oldAudio.currentTime;
            newAudio.volume = this.layerVolumes[layerName];
            newAudio.play().catch(e => console.log(`パターン切り替えエラー (${layerName}[${newPattern}]):`, e));
            
            // 古いパターンをフェードアウトして停止
            const fadeOut = () => {
                if (oldAudio.volume > 0.01) {
                    oldAudio.volume = Math.max(0, oldAudio.volume - 0.05);
                    setTimeout(fadeOut, 50);
                } else {
                    oldAudio.pause();
                    oldAudio.volume = 0;
                }
            };
            setTimeout(fadeOut, 100);
            
            this.currentPatterns[layerName] = newPattern;
            console.log(`🎶 ${layerName} パターン ${newPattern} に切り替え`);
        }
    }

    public updateMusic() {
        // 音量フェード処理
        Object.keys(this.layerVolumes).forEach(layerName => {
            const current = this.layerVolumes[layerName];
            const target = this.targetVolumes[layerName];
            
            if (Math.abs(current - target) > 0.005) {
                if (current < target) {
                    this.layerVolumes[layerName] = Math.min(target, current + this.fadeSpeed);
                } else {
                    this.layerVolumes[layerName] = Math.max(target, current - this.fadeSpeed);
                }
                this.updateLayerAudio(layerName);
            }
        });

        // パターン切り替え処理
        Object.keys(this.targetPatterns).forEach(layerName => {
            if (this.targetPatterns[layerName] !== this.currentPatterns[layerName]) {
                this.switchPattern(layerName, this.targetPatterns[layerName]);
            }
        });
    }

    // ★スコア・状況連動のパターン選択
    public updateMusicByScore(currentScore: number) {
        const newPhase = Math.floor(currentScore / 1000);
        
        if (newPhase !== this.currentMusicPhase) {
            this.currentMusicPhase = newPhase;
            this.updatePatternsForPhase(newPhase);
        }
    }

    private updatePatternsForPhase(phase: number) {
        // スコアフェーズに応じたパターン選択
        const basePattern = this.patternRules.base[phase % 10];
        const complexity = Math.min(phase, 9); // 0-9の複雑さレベル
        
        this.setLayerPattern('base', basePattern);
        
        // レイヤー組み合わせとパターン選択
        switch (phase % 8) {
            case 0: // 0-999: Base のみ
                this.setLayerVolume('base', 1.0);
                this.setLayerVolume('drums', 0.0);
                this.setLayerVolume('synth', 0.0);
                this.setLayerVolume('bass', 0.0);
                break;
            case 1: // 1000-1999: Base + Bass
                this.setLayerVolume('base', 1.0);
                this.setLayerVolume('bass', 0.7);
                this.setLayerVolume('drums', 0.0);
                this.setLayerVolume('synth', 0.0);
                this.setLayerPattern('bass', this.patternRules.bass[complexity]);
                break;
            case 2: // 2000-2999: Base + Drums
                this.setLayerVolume('base', 1.0);
                this.setLayerVolume('drums', 0.8);
                this.setLayerVolume('synth', 0.0);
                this.setLayerVolume('bass', 0.0);
                this.setLayerPattern('drums', this.patternRules.drums[complexity]);
                break;
            case 3: // 3000-3999: Base + Bass + Drums
                this.setLayerVolume('base', 1.0);
                this.setLayerVolume('bass', 0.7);
                this.setLayerVolume('drums', 0.8);
                this.setLayerVolume('synth', 0.0);
                this.setLayerPattern('bass', this.patternRules.bass[complexity]);
                this.setLayerPattern('drums', this.patternRules.drums[complexity]);
                break;
            case 4: // 4000-4999: Base + Synth
                this.setLayerVolume('base', 1.0);
                this.setLayerVolume('synth', 0.9);
                this.setLayerVolume('drums', 0.0);
                this.setLayerVolume('bass', 0.0);
                this.setLayerPattern('synth', this.patternRules.synth[complexity]);
                break;
            case 5: // 5000-5999: Base + Bass + Synth
                this.setLayerVolume('base', 1.0);
                this.setLayerVolume('bass', 0.7);
                this.setLayerVolume('synth', 0.9);
                this.setLayerVolume('drums', 0.0);
                this.setLayerPattern('bass', this.patternRules.bass[complexity]);
                this.setLayerPattern('synth', this.patternRules.synth[complexity]);
                break;
            case 6: // 6000-6999: Base + Drums + Synth
                this.setLayerVolume('base', 1.0);
                this.setLayerVolume('drums', 0.8);
                this.setLayerVolume('synth', 0.9);
                this.setLayerVolume('bass', 0.0);
                this.setLayerPattern('drums', this.patternRules.drums[complexity]);
                this.setLayerPattern('synth', this.patternRules.synth[complexity]);
                break;
            case 7: // 7000-7999: 全レイヤー
                this.setLayerVolume('base', 1.0);
                this.setLayerVolume('bass', 0.7);
                this.setLayerVolume('drums', 0.8);
                this.setLayerVolume('synth', 0.9);
                this.setLayerPattern('bass', this.patternRules.bass[complexity]);
                this.setLayerPattern('drums', this.patternRules.drums[complexity]);
                this.setLayerPattern('synth', this.patternRules.synth[complexity]);
                break;
        }
        
        console.log(`🎵 フェーズ ${phase}: パターン更新 (Base:${basePattern}, 複雑さ:${complexity})`);
    }

    // 戦闘状況による追加制御
    public updateByCombatSituation(hasCombat: boolean, hasUFO: boolean, isBossLevel: boolean) {
        if (hasCombat) {
            // 戦闘時はより激しいドラム・ベースパターン
            const combatDrumsPattern = Math.min(7 + Math.floor(Math.random() * 3), 9);
            const combatBassPattern = Math.min(5 + Math.floor(Math.random() * 3), 7);
            
            if (this.targetVolumes.drums > 0) {
                this.setLayerPattern('drums', combatDrumsPattern);
            }
            if (this.targetVolumes.bass > 0) {
                this.setLayerPattern('bass', combatBassPattern);
            }
        }
        
        if (hasUFO || isBossLevel) {
            // UFO・ボス戦時は高エネルギーシンセパターン
            const bossPattern = Math.min(8 + Math.floor(Math.random() * 2), 9);
            if (this.targetVolumes.synth > 0) {
                this.setLayerPattern('synth', bossPattern);
            }
        }
    }

    // 従来のメソッド（互換性維持）
    public setDrumsActive(active: boolean) {
        if (active && this.targetVolumes.drums === 0.0) {
            this.setLayerVolume('drums', 0.6);
        }
    }

    public setSynthActive(active: boolean) {
        if (active && this.targetVolumes.synth === 0.0) {
            this.setLayerVolume('synth', 0.7);
        }
    }

    public setBassActive(active: boolean) {
        if (active && this.targetVolumes.bass === 0.0) {
            this.setLayerVolume('bass', 0.5);
        }
    }

    public isPlaying(): boolean {
        const basePattern = this.currentPatterns.base;
        const baseAudio = this.musicLayers.base?.[basePattern];
        return baseAudio ? !baseAudio.paused : false;
    }

    // デバッグ用：現在の状態取得
    public getStatus() {
        return {
            phase: this.currentMusicPhase,
            patterns: { ...this.currentPatterns },
            volumes: { ...this.layerVolumes },
            initialized: this.isInitialized
        };
    }
}