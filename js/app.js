/**
 * App.js - Application Main Entrypoint
 * Initializes engines, binds UI events, and orchestrates progression generation and playback.
 */

document.addEventListener('DOMContentLoaded', () => {
  const theory = new TheoryEngine();
  const audio = new AudioEngine();
  const ui = new UIController(theory, audio);

  // Helper to generate progression based on selected module
  function generateSelectedProgression() {
    const key = ui.keySelect.value || 'C';
    const mode = ui.modeSelect.value || 'major';
    const moduleType = ui.moduleSelect.value || '1';

    let progression = [];
    let moduleName = 'Módulo 1: Básicas';

    switch (moduleType) {
      case '1':
        progression = theory.generateBasicProgression(key, mode);
        moduleName = 'Módulo 1: Pop / Básicas';
        break;
      case '2':
        progression = theory.generateClassicalProgression(key, mode);
        moduleName = 'Módulo 2: Clásicas / Cadencias';
        break;
      case '3':
        progression = theory.generateJazzProgression(key, mode);
        moduleName = 'Módulo 3: Jazz / Sustituciones';
        break;
      case '4':
        progression = theory.generateProgRockProgression(key, mode);
        moduleName = 'Módulo 4: Prog Rock / Arcos';
        break;
      case '5':
        progression = theory.generateFullSongProgression(key, mode);
        moduleName = 'Módulo 5: Canción Completa (A-B-A-C-A)';
        break;
      case '6':
        progression = theory.generateBluesProgression(key, mode);
        moduleName = 'Módulo 6: Blues / R&B';
        break;
      case '7':
        progression = theory.generateBossaNovaProgression(key, mode);
        moduleName = 'Módulo 7: Bossa Nova / Latin Jazz';
        break;
      case '8':
        progression = theory.generateFlamencoProgression(key, mode);
        moduleName = 'Módulo 8: Flamenco / Español';
        break;
      case '9':
        progression = theory.generateAmbientProgression(key, mode);
        moduleName = 'Módulo 9: Ambient / Cinemático';
        break;
      case '10':
        progression = theory.generateNeoSoulProgression(key, mode);
        moduleName = 'Módulo 10: Neo-Soul / Gospel';
        break;
      default:
        progression = theory.generateBasicProgression(key, mode);
        break;
    }

    ui.renderProgression(progression, moduleName);
    return progression;
  }

  // Bind Generate Button
  if (ui.btnGenerate) {
    ui.btnGenerate.addEventListener('click', () => {
      const prog = generateSelectedProgression();
      // Auto play on generate with current speed mode
      audio.init();
      const speed = ui.slowMode ? 0.5 : 1.0;
      audio.playProgression(prog, speed);
      if (ui.btnPlayMaster) ui.btnPlayMaster.innerHTML = '⏸';
    });
  }

  // Bind Play/Pause Master Button
  if (ui.btnPlayMaster) {
    ui.btnPlayMaster.addEventListener('click', () => {
      audio.init();
      if (audio.isPlaying) {
        audio.stop();
        ui.btnPlayMaster.innerHTML = '▶';
      } else {
        if (!ui.currentProgression || ui.currentProgression.length === 0) {
          generateSelectedProgression();
        }
        const speed = ui.slowMode ? 0.5 : 1.0;
        audio.playProgression(ui.currentProgression, speed);
        ui.btnPlayMaster.innerHTML = '⏸';
      }
    });
  }

  // Bind Speed Toggle (ON/OFF for 50% speed)
  if (ui.speedToggle) {
    ui.speedToggle.addEventListener('change', () => {
      ui.slowMode = ui.speedToggle.checked;
      if (ui.speedToggleWrap) {
        ui.speedToggleWrap.classList.toggle('active', ui.slowMode);
      }
      if (ui.speedToggleStatus) {
        ui.speedToggleStatus.textContent = ui.slowMode ? 'ON' : 'OFF';
      }
    });
  }

  // Bind Stop Master Button
  if (ui.btnStopMaster) {
    ui.btnStopMaster.addEventListener('click', () => {
      audio.stop();
      if (ui.btnPlayMaster) ui.btnPlayMaster.innerHTML = '▶';
    });
  }

  // Bind CTA from Dashboard to jump to Generator and launch module
  if (ui.btnCtaDashboard) {
    ui.btnCtaDashboard.addEventListener('click', () => {
      ui.switchTab('tab-generator');
      generateSelectedProgression();
    });
  }

  // Bind Module Quick Cards on Dashboard
  document.querySelectorAll('.module-card').forEach(card => {
    card.addEventListener('click', () => {
      const mod = card.dataset.module;
      if (mod && ui.moduleSelect) {
        ui.moduleSelect.value = mod;
        ui.switchTab('tab-generator');
        generateSelectedProgression();
      }
    });
  });

  // Bind Control Inputs
  if (ui.bpmInput) {
    ui.bpmInput.addEventListener('input', (e) => {
      const bpm = parseInt(e.target.value, 10);
      audio.setBpm(bpm);
      if (ui.bpmVal) ui.bpmVal.textContent = `${bpm} BPM`;
    });
  }

  if (ui.presetSelect) {
    ui.presetSelect.addEventListener('change', (e) => {
      audio.setPreset(e.target.value);
    });
  }

  if (ui.styleSelect) {
    ui.styleSelect.addEventListener('change', (e) => {
      audio.setPlaybackStyle(e.target.value);
    });
  }

  if (ui.masterVol) {
    ui.masterVol.addEventListener('input', (e) => {
      audio.setVolume(parseFloat(e.target.value));
    });
  }

  // Navigation Tabs Event Listeners
  ui.tabBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      // If we are on the harmonix page, switch tabs programmatically instead of reloading
      if (window.location.pathname.includes('harmonix.html')) {
        e.preventDefault();
        const tabId = btn.dataset.tab;
        ui.switchTab(tabId);
        // Update URL query parameter
        history.pushState(null, '', `?tab=${tabId}`);
      }
    });
  });

  // Check if tab is requested in URL query parameter on page load
  const urlParams = new URLSearchParams(window.location.search);
  const requestedTab = urlParams.get('tab');
  if (requestedTab && ['tab-dashboard', 'tab-generator', 'tab-theory'].includes(requestedTab)) {
    ui.switchTab(requestedTab);
  } else {
    ui.switchTab('tab-dashboard');
  }

  // Initial Generation on page load
  generateSelectedProgression();
});
