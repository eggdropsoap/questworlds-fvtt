/**
 * Define a set of template paths to pre-load
 * Pre-loaded templates are compiled and cached for fast access when rendering
 * @return {Promise}
 */
 export const preloadHandlebarsTemplates = async function() {
  return loadTemplates([

    // Actor partials.
    "systems/questworlds/templates/actor/parts/actor-abilities.html",
    "systems/questworlds/templates/actor/parts/actor-abilities-ability.html",
    "systems/questworlds/templates/actor/parts/actor-abilities-keyword.html",
    "systems/questworlds/templates/actor/parts/actor-abilities-sidekick.html",
    "systems/questworlds/templates/actor/parts/actor-abilities-magicgroup.html",
    "systems/questworlds/templates/actor/parts/actor-benefits.html",
    "systems/questworlds/templates/actor/parts/actor-flaws.html",
    //"systems/questworlds/templates/actor/parts/actor-effects.html",

    // Item partials
    "systems/questworlds/templates/item/parts/item-ability-settings.html",
    "systems/questworlds/templates/item/parts/item-rune-picker.html",
    "systems/questworlds/templates/item/parts/item-rating-inputs.html",

    // Shared embed partials
    "systems/questworlds/templates/embeds/embed.html",
    "systems/questworlds/templates/embeds/embed-ability.html",
    "systems/questworlds/templates/embeds/embed-breakout.html",
    "systems/questworlds/templates/embeds/embed-info.html",
    "systems/questworlds/templates/embeds/embed-keyword.html",
  ]);
};
