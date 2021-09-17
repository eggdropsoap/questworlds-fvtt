import { RuneFontsSettingsMenuClass } from "../documents/rune-settings-menu.mjs";

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



  /** ** ** ** ** ** ** ** ** ** ** ** **
   *   Rune fonts configuration menu    *
   ** ** ** ** ** ** ** ** ** ** ** ** **/

  game.settings.registerMenu("questworlds", "RuneFontSettingsMenu", {
    name: "Rune Fonts Settings",
    label: "Configure Rune Fonts",      // The text label used in the button
    hint: "Upload and configure rune fonts.",
    icon: "fas fa-font",               // A Font Awesome icon used in the submenu button
    type: RuneFontsSettingsMenuClass,   // A FormApplication subclass
    restricted: true,                   // Restrict this submenu to gamemaster only?
  });
  
  
  game.settings.register('questworlds', 'runeFontSettings', {
    scope: 'world',     // "world" = sync to db, "client" = local storage
    config: false,      // we will use the menu above to edit this setting
    type: Object,
    default: {},        // can be used to set up the default structure
  });


}