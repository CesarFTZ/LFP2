/**
 * AudioEngine.js - Web Audio API Polyphonic Synthesizer & Sequencer
 * Handles real-time polyphonic chord playback, arpeggio patterns, BPM timing,
 * sound presets (Piano, EPiano, Synth Pad), and visual feedback callbacks.
 */

class AudioEngine {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.volume = 0.8;
    this.isPlaying = false;
    this.currentTimers = [];
    this.activeSources = []; // Track active oscillators and gain nodes
    this.preset = 'piano'; // piano, epiano, pad
    this.playbackStyle = 'block'; // block, arpeggio
    this.bpm = 100;
    this.chordDuration = 2; // beats per chord

    // Callbacks for visualizer updates
    this.onNoteStart = null;
    this.onNoteEnd = null;
    this.onChordStart = null;
    this.onChordEnd = null;
    this.onPlaybackEnd = null;
  }

  // Initialize Web Audio Context on first interaction
  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.volume, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  setVolume(val) {
    this.volume = Math.max(0, Math.min(1, val));
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.volume, this.ctx.currentTime);
    }
  }

  setBpm(bpm) {
    this.bpm = Math.max(40, Math.min(240, bpm));
  }

  setPreset(preset) {
    this.preset = preset;
  }

  setPlaybackStyle(style) {
    this.playbackStyle = style;
  }

  // Convert MIDI note to Frequency in Hz
  midiToFreq(midi) {
    return 440 * Math.pow(2, (midi - 69) / 12);
  }

  // Synthesize a single note with ADSR envelope contained strictly within slotDuration
  playNote(midiNote, startTime, slotDuration = 0.8) {
    if (!this.ctx) this.init();

    const freq = this.midiToFreq(midiNote);
    const osc = this.ctx.createOscillator();
    const gainNode = this.ctx.createGain();
    let osc2 = null;
    let gain2 = null;

    // Configure timbre based on preset
    switch (this.preset) {
      case 'epiano':
        osc.type = 'sine';
        // Add subtle harmonic overtone
        osc2 = this.ctx.createOscillator();
        gain2 = this.ctx.createGain();
        osc2.type = 'triangle';
        osc2.frequency.setValueAtTime(freq * 2, startTime);
        gain2.gain.setValueAtTime(0.15, startTime);
        osc2.connect(gain2);
        gain2.connect(gainNode);
        break;

      case 'pad':
        osc.type = 'sawtooth';
        // Low pass filter for warm pad sound
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(800, startTime);
        osc.connect(filter);
        filter.connect(gainNode);
        break;

      case 'piano':
      default:
        osc.type = 'triangle';
        break;
    }

    if (this.preset !== 'pad') {
      osc.connect(gainNode);
    }

    gainNode.connect(this.masterGain);
    osc.frequency.setValueAtTime(freq, startTime);

    // Calculate envelope so the sound completes strictly within slotDuration
    let release = Math.min(0.15, slotDuration * 0.2);
    let attack = Math.min(0.02, slotDuration * 0.1);
    let decay = Math.min(0.15, slotDuration * 0.2);
    let sustain = 0.6;

    if (this.preset === 'pad') {
      attack = Math.min(0.1, slotDuration * 0.2);
      decay = Math.min(0.2, slotDuration * 0.2);
      sustain = 0.8;
      release = Math.min(0.2, slotDuration * 0.25);
    }

    const noteDuration = Math.max(0.05, slotDuration - release);
    const stopTime = startTime + noteDuration + release;

    gainNode.gain.setValueAtTime(0.0001, startTime);
    gainNode.gain.linearRampToValueAtTime(0.4, startTime + attack);
    gainNode.gain.exponentialRampToValueAtTime(Math.max(0.0001, 0.4 * sustain), startTime + attack + decay);
    gainNode.gain.setValueAtTime(Math.max(0.0001, 0.4 * sustain), startTime + noteDuration);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, stopTime);

    osc.start(startTime);
    osc.stop(stopTime);

    if (osc2) {
      osc2.start(startTime);
      osc2.stop(stopTime);
    }

    // Keep track of active sound sources to enable instant stopping
    const sourceObj = { osc, osc2, gainNode };
    this.activeSources.push(sourceObj);

    osc.onended = () => {
      const idx = this.activeSources.indexOf(sourceObj);
      if (idx !== -1) {
        this.activeSources.splice(idx, 1);
      }
    };

    // Visual callbacks timing
    const startDelay = Math.max(0, (startTime - this.ctx.currentTime) * 1000);
    const stopDelay = Math.max(0, (stopTime - this.ctx.currentTime) * 1000);

    const t1 = setTimeout(() => {
      if (this.onNoteStart) this.onNoteStart(midiNote);
    }, startDelay);

    const t2 = setTimeout(() => {
      if (this.onNoteEnd) this.onNoteEnd(midiNote);
    }, stopDelay);

    this.currentTimers.push(t1, t2);
  }

  // Play a single note, ensuring all previous playback is stopped first
  playSingleNote(midiNote, durationSec = 0.8) {
    this.stop();
    this.init();
    const now = this.ctx.currentTime;
    this.playNote(midiNote, now, durationSec);
  }

  // Play a single chord immediately, stopping any previous playback first
  playSingleChord(chord, durationSec = 1.5) {
    this.stop();
    this.init();
    const now = this.ctx.currentTime;
    chord.midiNotes.forEach(midi => {
      this.playNote(midi, now, durationSec);
    });
  }

  // Play full progression sequence
  playProgression(chords, speedFactor = 1.0) {
    this.stop(); // Clear any running audio and timers
    this.init();
    this.isPlaying = true;

    const effectiveBpm = Math.max(20, this.bpm * speedFactor);
    const secondsPerBeat = 60 / effectiveBpm;
    const chordDurationSec = this.chordDuration * secondsPerBeat;
    let currentTime = this.ctx.currentTime + 0.05;

    chords.forEach((chord, chordIdx) => {
      const chordStartTime = currentTime;
      const chordStartDelay = (chordStartTime - this.ctx.currentTime) * 1000;

      // Chord highlight callback
      const tStart = setTimeout(() => {
        if (this.onChordStart) this.onChordStart(chordIdx, chord);
      }, chordStartDelay);

      const tEnd = setTimeout(() => {
        if (this.onChordEnd) this.onChordEnd(chordIdx, chord);
      }, chordStartDelay + (chordDurationSec * 1000));

      this.currentTimers.push(tStart, tEnd);

      if (this.playbackStyle === 'arpeggio') {
        // Play notes sequentially in arpeggio strictly within chordDurationSec
        const noteDuration = chordDurationSec / chord.midiNotes.length;
        chord.midiNotes.forEach((midi, noteIdx) => {
          const noteTime = chordStartTime + (noteIdx * noteDuration);
          this.playNote(midi, noteTime, noteDuration);
        });
      } else {
        // Block Chords strictly within chordDurationSec
        chord.midiNotes.forEach(midi => {
          this.playNote(midi, chordStartTime, chordDurationSec);
        });
      }

      currentTime += chordDurationSec;
    });

    // Final playback complete callback
    const totalDurationMs = (currentTime - this.ctx.currentTime) * 1000;
    const tFinal = setTimeout(() => {
      this.isPlaying = false;
      if (this.onPlaybackEnd) this.onPlaybackEnd();
    }, totalDurationMs);

    this.currentTimers.push(tFinal);
  }

  // Stop playback immediately, cutting off all active audio sources and timers
  stop() {
    this.currentTimers.forEach(t => clearTimeout(t));
    this.currentTimers = [];

    if (this.ctx && this.ctx.state === 'running') {
      const now = this.ctx.currentTime;
      this.activeSources.forEach(source => {
        try {
          if (source.gainNode) {
            source.gainNode.gain.cancelScheduledValues(now);
            source.gainNode.gain.setValueAtTime(source.gainNode.gain.value, now);
            source.gainNode.gain.linearRampToValueAtTime(0.0001, now + 0.01);
          }
          if (source.osc) {
            source.osc.stop(now + 0.015);
          }
          if (source.osc2) {
            source.osc2.stop(now + 0.015);
          }
        } catch (e) {
          // Audio source might have already finished/stopped
        }
      });
    }
    this.activeSources = [];

    this.isPlaying = false;
    if (this.onPlaybackEnd) this.onPlaybackEnd();
  }
}

// Export for module use or browser global
if (typeof window !== 'undefined') {
  window.AudioEngine = AudioEngine;
}
