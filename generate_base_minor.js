const fs = require('fs');

// B minor scale notes (frequencies in Hz)
const B_MINOR_SCALE = {
    'B3': 246.94,
    'C#4': 277.18,
    'D4': 293.66,
    'E4': 329.63,
    'F#4': 369.99,
    'G4': 392.00,
    'A4': 440.00,
    'B4': 493.88,
    'C#5': 554.37,
    'D5': 587.33,
    'E5': 659.25,
    'F#5': 739.99
};

// 128 BPM = 2.133 beats per second, 30 seconds = 64 beats
const SAMPLE_RATE = 44100;
const BPM = 128;
const DURATION = 30; // seconds
const BEAT_DURATION = 60 / BPM; // seconds per beat
const TOTAL_BEATS = Math.floor(DURATION / BEAT_DURATION);

function generateWaveform(frequency, duration, attack = 0.1, decay = 0.2, sustain = 0.6, release = 0.1) {
    const samples = Math.floor(duration * SAMPLE_RATE);
    const wave = new Float32Array(samples);
    
    for (let i = 0; i < samples; i++) {
        const time = i / SAMPLE_RATE;
        const timeRatio = time / duration;
        
        // ADSR envelope
        let envelope = 1;
        if (timeRatio < attack) {
            envelope = timeRatio / attack;
        } else if (timeRatio < attack + decay) {
            const decayProgress = (timeRatio - attack) / decay;
            envelope = 1 - decayProgress * (1 - sustain);
        } else if (timeRatio < 1 - release) {
            envelope = sustain;
        } else {
            const releaseProgress = (timeRatio - (1 - release)) / release;
            envelope = sustain * (1 - releaseProgress);
        }
        
        // 基本波形（サイン波 + 少しのハーモニクス）
        const fundamental = Math.sin(2 * Math.PI * frequency * time);
        const harmonic2 = 0.3 * Math.sin(2 * Math.PI * frequency * 2 * time);
        const harmonic3 = 0.1 * Math.sin(2 * Math.PI * frequency * 3 * time);
        
        wave[i] = envelope * (fundamental + harmonic2 + harmonic3);
    }
    
    return wave;
}

function combineWaves(waves) {
    const maxLength = Math.max(...waves.map(w => w.length));
    const combined = new Float32Array(maxLength);
    
    for (let i = 0; i < maxLength; i++) {
        let sum = 0;
        for (const wave of waves) {
            if (i < wave.length) {
                sum += wave[i];
            }
        }
        combined[i] = sum / waves.length;
    }
    
    return combined;
}

function bufferToWav(buffer, filename) {
    const length = buffer.length;
    const arrayBuffer = new ArrayBuffer(44 + length * 2);
    const view = new DataView(arrayBuffer);
    
    // WAV header
    const writeString = (offset, string) => {
        for (let i = 0; i < string.length; i++) {
            view.setUint8(offset + i, string.charCodeAt(i));
        }
    };
    
    writeString(0, 'RIFF');
    view.setUint32(4, 36 + length * 2, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, 1, true);
    view.setUint32(24, SAMPLE_RATE, true);
    view.setUint32(28, SAMPLE_RATE * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    writeString(36, 'data');
    view.setUint32(40, length * 2, true);
    
    let offset = 44;
    for (let i = 0; i < length; i++) {
        const sample = Math.max(-1, Math.min(1, buffer[i]));
        view.setInt16(offset, sample * 0x7FFF, true);
        offset += 2;
    }
    
    fs.writeFileSync(filename, Buffer.from(arrayBuffer));
    console.log(`Generated: ${filename}`);
}

// B minor chord progressions for 10 patterns
const CHORD_PROGRESSIONS = [
    // Pattern 0: Simple Bm - G - D - A
    [['B3', 'D4', 'F#4'], ['G4', 'B4', 'D5'], ['D4', 'F#4', 'A4'], ['A4', 'C#5', 'E5']],
    
    // Pattern 1: Bm - Em - F#m - G
    [['B3', 'D4', 'F#4'], ['E4', 'G4', 'B4'], ['F#4', 'A4', 'C#5'], ['G4', 'B4', 'D5']],
    
    // Pattern 2: Bm - A - G - F#m
    [['B3', 'D4', 'F#4'], ['A4', 'C#5', 'E5'], ['G4', 'B4', 'D5'], ['F#4', 'A4', 'C#5']],
    
    // Pattern 3: Bm - D - Em - G
    [['B3', 'D4', 'F#4'], ['D4', 'F#4', 'A4'], ['E4', 'G4', 'B4'], ['G4', 'B4', 'D5']],
    
    // Pattern 4: Bm - G - A - F#m
    [['B3', 'D4', 'F#4'], ['G4', 'B4', 'D5'], ['A4', 'C#5', 'E5'], ['F#4', 'A4', 'C#5']],
    
    // Pattern 5: Bm - Em - A - D
    [['B3', 'D4', 'F#4'], ['E4', 'G4', 'B4'], ['A4', 'C#5', 'E5'], ['D4', 'F#4', 'A4']],
    
    // Pattern 6: Bm - F#m - G - A
    [['B3', 'D4', 'F#4'], ['F#4', 'A4', 'C#5'], ['G4', 'B4', 'D5'], ['A4', 'C#5', 'E5']],
    
    // Pattern 7: Bm - D - A - Em
    [['B3', 'D4', 'F#4'], ['D4', 'F#4', 'A4'], ['A4', 'C#5', 'E5'], ['E4', 'G4', 'B4']],
    
    // Pattern 8: Bm - G - Em - A
    [['B3', 'D4', 'F#4'], ['G4', 'B4', 'D5'], ['E4', 'G4', 'B4'], ['A4', 'C#5', 'E5']],
    
    // Pattern 9: Complex: Bm - Em - F#m - G - A - D - Em - F#m
    [['B3', 'D4', 'F#4'], ['E4', 'G4', 'B4'], ['F#4', 'A4', 'C#5'], ['G4', 'B4', 'D5']]
];

// Generate 10 base patterns
for (let patternNum = 0; patternNum < 10; patternNum++) {
    console.log(`Generating base pattern ${patternNum}...`);
    
    const chordProgression = CHORD_PROGRESSIONS[patternNum];
    const totalSamples = DURATION * SAMPLE_RATE;
    const pattern = new Float32Array(totalSamples);
    
    // Each chord lasts for multiple beats
    const beatsPerChord = Math.floor(TOTAL_BEATS / chordProgression.length);
    const chordDuration = beatsPerChord * BEAT_DURATION;
    
    let currentTime = 0;
    
    for (let chordIndex = 0; chordIndex < chordProgression.length; chordIndex++) {
        const chord = chordProgression[chordIndex];
        const chordWaves = [];
        
        // Generate each note in the chord
        for (const noteName of chord) {
            const frequency = B_MINOR_SCALE[noteName];
            if (frequency) {
                const noteWave = generateWaveform(frequency, chordDuration, 0.1, 0.3, 0.5, 0.1);
                chordWaves.push(noteWave);
            }
        }
        
        // Combine chord notes
        if (chordWaves.length > 0) {
            const chordBuffer = combineWaves(chordWaves);
            const startSample = Math.floor(currentTime * SAMPLE_RATE);
            
            for (let i = 0; i < chordBuffer.length && startSample + i < totalSamples; i++) {
                pattern[startSample + i] += chordBuffer[i] * 0.6; // Volume adjustment
            }
        }
        
        currentTime += chordDuration;
    }
    
    // Apply some variation and dynamics
    for (let i = 0; i < pattern.length; i++) {
        const time = i / SAMPLE_RATE;
        const progressRatio = time / DURATION;
        
        // Add some dynamic variation
        let dynamicMultiplier = 0.8 + 0.2 * Math.sin(progressRatio * Math.PI * 4);
        
        // Add subtle tremolo effect
        const tremolo = 1 + 0.05 * Math.sin(2 * Math.PI * 4 * time);
        
        pattern[i] *= dynamicMultiplier * tremolo;
        
        // Soft limiter
        pattern[i] = Math.tanh(pattern[i]);
    }
    
    const filename = `music/base/base_${patternNum.toString().padStart(2, '0')}.wav`;
    bufferToWav(pattern, filename);
}

console.log('All base patterns generated successfully!');