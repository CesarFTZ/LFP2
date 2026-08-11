/**
 * TheoryEngine.js - Core Music Theory Logic & Rule Engine
 * Implements pitch classes, scale modes, chord construction, harmonic functions,
 * and the 5 modular algorithmic generators specified in concept.txt.
 */

class TheoryEngine {
  constructor() {
    this.NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    this.FLAT_NAMES = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];

    // Preferred key display names
    this.KEYS = ['C', 'C#', 'Db', 'D', 'Eb', 'E', 'F', 'F#', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];

    this.MODES = {
      major: { name: 'Mayor (Jónico)', intervals: [0, 2, 4, 5, 7, 9, 11], numerals: ['I', 'ii', 'iii', 'IV', 'V', 'vi', 'vii°'] },
      minor: { name: 'Menor Natural (Eólico)', intervals: [0, 2, 3, 5, 7, 8, 10], numerals: ['i', 'ii°', 'III', 'iv', 'v', 'VI', 'VII'] },
      harmonic_minor: { name: 'Menor Armónica', intervals: [0, 2, 3, 5, 7, 8, 11], numerals: ['i', 'ii°', 'III+', 'iv', 'V', 'VI', 'vii°'] },
      dorian: { name: 'Dórico', intervals: [0, 2, 3, 5, 7, 9, 10], numerals: ['i', 'ii', 'III', 'IV', 'v', 'vi°', 'VII'] },
      mixolydian: { name: 'Mixolidio', intervals: [0, 2, 4, 5, 7, 9, 10], numerals: ['I', 'ii', 'iii°', 'IV', 'v', 'vi', 'VII'] },
      lydian: { name: 'Lidio', intervals: [0, 2, 4, 6, 7, 9, 11], numerals: ['I', 'II', 'iii', '#iv°', 'V', 'vi', 'vii'] },
      phrygian: { name: 'Frigio', intervals: [0, 1, 3, 5, 7, 8, 10], numerals: ['i', 'bII', 'III', 'iv', 'v°', 'VI', 'vii'] }
    };
  }

  // Convert note name to MIDI number (Octave 4 by default)
  noteToMidi(noteName, octave = 4) {
    let cleanNote = noteName.replace(/[0-9]/g, '');
    let index = this.NOTE_NAMES.indexOf(cleanNote);
    if (index === -1) index = this.FLAT_NAMES.indexOf(cleanNote);
    if (index === -1) index = 0;
    return 12 * (octave + 1) + index;
  }

  // Convert pitch index (0-11) to name
  pitchToName(pitch, preferFlat = false) {
    let normalized = ((pitch % 12) + 12) % 12;
    return preferFlat ? this.FLAT_NAMES[normalized] : this.NOTE_NAMES[normalized];
  }

  // Get notes for a key and scale mode
  getScaleNotes(rootNote, modeKey = 'major') {
    let rootIndex = this.NOTE_NAMES.indexOf(rootNote);
    if (rootIndex === -1) rootIndex = this.FLAT_NAMES.indexOf(rootNote);
    if (rootIndex === -1) rootIndex = 0;

    let mode = this.MODES[modeKey] || this.MODES.major;
    let preferFlat = ['F', 'Bb', 'Eb', 'Ab', 'Db', 'Gb'].includes(rootNote) || rootNote.includes('b');

    return mode.intervals.map(interval => {
      let pitch = (rootIndex + interval) % 12;
      return this.pitchToName(pitch, preferFlat);
    });
  }

  // Build chord pitches and details based on root pitch, formula, and extensions
  buildChord(rootPitch, type = 'maj', octave = 4) {
    let intervals = [0, 4, 7]; // default major triad
    let suffix = '';
    let harmonicFunction = 'tonic'; // default

    switch (type) {
      case 'maj': intervals = [0, 4, 7]; suffix = ''; break;
      case 'min': intervals = [0, 3, 7]; suffix = 'm'; break;
      case 'dim': intervals = [0, 3, 6]; suffix = '°'; break;
      case 'aug': intervals = [0, 4, 8]; suffix = '+'; break;
      case 'maj7': intervals = [0, 4, 7, 11]; suffix = 'maj7'; break;
      case 'm7': intervals = [0, 3, 7, 10]; suffix = 'm7'; break;
      case 'dom7': intervals = [0, 4, 7, 10]; suffix = '7'; break;
      case 'm7b5': intervals = [0, 3, 6, 10]; suffix = 'm7b5'; break;
      case 'dim7': intervals = [0, 3, 6, 9]; suffix = 'dim7'; break;
      case 'maj9': intervals = [0, 4, 7, 11, 14]; suffix = 'maj9'; break;
      case 'm9': intervals = [0, 3, 7, 10, 14]; suffix = 'm9'; break;
      case 'dom9': intervals = [0, 4, 7, 10, 14]; suffix = '9'; break;
      case '7b9': intervals = [0, 4, 7, 10, 13]; suffix = '7b9'; break;
      case '13': intervals = [0, 4, 7, 10, 14, 21]; suffix = '13'; break;
      case 'sus4': intervals = [0, 5, 7]; suffix = 'sus4'; break;
    }

    let rootMidi = 12 * (octave + 1) + (rootPitch % 12);
    let midiNotes = intervals.map(inv => rootMidi + inv);
    let noteNames = midiNotes.map(m => this.pitchToName(m % 12, rootPitch % 12 === 1 || rootPitch % 12 === 3 || rootPitch % 12 === 8 || rootPitch % 12 === 10));

    return {
      rootPitch,
      rootName: this.pitchToName(rootPitch),
      type,
      fullName: this.pitchToName(rootPitch) + suffix,
      midiNotes,
      noteNames,
      intervals
    };
  }

  // Identify harmonic function for display tag
  getHarmonicFunction(roman, isJazz = false) {
    if (!roman) return { label: 'Tónica', class: 'func-tonic' };
    let clean = roman.replace(/[^a-zA-Z]/g, '');
    let lower = clean.toLowerCase();

    if (roman.includes('subV') || roman.includes('bII')) {
      return { label: 'Sust. Tritono', class: 'func-tritone' };
    }
    if (roman.includes('/') || roman.includes('V7/')) {
      return { label: 'Dominante Secundario', class: 'func-dominant' };
    }
    if (lower === 'i' || lower === 'vi' || lower === 'iii') {
      return { label: 'Tónica', class: 'func-tonic' };
    }
    if (lower === 'iv' || lower === 'ii') {
      return { label: 'Subdominante', class: 'func-subdominant' };
    }
    if (lower === 'v' || lower === 'vii') {
      return { label: 'Dominante', class: 'func-dominant' };
    }
    return { label: 'Acorde de Paso', class: 'func-passing' };
  }

  // --- ALGORITHMIC GENERATORS BASED ON CONCEPT.TXT ---

  // Module 1: Progresiones Básicas / Pop Acústico
  generateBasicProgression(rootNote, modeKey = 'major') {
    const scaleNotes = this.getScaleNotes(rootNote, modeKey);
    const rootPitch = this.NOTE_NAMES.indexOf(scaleNotes[0]) !== -1 ? this.NOTE_NAMES.indexOf(scaleNotes[0]) : this.FLAT_NAMES.indexOf(scaleNotes[0]);

    // Diatonic templates for Pop/Basic
    const templates = [
      [{ deg: 0, type: 'maj', roman: 'I' }, { deg: 3, type: 'maj', roman: 'IV' }, { deg: 4, type: 'maj', roman: 'V' }, { deg: 0, type: 'maj', roman: 'I' }],
      [{ deg: 0, type: 'maj', roman: 'I' }, { deg: 5, type: 'min', roman: 'vi' }, { deg: 3, type: 'maj', roman: 'IV' }, { deg: 4, type: 'maj', roman: 'V' }],
      [{ deg: 0, type: 'maj', roman: 'I' }, { deg: 4, type: 'maj', roman: 'V' }, { deg: 5, type: 'min', roman: 'vi' }, { deg: 3, type: 'maj', roman: 'IV' }],
      [{ deg: 1, type: 'min', roman: 'ii' }, { deg: 4, type: 'maj', roman: 'V' }, { deg: 0, type: 'maj', roman: 'I' }, { deg: 5, type: 'min', roman: 'vi' }]
    ];

    let chosenTemplate = templates[Math.floor(Math.random() * templates.length)];
    let scaleIntervals = this.MODES[modeKey].intervals;

    return chosenTemplate.map(item => {
      let chordPitch = (rootPitch + scaleIntervals[item.deg]) % 12;
      let chord = this.buildChord(chordPitch, modeKey === 'minor' && item.deg === 0 ? 'min' : item.type);
      chord.roman = item.roman;
      chord.functionInfo = this.getHarmonicFunction(item.roman);
      return chord;
    });
  }

  // Module 2: Progresiones Complejas / Clásicas (Backward cadential resolution)
  generateClassicalProgression(rootNote, modeKey = 'major') {
    const scaleIntervals = this.MODES[modeKey].intervals;
    const rootPitch = this.NOTE_NAMES.indexOf(rootNote) !== -1 ? this.NOTE_NAMES.indexOf(rootNote) : this.FLAT_NAMES.indexOf(rootNote);

    // Goal: Cadence resolution towards Tonic (I)
    // Works backward: Final (I) <- Dominant (V7/vii°) <- Pre-dominant (ii/IV) <- Tonic/Passing (I/vi/iii)
    const cadenceChords = [
      { deg: 0, type: modeKey.includes('minor') ? 'min' : 'maj', roman: modeKey.includes('minor') ? 'i' : 'I' }, // Target
      { deg: 4, type: 'dom7', roman: 'V7' }, // Cadential Dominant
      { deg: 1, type: modeKey.includes('minor') ? 'm7b5' : 'm7', roman: modeKey.includes('minor') ? 'iiø7' : 'ii7' }, // Pre-dominant
      { deg: 5, type: modeKey.includes('minor') ? 'maj' : 'min', roman: modeKey.includes('minor') ? 'VI' : 'vi' }, // Preparation
      { deg: 0, type: modeKey.includes('minor') ? 'min' : 'maj', roman: modeKey.includes('minor') ? 'i' : 'I' } // Initial Tonic
    ];

    // Reorder as progression sequence
    let sequence = [cadenceChords[4], cadenceChords[3], cadenceChords[2], cadenceChords[1], cadenceChords[0]];

    return sequence.map(item => {
      let pitch = (rootPitch + scaleIntervals[item.deg]) % 12;
      let chord = this.buildChord(pitch, item.type);
      chord.roman = item.roman;
      chord.functionInfo = this.getHarmonicFunction(item.roman);
      return chord;
    });
  }

  // Module 3: Progresiones de Jazz (Substitutions & Extended Chords - 8 Chords)
  generateJazzProgression(rootNote, modeKey = 'major') {
    const scaleIntervals = this.MODES[modeKey].intervals;
    const rootPitch = this.NOTE_NAMES.indexOf(rootNote) !== -1 ? this.NOTE_NAMES.indexOf(rootNote) : this.FLAT_NAMES.indexOf(rootNote);

    let useTritoneSub1 = Math.random() > 0.4;
    let useTritoneSub2 = Math.random() > 0.4;

    let progression = [
      // First 4 chords: Turnaround part 1 (ii9 - V13/subV7 - Imaj9 - vi7)
      { pitch: (rootPitch + scaleIntervals[1]) % 12, type: 'm9', roman: 'ii9' },
      useTritoneSub1 
        ? { pitch: (rootPitch + 1) % 12, type: '7b9', roman: 'subV7/I' }
        : { pitch: (rootPitch + scaleIntervals[4]) % 12, type: '13', roman: 'V13' },
      { pitch: (rootPitch + scaleIntervals[0]) % 12, type: 'maj9', roman: 'Imaj9' },
      { pitch: (rootPitch + scaleIntervals[5]) % 12, type: 'm7', roman: 'vi7' },

      // Second 4 chords: Turnaround part 2 (iii7 - V7/ii - ii7 - subV7/V7)
      { pitch: (rootPitch + scaleIntervals[2]) % 12, type: 'm7', roman: 'iii7' },
      { pitch: (rootPitch + (scaleIntervals[5] + 1) % 12) % 12, type: '7b9', roman: 'V7/ii' },
      { pitch: (rootPitch + scaleIntervals[1]) % 12, type: 'm7', roman: 'ii7' },
      useTritoneSub2 
        ? { pitch: (rootPitch + 1) % 12, type: '7b9', roman: 'subV7/I' }
        : { pitch: (rootPitch + scaleIntervals[4]) % 12, type: 'dom7', roman: 'V7' }
    ];

    return progression.map(item => {
      let chord = this.buildChord(item.pitch, item.type);
      chord.roman = item.roman;
      chord.functionInfo = this.getHarmonicFunction(item.roman, true);
      return chord;
    });
  }

  // Module 4: Progresiones de Música Progresiva (Prog Rock - Dramatic Arcs A -> B)
  generateProgRockProgression(rootNote, modeKey = 'major') {
    const rootPitch = this.NOTE_NAMES.indexOf(rootNote) !== -1 ? this.NOTE_NAMES.indexOf(rootNote) : this.FLAT_NAMES.indexOf(rootNote);

    // Section A (Stable modal base) -> Section B (Dramatic chromatic mediant & tension)
    let sectionA = [
      { pitch: rootPitch, type: 'min', roman: 'i' },
      { pitch: (rootPitch + 3) % 12, type: 'maj', roman: 'bIII' }, // Chromatic Mediant
      { pitch: (rootPitch + 5) % 12, type: 'sus4', roman: 'iv sus4' }
    ];

    let sectionB = [
      { pitch: (rootPitch + 8) % 12, type: 'maj', roman: 'bVI' },
      { pitch: (rootPitch + 6) % 12, type: 'dim7', roman: '#iv°7' }, // Asymmetric tension
      { pitch: (rootPitch + 7) % 12, type: 'dom7', roman: 'V7' }
    ];

    let fullSequence = [...sectionA, ...sectionB];

    return fullSequence.map(item => {
      let chord = this.buildChord(item.pitch, item.type);
      chord.roman = item.roman;
      chord.functionInfo = this.getHarmonicFunction(item.roman);
      return chord;
    });
  }

  // Module 5: Estructura de Canción Completa (Verse - PreChorus - Chorus - Bridge - 16 Chords)
  generateFullSongProgression(rootNote, modeKey = 'major') {
    const scaleIntervals = this.MODES[modeKey].intervals;
    const rootPitch = this.NOTE_NAMES.indexOf(rootNote) !== -1 ? this.NOTE_NAMES.indexOf(rootNote) : this.FLAT_NAMES.indexOf(rootNote);

    // 1. Verso (Verse): I - vi - IV - V (4 chords)
    let verse = [
      { pitch: (rootPitch + scaleIntervals[0]) % 12, type: 'maj', roman: 'I (Verso)' },
      { pitch: (rootPitch + scaleIntervals[5]) % 12, type: 'min', roman: 'vi (Verso)' },
      { pitch: (rootPitch + scaleIntervals[3]) % 12, type: 'maj', roman: 'IV (Verso)' },
      { pitch: (rootPitch + scaleIntervals[4]) % 12, type: 'maj', roman: 'V (Verso)' }
    ];

    // 2. Pre-Estribillo (Pre-Chorus): ii - IV - vi - V7 (4 chords)
    let preChorus = [
      { pitch: (rootPitch + scaleIntervals[1]) % 12, type: 'min', roman: 'ii (Pre-Estribillo)' },
      { pitch: (rootPitch + scaleIntervals[3]) % 12, type: 'maj', roman: 'IV (Pre-Estribillo)' },
      { pitch: (rootPitch + scaleIntervals[5]) % 12, type: 'min', roman: 'vi (Pre-Estribillo)' },
      { pitch: (rootPitch + scaleIntervals[4]) % 12, type: 'dom7', roman: 'V7 (Pre-Estribillo)' }
    ];

    // 3. Estribillo (Chorus): I - V - vi - IV (4 chords)
    let chorus = [
      { pitch: (rootPitch + scaleIntervals[0]) % 12, type: 'maj', roman: 'I (Estribillo)' },
      { pitch: (rootPitch + scaleIntervals[4]) % 12, type: 'maj', roman: 'V (Estribillo)' },
      { pitch: (rootPitch + scaleIntervals[5]) % 12, type: 'min', roman: 'vi (Estribillo)' },
      { pitch: (rootPitch + scaleIntervals[3]) % 12, type: 'maj', roman: 'IV (Estribillo)' }
    ];

    // 4. Puente (Bridge): IV - V7/vi - vi - bVII (4 chords)
    let bridge = [
      { pitch: (rootPitch + scaleIntervals[3]) % 12, type: 'maj', roman: 'IV (Puente)' },
      { pitch: (rootPitch + 4) % 12, type: 'dom7', roman: 'V7/vi (Puente)' },
      { pitch: (rootPitch + scaleIntervals[5]) % 12, type: 'min', roman: 'vi (Puente)' },
      { pitch: (rootPitch + 10) % 12, type: 'maj', roman: 'bVII (Puente)' }
    ];

    let fullSong = [...verse, ...preChorus, ...chorus, ...bridge];

    return fullSong.map(item => {
      let chord = this.buildChord(item.pitch, item.type);
      chord.roman = item.roman;
      chord.functionInfo = this.getHarmonicFunction(item.roman);
      return chord;
    });
  }

  // Module 6: Blues / R&B (12-bar blues feel, dominant 7ths, turnarounds)
  generateBluesProgression(rootNote, modeKey = 'major') {
    const rootPitch = this.NOTE_NAMES.indexOf(rootNote) !== -1 ? this.NOTE_NAMES.indexOf(rootNote) : this.FLAT_NAMES.indexOf(rootNote);

    const templates = [
      // Classic 12-bar feel condensed to 8 chords
      [
        { pitch: rootPitch, type: 'dom7', roman: 'I7' },
        { pitch: rootPitch, type: 'dom7', roman: 'I7' },
        { pitch: (rootPitch + 5) % 12, type: 'dom7', roman: 'IV7' },
        { pitch: rootPitch, type: 'dom7', roman: 'I7' },
        { pitch: (rootPitch + 7) % 12, type: 'dom7', roman: 'V7' },
        { pitch: (rootPitch + 5) % 12, type: 'dom7', roman: 'IV7' },
        { pitch: rootPitch, type: 'dom7', roman: 'I7' },
        { pitch: (rootPitch + 7) % 12, type: 'dom7', roman: 'V7 (Turnaround)' }
      ],
      // Jazz-blues variation with ii-V turnaround
      [
        { pitch: rootPitch, type: 'dom7', roman: 'I7' },
        { pitch: (rootPitch + 5) % 12, type: 'dom9', roman: 'IV9' },
        { pitch: rootPitch, type: 'dom7', roman: 'I7' },
        { pitch: rootPitch, type: 'dom7', roman: 'I7' },
        { pitch: (rootPitch + 5) % 12, type: 'dom7', roman: 'IV7' },
        { pitch: (rootPitch + 5) % 12, type: 'dom7', roman: 'IV7' },
        { pitch: (rootPitch + 2) % 12, type: 'm7', roman: 'ii7' },
        { pitch: (rootPitch + 7) % 12, type: 'dom7', roman: 'V7' }
      ]
    ];

    let chosen = templates[Math.floor(Math.random() * templates.length)];

    return chosen.map(item => {
      let chord = this.buildChord(item.pitch, item.type);
      chord.roman = item.roman;
      chord.functionInfo = this.getHarmonicFunction(item.roman);
      return chord;
    });
  }

  // Module 7: Bossa Nova / Latin Jazz (Smooth Brazilian harmony)
  generateBossaNovaProgression(rootNote, modeKey = 'major') {
    const scaleIntervals = this.MODES[modeKey].intervals;
    const rootPitch = this.NOTE_NAMES.indexOf(rootNote) !== -1 ? this.NOTE_NAMES.indexOf(rootNote) : this.FLAT_NAMES.indexOf(rootNote);

    const templates = [
      // Classic Bossa movement (Girl From Ipanema feel)
      [
        { pitch: (rootPitch + scaleIntervals[0]) % 12, type: 'maj7', roman: 'Imaj7' },
        { pitch: (rootPitch + scaleIntervals[0]) % 12, type: 'maj7', roman: 'Imaj7' },
        { pitch: (rootPitch + scaleIntervals[1]) % 12, type: 'm9', roman: 'ii9' },
        { pitch: (rootPitch + 6) % 12, type: 'dom7', roman: 'bV7' },
        { pitch: (rootPitch + scaleIntervals[1]) % 12, type: 'm7', roman: 'ii7' },
        { pitch: (rootPitch + 1) % 12, type: 'dom7', roman: 'subV7' },
        { pitch: (rootPitch + scaleIntervals[0]) % 12, type: 'maj9', roman: 'Imaj9' },
        { pitch: (rootPitch + scaleIntervals[4]) % 12, type: 'dom7', roman: 'V7' }
      ],
      // Modal Bossa variation
      [
        { pitch: (rootPitch + scaleIntervals[0]) % 12, type: 'maj7', roman: 'Imaj7' },
        { pitch: (rootPitch + scaleIntervals[2]) % 12, type: 'm7', roman: 'iii7' },
        { pitch: (rootPitch + scaleIntervals[5]) % 12, type: 'm7', roman: 'vi7' },
        { pitch: (rootPitch + scaleIntervals[1]) % 12, type: 'm9', roman: 'ii9' },
        { pitch: (rootPitch + scaleIntervals[4]) % 12, type: '13', roman: 'V13' },
        { pitch: (rootPitch + scaleIntervals[0]) % 12, type: 'maj9', roman: 'Imaj9' },
        { pitch: (rootPitch + 8) % 12, type: 'dom7', roman: 'bVI7' },
        { pitch: (rootPitch + scaleIntervals[4]) % 12, type: 'dom7', roman: 'V7' }
      ]
    ];

    let chosen = templates[Math.floor(Math.random() * templates.length)];

    return chosen.map(item => {
      let chord = this.buildChord(item.pitch, item.type);
      chord.roman = item.roman;
      chord.functionInfo = this.getHarmonicFunction(item.roman, true);
      return chord;
    });
  }

  // Module 8: Flamenco / Música Española (Phrygian-based, Andalusian cadence)
  generateFlamencoProgression(rootNote, modeKey = 'phrygian') {
    const rootPitch = this.NOTE_NAMES.indexOf(rootNote) !== -1 ? this.NOTE_NAMES.indexOf(rootNote) : this.FLAT_NAMES.indexOf(rootNote);

    const templates = [
      // Andalusian cadence (iv - III - II - I in Phrygian)
      [
        { pitch: rootPitch, type: 'maj', roman: 'I (Frigio)' },
        { pitch: (rootPitch + 1) % 12, type: 'maj', roman: 'bII' },
        { pitch: (rootPitch + 3) % 12, type: 'min', roman: 'biii' },
        { pitch: (rootPitch + 5) % 12, type: 'min', roman: 'iv' },
        { pitch: (rootPitch + 3) % 12, type: 'maj', roman: 'bIII' },
        { pitch: (rootPitch + 1) % 12, type: 'maj', roman: 'bII' },
        { pitch: rootPitch, type: 'maj', roman: 'I' },
        { pitch: rootPitch, type: 'dom7', roman: 'I7 (Resolución)' }
      ],
      // Extended Flamenco with tension
      [
        { pitch: (rootPitch + 5) % 12, type: 'min', roman: 'iv' },
        { pitch: (rootPitch + 3) % 12, type: 'maj', roman: 'bIII' },
        { pitch: (rootPitch + 1) % 12, type: 'maj', roman: 'bII' },
        { pitch: rootPitch, type: 'maj', roman: 'I' },
        { pitch: (rootPitch + 8) % 12, type: 'min', roman: 'bvi' },
        { pitch: (rootPitch + 7) % 12, type: 'maj', roman: 'V' },
        { pitch: (rootPitch + 1) % 12, type: 'maj', roman: 'bII' },
        { pitch: rootPitch, type: 'maj', roman: 'I (Cadencia)' }
      ]
    ];

    let chosen = templates[Math.floor(Math.random() * templates.length)];

    return chosen.map(item => {
      let chord = this.buildChord(item.pitch, item.type);
      chord.roman = item.roman;
      chord.functionInfo = this.getHarmonicFunction(item.roman);
      return chord;
    });
  }

  // Module 9: Ambient / Cinematic (Suspended, modal, atmospheric)
  generateAmbientProgression(rootNote, modeKey = 'major') {
    const scaleIntervals = this.MODES[modeKey].intervals;
    const rootPitch = this.NOTE_NAMES.indexOf(rootNote) !== -1 ? this.NOTE_NAMES.indexOf(rootNote) : this.FLAT_NAMES.indexOf(rootNote);

    const templates = [
      // Ethereal modal movement
      [
        { pitch: (rootPitch + scaleIntervals[0]) % 12, type: 'maj7', roman: 'Imaj7' },
        { pitch: (rootPitch + scaleIntervals[2]) % 12, type: 'min', roman: 'iii' },
        { pitch: (rootPitch + 8) % 12, type: 'maj', roman: 'bVI' },
        { pitch: (rootPitch + scaleIntervals[3]) % 12, type: 'sus4', roman: 'IV sus4' },
        { pitch: (rootPitch + scaleIntervals[3]) % 12, type: 'maj', roman: 'IV' },
        { pitch: (rootPitch + scaleIntervals[0]) % 12, type: 'sus4', roman: 'I sus4' },
        { pitch: (rootPitch + scaleIntervals[0]) % 12, type: 'maj7', roman: 'Imaj7' },
        { pitch: (rootPitch + scaleIntervals[4]) % 12, type: 'sus4', roman: 'V sus4' }
      ],
      // Cinematic tension build
      [
        { pitch: (rootPitch + scaleIntervals[0]) % 12, type: 'sus4', roman: 'I sus4' },
        { pitch: (rootPitch + scaleIntervals[0]) % 12, type: 'maj', roman: 'I' },
        { pitch: (rootPitch + 3) % 12, type: 'maj', roman: 'bIII' },
        { pitch: (rootPitch + 8) % 12, type: 'maj7', roman: 'bVImaj7' },
        { pitch: (rootPitch + 10) % 12, type: 'maj', roman: 'bVII' },
        { pitch: (rootPitch + scaleIntervals[3]) % 12, type: 'maj7', roman: 'IVmaj7' },
        { pitch: (rootPitch + scaleIntervals[0]) % 12, type: 'maj', roman: 'I' },
        { pitch: (rootPitch + scaleIntervals[0]) % 12, type: 'sus4', roman: 'I sus4' }
      ]
    ];

    let chosen = templates[Math.floor(Math.random() * templates.length)];

    return chosen.map(item => {
      let chord = this.buildChord(item.pitch, item.type);
      chord.roman = item.roman;
      chord.functionInfo = this.getHarmonicFunction(item.roman);
      return chord;
    });
  }

  // Module 10: Neo-Soul / Gospel (Rich extended harmony, chromatic movement)
  generateNeoSoulProgression(rootNote, modeKey = 'major') {
    const scaleIntervals = this.MODES[modeKey].intervals;
    const rootPitch = this.NOTE_NAMES.indexOf(rootNote) !== -1 ? this.NOTE_NAMES.indexOf(rootNote) : this.FLAT_NAMES.indexOf(rootNote);

    const templates = [
      // Neo-Soul chromatic voice leading
      [
        { pitch: (rootPitch + scaleIntervals[0]) % 12, type: 'maj9', roman: 'Imaj9' },
        { pitch: (rootPitch + scaleIntervals[2]) % 12, type: 'm9', roman: 'iii9' },
        { pitch: (rootPitch + scaleIntervals[5]) % 12, type: 'm9', roman: 'vi9' },
        { pitch: (rootPitch + scaleIntervals[1]) % 12, type: 'm9', roman: 'ii9' },
        { pitch: (rootPitch + scaleIntervals[4]) % 12, type: '13', roman: 'V13' },
        { pitch: (rootPitch + 8) % 12, type: 'maj7', roman: 'bVImaj7' },
        { pitch: (rootPitch + scaleIntervals[3]) % 12, type: 'maj9', roman: 'IVmaj9' },
        { pitch: (rootPitch + scaleIntervals[0]) % 12, type: 'maj9', roman: 'Imaj9' }
      ],
      // Gospel turnaround with secondary dominants
      [
        { pitch: (rootPitch + scaleIntervals[0]) % 12, type: 'maj7', roman: 'Imaj7' },
        { pitch: (rootPitch + scaleIntervals[0] + 4) % 12, type: 'dom7', roman: 'V7/ii' },
        { pitch: (rootPitch + scaleIntervals[1]) % 12, type: 'm9', roman: 'ii9' },
        { pitch: (rootPitch + scaleIntervals[4]) % 12, type: '13', roman: 'V13' },
        { pitch: (rootPitch + scaleIntervals[0]) % 12, type: 'maj9', roman: 'Imaj9' },
        { pitch: (rootPitch + 8) % 12, type: 'dom7', roman: 'bVI7' },
        { pitch: (rootPitch + scaleIntervals[1]) % 12, type: 'm7', roman: 'ii7' },
        { pitch: (rootPitch + 1) % 12, type: '7b9', roman: 'subV7' }
      ]
    ];

    let chosen = templates[Math.floor(Math.random() * templates.length)];

    return chosen.map(item => {
      let chord = this.buildChord(item.pitch, item.type);
      chord.roman = item.roman;
      chord.functionInfo = this.getHarmonicFunction(item.roman, true);
      return chord;
    });
  }
}

// Export for module use or browser global
if (typeof window !== 'undefined') {
  window.TheoryEngine = TheoryEngine;
}
