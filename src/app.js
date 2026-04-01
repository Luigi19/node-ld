async init() {
  await this.checkToypad();
  await this.loadCharacters();
  this.setupEventListeners();
  this.setupToypadListeners();
  this.setupSearchListener();
  this.setupGamepadPolling();  // ADD THIS LINE
  this.renderCharacterList();
}

// ADD THIS NEW METHOD
setupGamepadPolling() {
  let previousBothTriggersPressed = false;

  setInterval(() => {
    if (!navigator.getGamepads) return;

    const gamepads = navigator.getGamepads();
    if (gamepads.length === 0) return;

    const gamepad = gamepads[0];
    if (!gamepad) return;

    // Standard gamepad button indices
    const LT = gamepad.buttons[6]?.pressed || (gamepad.axes[2] > 0.5);
    const RT = gamepad.buttons[7]?.pressed || (gamepad.axes[5] > 0.5);

    const bothTriggersPressed = LT && RT;

    if (bothTriggersPressed && !previousBothTriggersPressed) {
      console.log('Both triggers pressed - toggling GUI');
      window.electronAPI.toggleGUI();
    }

    previousBothTriggersPressed = bothTriggersPressed;
  }, 100);
}
