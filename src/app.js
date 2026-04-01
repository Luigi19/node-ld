setupGamepadPolling() {
  let previousLeftTrigger = false;
  let previousRightTrigger = false;

  setInterval(() => {
    if (!navigator.getGamepads) return;

    const gamepads = navigator.getGamepads();
    if (gamepads.length === 0) return;

    const gamepad = gamepads[0];
    if (!gamepad) return;

    // Xbox 360 Controller Button/Axis Mapping:
    // LT (Left Trigger) = axes[2] (range: -1 to 1, pressed > 0)
    // RT (Right Trigger) = axes[5] (range: -1 to 1, pressed > 0)
    // Some systems use buttons[6] and buttons[7]

    const LT_axes = gamepad.axes[2] !== undefined ? gamepad.axes[2] > 0.5 : false;
    const RT_axes = gamepad.axes[5] !== undefined ? gamepad.axes[5] > 0.5 : false;
    
    const LT_buttons = gamepad.buttons[6]?.pressed || false;
    const RT_buttons = gamepad.buttons[7]?.pressed || false;

    // Try both axes and buttons
    const LT = LT_axes || LT_buttons;
    const RT = RT_axes || RT_buttons;

    // Detect transition from not pressed to pressed
    if (LT && !previousLeftTrigger) {
      console.log('Left Trigger pressed');
    }
    if (RT && !previousRightTrigger) {
      console.log('Right Trigger pressed');
    }

    // Toggle GUI when BOTH triggers are pressed
    const bothTriggersPressed = LT && RT;
    
    if (bothTriggersPressed && !(previousLeftTrigger && previousRightTrigger)) {
      console.log('Both triggers pressed - toggling GUI');
      window.electronAPI.toggleGUI();
    }

    previousLeftTrigger = LT;
    previousRightTrigger = RT;
  }, 100);
}
