export const registerSystemSettings = function() {

  /**
   * Whether to enable suport for runes
   */
   game.settings.register("questworlds", "useRunes", {
    name: "SETTINGS.useRunesN",
    hint: "SETTINGS.useRunesL",
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
      "Sidekick": "QUESTWORLDS.Sidekick",
      "Companion": "QUESTWORLDS.Companion"
    },
    default: "sidekick",
/*     onChange: value => { // A callback function which triggers when the setting is changed
      console.log(value);
    } */
  });

  /**
   * Whether Keywords have breakouts or sub-abilities
   */
   game.settings.register("questworlds", "keywordBreakout", {
    name: "SETTINGS.keywordBreakoutN",
    hint: "SETTINGS.keywordBreakoutL",
    scope: "world",
    config: true,
    type: String,
    choices: {
      "breakout": "QUESTWORLDS.keywordUmbrellaOptionName",
      "ability": "QUESTWORLDS.keywordPackageOptionName"
    },
    default: "breakout",
/*     onChange: value => { // A callback function which triggers when the setting is changed
      console.log(value);
    } */
  });

}