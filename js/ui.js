/**
 * UI.js - User Interface Controller
 * Manages DOM updates, dynamic chord cards rendering, interactive piano keyboard,
 * tab navigation, and user input bindings.
 */

class UIController {
  constructor(theoryEngine, audioEngine) {
    this.theory = theoryEngine;
    this.audio = audioEngine;
    this.currentProgression = [];
    this.slowMode = false;

    this.initDOMReferences();
    this.renderPianoKeyboard();
    this.bindAudioCallbacks();
  }

  initDOMReferences() {
    // Navigation Tabs
    this.tabBtns = document.querySelectorAll('.nav-tab-btn');
    this.tabs = document.querySelectorAll('.page-tab');

    // Controls
    this.keySelect = document.getElementById('keySelect');
    this.modeSelect = document.getElementById('modeSelect');
    this.moduleSelect = document.getElementById('moduleSelect');
    this.bpmInput = document.getElementById('bpmInput');
    this.bpmVal = document.getElementById('bpmVal');
    this.presetSelect = document.getElementById('presetSelect');
    this.styleSelect = document.getElementById('styleSelect');
    this.masterVol = document.getElementById('masterVol');

    // Action Buttons
    this.btnGenerate = document.getElementById('btnGenerate');
    this.btnPlayMaster = document.getElementById('btnPlayMaster');
    this.speedToggle = document.getElementById('speedToggle');
    this.speedToggleWrap = document.getElementById('speedToggleWrap');
    this.speedToggleStatus = document.getElementById('speedToggleStatus');
    this.btnStopMaster = document.getElementById('btnStopMaster');
    this.btnCtaDashboard = document.getElementById('btnCtaDashboard');

    // Containers
    this.chordsContainer = document.getElementById('chordsContainer');
    this.pianoKeyboard = document.getElementById('pianoKeyboard');
    this.moduleBadge = document.getElementById('moduleBadge');
  }

  // Build a 4-octave Interactive Piano Keyboard (C2 to B5)
  renderPianoKeyboard() {
    if (!this.pianoKeyboard) return;
    this.pianoKeyboard.innerHTML = '';

    const startMidi = 36; // C2
    const numKeys = 48; // 4 octaves

    for (let i = 0; i < numKeys; i++) {
      const midi = startMidi + i;
      const pitchIndex = midi % 12;
      const isBlack = [1, 3, 6, 8, 10].includes(pitchIndex);
      const noteName = this.theory.pitchToName(pitchIndex);

      const keyDiv = document.createElement('div');
      keyDiv.className = isBlack ? 'key-black' : 'key-white';
      keyDiv.dataset.midi = midi;

      const label = document.createElement('span');
      label.className = 'key-label';
      label.textContent = noteName;
      keyDiv.appendChild(label);

      // A tap plays a note; dragging remains available for native scrolling.
      keyDiv.setAttribute('role', 'button');
      keyDiv.tabIndex = 0;
      keyDiv.setAttribute('aria-label', `${noteName}${Math.floor(midi / 12) - 1}`);
      keyDiv.addEventListener('click', () => this.audio.playSingleNote(midi, 0.8));
      keyDiv.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          keyDiv.click();
        }
      });

      this.pianoKeyboard.appendChild(keyDiv);
    }
  }

  // Connect Audio Engine visualizer callbacks
  bindAudioCallbacks() {
    this.audio.onNoteStart = (midi) => {
      const key = this.pianoKeyboard.querySelector(`[data-midi="${midi}"]`);
      if (key) key.classList.add('active');
    };

    this.audio.onNoteEnd = (midi) => {
      const key = this.pianoKeyboard.querySelector(`[data-midi="${midi}"]`);
      if (key) key.classList.remove('active');
    };

    this.audio.onChordStart = (index, chord) => {
      const cards = this.chordsContainer.querySelectorAll('.chord-card');
      cards.forEach((c, idx) => {
        if (idx === index) {
          c.classList.add('playing');
          // Keep playback from pulling the page away from the user’s controls.
        } else {
          c.classList.remove('playing');
        }
      });
    };

    this.audio.onChordEnd = (index) => {
      const card = this.chordsContainer.querySelectorAll('.chord-card')[index];
      if (card) card.classList.remove('playing');
    };

    this.audio.onPlaybackEnd = () => {
      if (this.btnPlayMaster) {
        this.btnPlayMaster.innerHTML = '▶';
        this.btnPlayMaster.setAttribute('aria-label', 'Reproducir progresión');
      }
      this.clearAllKeyboardHighlights();
    };
  }

  clearAllKeyboardHighlights() {
    const keys = this.pianoKeyboard.querySelectorAll('.key-white, .key-black');
    keys.forEach(k => k.classList.remove('active'));
    const cards = this.chordsContainer.querySelectorAll('.chord-card');
    cards.forEach(c => c.classList.remove('playing'));
  }

  // Render chord progression result cards
  renderProgression(progression, moduleName) {
    this.currentProgression = progression;
    this.chordsContainer.innerHTML = '';

    if (this.moduleBadge) {
      this.moduleBadge.textContent = moduleName || 'Progresión Generada';
    }

    progression.forEach((chord, idx) => {
      const card = document.createElement('div');
      card.className = 'chord-card';
      card.tabIndex = 0;
      card.setAttribute('role', 'button');
      card.setAttribute('aria-label', `Escuchar ${chord.fullName}`);
      card.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          card.click();
        }
      });

      const funcInfo = chord.functionInfo || { label: 'Armónico', class: 'func-tonic' };

      card.innerHTML = `
        <div class="chord-card-roman">${chord.roman || 'I'}</div>
        <div class="chord-card-name">${chord.fullName}</div>
        <div class="chord-card-function ${funcInfo.class}">${funcInfo.label}</div>
        <div class="chord-card-notes">${chord.noteNames.join(' - ')}</div>
      `;

      // Play individual chord on click
      card.addEventListener('click', () => {
        this.audio.playSingleChord(chord, 1.2);
        // Highlight active keys
        chord.midiNotes.forEach(m => {
          const key = this.pianoKeyboard.querySelector(`[data-midi="${m}"]`);
          if (key) {
            key.classList.add('active');
            setTimeout(() => key.classList.remove('active'), 1200);
          }
        });
      });

      this.chordsContainer.appendChild(card);
    });
  }

  // Tab switching
  switchTab(tabId) {
    this.audio.stop();
    window.scrollTo({ top: 0, behavior: 'instant' });
    this.tabBtns.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tab === tabId);
      if (btn.dataset.tab === tabId) btn.setAttribute('aria-current', 'page');
      else btn.removeAttribute('aria-current');
    });
    this.tabs.forEach(tab => {
      tab.classList.toggle('active', tab.id === tabId);
    });
  }
}

// Export for module use or browser global
if (typeof window !== 'undefined') {
  window.UIController = UIController;
}
