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

}