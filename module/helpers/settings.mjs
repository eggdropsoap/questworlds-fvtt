export const registerSystemSettings = function() {

  /**
   * Whether to enable suport for rune fonts
   */
   game.settings.register("questworlds", "useRuneFont", {
    name: "SETTINGS.useRuneFontN",
    hint: "SETTINGS.useRuneFontL",
    scope: "world",
    config: true,
    type: Boolean,
    default: false,
  });

  /**
   * What to call a "Sidekick" in the UI / sheets
   */
  game.settings.register("questworlds", "sidekickName", {
    name: "SETTINGS.sidekickNameN",
    hint: "SETTINGS.sidekickNameL",
    scope: "world",
    config: true,
    type: String,
    choices: {
      "Sidekick": "Sidekick",
      "Companion": "Companion"
    },
    default: "sidekick",
/*     onChange: value => { // A callback function which triggers when the setting is changed
      console.log(value);
    } */
  });

}