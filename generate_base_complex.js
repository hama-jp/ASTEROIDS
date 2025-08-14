const fs = require('fs');

// Extended B minor scale with chromatic notes for complex chords
const B_MINOR_SCALE = {
    'A#2': 116.54,  // Bb2
    'B2': 123.47,
    'C3': 130.81,
    'C#3': 138.59,
    'D3': 146.83,
    'D#3': 155.56,  // Eb3
    'E3': 164.81,
    'F3': 174.61,
    'F#3': 185.00,
    'G3': 196.00,
    'G#3': 207.65,  // Ab3
    'A3': 220.00,
    'A#3': 233.08,  // Bb3
    'B3': 246.94,
    'C4': 261.63,
    'C#4': 277.18,
    'D4': 293.66,
    'D#4': 311.13,  // Eb4
    'E4': 329.63,
    'F4': 349.23,
    'F#4': 369.99,
    'G4': 392.00,
    'G#4': 415.30,  // Ab4
    'A4': 440.00,
    'A#4': 466.16,  // Bb4
    'B4': 493.88,
    'C5': 523.25,
    'C#5': 554.37,
    'D5': 587.33
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
        
        // Rich bass sound with multiple harmonics
        const fundamental = Math.sin(2 * Math.PI * frequency * time);
        const harmonic2 = 0.4 * Math.sin(2 * Math.PI * frequency * 2 * time);
        const harmonic3 = 0.2 * Math.sin(2 * Math.PI * frequency * 3 * time);
        const subharmonic = 0.3 * Math.sin(2 * Math.PI * frequency * 0.5 * time); // Sub bass
        
        wave[i] = envelope * (fundamental + harmonic2 + harmonic3 + subharmonic);
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

// Complex chord progressions with diminished, augmented, and slash chords
const COMPLEX_CHORD_PROGRESSIONS = [
    // Pattern 10: Diminished chords
    {
        name: 'Diminished Progression',
        chords: [
            ['B3', 'D4', 'F4'],        // Bm (simplified as Bdim)
            ['G#3', 'B3', 'D4'],       // G#dim
            ['F#3', 'A3', 'C4'],       // F#dim
            ['D#3', 'F#3', 'A3']       // D#dim
        ]
    },
    
    // Pattern 11: Augmented chords
    {
        name: 'Augmented Progression',
        chords: [
            ['B3', 'D#4', 'G4'],       // Baug
            ['E3', 'G#3', 'C4'],       // Eaug
            ['A3', 'C#4', 'F4'],       // Aaug
            ['D3', 'F#3', 'A#3']       // Daug
        ]
    },
    
    // Pattern 12: Slash chords (chord over bass note)
    {
        name: 'Slash Chord Progression',
        chords: [
            ['D3', 'B3', 'D4', 'F#4'], // Bm/D
            ['A2', 'G3', 'B3', 'D4'],  // G/A
            ['F#2', 'D3', 'F#3', 'A3'], // D/F#
            ['E2', 'A3', 'C#4', 'E4']   // A/E
        ]
    },
    
    // Pattern 13: Minor 7th with alterations
    {
        name: 'Altered Minor 7th',
        chords: [
            ['B3', 'D4', 'F#4', 'A4'],     // Bm7
            ['E3', 'G3', 'B3', 'D4'],      // Em7
            ['A3', 'C4', 'E4', 'G4'],      // Am7
            ['F#3', 'A3', 'C#4', 'E4']     // F#m7
        ]
    },
    
    // Pattern 14: Half-diminished and fully diminished
    {
        name: 'Half-Diminished Progression',
        chords: [
            ['B3', 'D4', 'F4', 'A4'],      // Bm7b5 (half-dim)
            ['F#3', 'A3', 'C4', 'E4'],     // F#m7b5
            ['C#3', 'E3', 'G3', 'B3'],     // C#m7b5
            ['G#3', 'B3', 'D4', 'F#4']     // G#m7b5
        ]
    },
    
    // Pattern 15: Extended chords (9th, 11th)
    {
        name: 'Extended Chord Progression',
        chords: [
            ['B3', 'D4', 'F#4', 'A4', 'C#5'], // Bm9
            ['G3', 'B3', 'D4', 'F#4', 'A4'],  // Gm9
            ['D3', 'F#3', 'A3', 'C4', 'E4'],  // Dm9
            ['A3', 'C#4', 'E4', 'G4', 'B4']   // Am9
        ]
    },
    
    // Pattern 16: Chromatic bass movement
    {
        name: 'Chromatic Bass Movement',
        chords: [
            ['B2', 'B3', 'D4', 'F#4'],     // Bm
            ['C3', 'A3', 'C4', 'E4'],      // Am/C
            ['C#3', 'G3', 'B3', 'D4'],     // G/C#
            ['D3', 'F#3', 'A3', 'D4']      // D
        ]
    },
    
    // Pattern 17: Modal interchange (borrowed chords)
    {
        name: 'Modal Interchange',
        chords: [
            ['B3', 'D4', 'F#4'],           // Bm
            ['D3', 'F4', 'A3'],            // Dm (borrowed from B major)
            ['G3', 'A#3', 'D4'],           // Gm (borrowed)
            ['F#3', 'A3', 'C#4']           // F#m
        ]
    },
    
    // Pattern 18: Quartal harmony (4th intervals)
    {
        name: 'Quartal Harmony',
        chords: [
            ['B3', 'E4', 'A4'],            // Quartal chord
            ['E3', 'A3', 'D4'],            // Quartal chord
            ['A3', 'D4', 'G4'],            // Quartal chord
            ['D3', 'G3', 'C4']             // Quartal chord
        ]
    },
    
    // Pattern 19: Polytonality (multiple keys)
    {
        name: 'Polytonal Progression',
        chords: [
            ['B3', 'D4', 'F#4', 'C4', 'E4', 'G4'], // Bm + C major
            ['A3', 'C4', 'E4', 'F#3', 'A#3', 'D4'], // Am + F# major
            ['G3', 'B3', 'D4', 'A3', 'C#4', 'F#4'], // G major + A major
            ['F#3', 'A3', 'C#4', 'G3', 'B3', 'E4']  // F#m + G major
        ]
    }
];

// Generate 10 complex base patterns (patterns 10-19)
for (let patternNum = 0; patternNum < 10; patternNum++) {
    console.log(`Generating base pattern ${patternNum + 10}...`);
    
    const progression = COMPLEX_CHORD_PROGRESSIONS[patternNum];
    console.log(`  Progression: ${progression.name}`);
    
    const totalSamples = DURATION * SAMPLE_RATE;
    const pattern = new Float32Array(totalSamples);
    
    // Each chord lasts for multiple beats
    const beatsPerChord = Math.floor(TOTAL_BEATS / progression.chords.length);
    const chordDuration = beatsPerChord * BEAT_DURATION;
    
    let currentTime = 0;
    
    for (let chordIndex = 0; chordIndex < progression.chords.length; chordIndex++) {
        const chord = progression.chords[chordIndex];
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
                pattern[startSample + i] += chordBuffer[i] * 0.5; // Volume adjustment for complex chords
            }
        }
        
        currentTime += chordDuration;
    }
    
    // Apply sophisticated processing
    for (let i = 0; i < pattern.length; i++) {
        const time = i / SAMPLE_RATE;
        const progressRatio = time / DURATION;
        
        // Add dynamic variation
        let dynamicMultiplier = 0.7 + 0.3 * Math.sin(progressRatio * Math.PI * 2);
        
        // Add subtle chorus for complex chords
        const lfo = Math.sin(2 * Math.PI * 1.3 * time) * 0.03;
        
        pattern[i] *= dynamicMultiplier * (1 + lfo);
        
        // Soft compression
        pattern[i] = Math.tanh(pattern[i] * 1.2);
    }
    
    const filename = `music/base/base_${(patternNum + 10).toString().padStart(2, '0')}.wav`;
    bufferToWav(pattern, filename);
}

console.log('All complex base patterns generated successfully!');
console.log('Generated patterns 10-19 with: Diminished, Augmented, Slash chords, Extended chords, etc.');