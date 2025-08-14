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
    'F#5': 739.99,
    'G5': 783.99,
    'A5': 880.00,
    'B5': 987.77
};

// 128 BPM = 2.133 beats per second, 30 seconds
const SAMPLE_RATE = 44100;
const BPM = 128;
const DURATION = 30; // seconds
const BEAT_DURATION = 60 / BPM; // seconds per beat

function generateArpeggioWave(frequency, duration, attack = 0.05, decay = 0.1, sustain = 0.7, release = 0.15) {
    const samples = Math.floor(duration * SAMPLE_RATE);
    const wave = new Float32Array(samples);
    
    for (let i = 0; i < samples; i++) {
        const time = i / SAMPLE_RATE;
        const timeRatio = time / duration;
        
        // ADSR envelope for sharp attack
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
        
        // Bright synth waveform with harmonics
        const fundamental = Math.sin(2 * Math.PI * frequency * time);
        const harmonic2 = 0.4 * Math.sin(2 * Math.PI * frequency * 2 * time);
        const harmonic3 = 0.2 * Math.sin(2 * Math.PI * frequency * 3 * time);
        const harmonic4 = 0.1 * Math.sin(2 * Math.PI * frequency * 4 * time);
        
        // Add slight detuning for width
        const detuned = 0.1 * Math.sin(2 * Math.PI * frequency * 1.007 * time);
        
        wave[i] = envelope * (fundamental + harmonic2 + harmonic3 + harmonic4 + detuned);
    }
    
    return wave;
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

// Polyrhythmic arpeggio patterns with different time signatures
const POLYRHYTHM_PATTERNS = [
    // Pattern 10: 5/4 time signature (5 beats per measure)
    {
        timeSignature: [5, 4],
        notes: ['B4', 'D5', 'F#5', 'A5', 'B5'],
        noteDuration: 0.2,
        description: '5/4 ascending arpeggio'
    },
    
    // Pattern 11: 7/8 time signature (7 eighth notes per measure)
    {
        timeSignature: [7, 8],
        notes: ['B3', 'F#4', 'D5', 'G4', 'B4', 'E5', 'A4'],
        noteDuration: 0.15,
        description: '7/8 complex arpeggio'
    },
    
    // Pattern 12: 9/8 time signature (9 eighth notes, often felt as 3 groups of 3)
    {
        timeSignature: [9, 8],
        notes: ['B4', 'D5', 'F#5', 'B4', 'E5', 'G5', 'B4', 'A5', 'D5'],
        noteDuration: 0.13,
        description: '9/8 triplet feel'
    },
    
    // Pattern 13: 5/8 time signature (5 eighth notes)
    {
        timeSignature: [5, 8],
        notes: ['F#4', 'B4', 'D5', 'F#5', 'A5'],
        noteDuration: 0.18,
        description: '5/8 quick arpeggio'
    },
    
    // Pattern 14: 7/4 time signature (7 quarter notes)
    {
        timeSignature: [7, 4],
        notes: ['B3', 'D4', 'F#4', 'A4', 'B4', 'D5', 'F#5'],
        noteDuration: 0.25,
        description: '7/4 slow build'
    },
    
    // Pattern 15: 11/8 time signature (11 eighth notes)
    {
        timeSignature: [11, 8],
        notes: ['B4', 'C#5', 'D5', 'E5', 'F#5', 'G5', 'A5', 'B5', 'A5', 'G5', 'F#5'],
        noteDuration: 0.11,
        description: '11/8 scale run'
    },
    
    // Pattern 16: 6/8 compound time (felt in 2)
    {
        timeSignature: [6, 8],
        notes: ['B4', 'D5', 'F#5', 'B5', 'F#5', 'D5'],
        noteDuration: 0.16,
        description: '6/8 compound arpeggio'
    },
    
    // Pattern 17: 15/16 time signature (complex asymmetrical)
    {
        timeSignature: [15, 16],
        notes: ['B3', 'D4', 'F#4', 'A4', 'B4', 'C#5', 'D5', 'E5', 'F#5', 'G5', 'A5', 'B5', 'G5', 'E5', 'D5'],
        noteDuration: 0.08,
        description: '15/16 complex polyrhythm'
    },
    
    // Pattern 18: 13/8 time signature
    {
        timeSignature: [13, 8],
        notes: ['B4', 'F#5', 'D5', 'A5', 'E5', 'B5', 'G5', 'D5', 'A4', 'F#4', 'B4', 'G4', 'E4'],
        noteDuration: 0.095,
        description: '13/8 irregular pattern'
    },
    
    // Pattern 19: 4/4 with polyrhythmic 3-against-4
    {
        timeSignature: [4, 4],
        notes: ['B4', 'D5', 'F#5', 'A5'], // 3 notes against 4 beats
        noteDuration: 0.33, // Creates 3-against-4 polyrhythm
        description: '4/4 with 3-against-4 polyrhythm'
    }
];

// Generate 10 new polyrhythmic synth patterns (patterns 10-19)
for (let patternNum = 0; patternNum < 10; patternNum++) {
    console.log(`Generating synth pattern ${patternNum + 10}...`);
    
    const pattern = POLYRHYTHM_PATTERNS[patternNum];
    console.log(`  Time signature: ${pattern.timeSignature[0]}/${pattern.timeSignature[1]}`);
    console.log(`  Description: ${pattern.description}`);
    
    const totalSamples = DURATION * SAMPLE_RATE;
    const synthPattern = new Float32Array(totalSamples);
    
    // Calculate pattern duration based on time signature
    const beatsPerPattern = pattern.timeSignature[0];
    const beatUnit = 4 / pattern.timeSignature[1]; // How much of a whole note each beat represents
    const patternDuration = (beatsPerPattern * beatUnit) * BEAT_DURATION;
    
    let currentTime = 0;
    
    // Fill the entire 30-second duration with repeating patterns
    while (currentTime < DURATION) {
        for (let noteIndex = 0; noteIndex < pattern.notes.length; noteIndex++) {
            const noteName = pattern.notes[noteIndex];
            const frequency = B_MINOR_SCALE[noteName];
            
            if (frequency && currentTime < DURATION) {
                const noteWave = generateArpeggioWave(frequency, pattern.noteDuration);
                const startSample = Math.floor(currentTime * SAMPLE_RATE);
                
                // Add note to the pattern
                for (let i = 0; i < noteWave.length && startSample + i < totalSamples; i++) {
                    synthPattern[startSample + i] += noteWave[i] * 0.4; // Volume adjustment
                }
                
                currentTime += pattern.noteDuration;
            }
        }
        
        // Add slight pause between pattern repetitions for some patterns
        if (pattern.timeSignature[0] >= 7) {
            currentTime += pattern.noteDuration * 0.5;
        }
    }
    
    // Apply effects
    for (let i = 0; i < synthPattern.length; i++) {
        const time = i / SAMPLE_RATE;
        
        // Add subtle chorus effect
        const lfo = Math.sin(2 * Math.PI * 0.7 * time) * 0.02;
        
        // Apply soft limiting
        synthPattern[i] = Math.tanh(synthPattern[i] * (1 + lfo));
    }
    
    const filename = `music/synth/synth_${(patternNum + 10).toString().padStart(2, '0')}.wav`;
    bufferToWav(synthPattern, filename);
}

console.log('All polyrhythmic synth patterns generated successfully!');
console.log('Generated patterns 10-19 with time signatures: 5/4, 7/8, 9/8, 5/8, 7/4, 11/8, 6/8, 15/16, 13/8, 4/4(poly)');