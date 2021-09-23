// Import document classes.
import { QuestWorldsActor } from "./documents/actor.mjs";
import { QuestWorldsItem } from "./documents/item.mjs";
// Import sheet classes.
import { QuestWorldsActorCharacterSheet } from "./sheets/actor-character-sheet.mjs";
import { QuestWorldsActorNpcSheet } from "./sheets/actor-npc-sheet.mjs";
import { QuestWorldsItemSheet } from "./sheets/item-sheet.mjs";
// Import helper/utility classes and constants.
import { preloadHandlebarsTemplates } from "./helpers/templates.mjs";
import { QUESTWORLDS } from "./helpers/config.mjs";
// Import system settings
import { registerSystemSettings } from "./helpers/settings.mjs";
import { setRuneCSSRules } from "./documents/rune-settings-menu.mjs";

/* -------------------------------------------- */
/*  Init Hook                                   */
/* -------------------------------------------- */

Hooks.once('init', async function() {

  // Add utility classes to the global game object so that they're more easily
  // accessible in global contexts.
  game.questworlds = {
    QuestWorldsActor,
    QuestWorldsItem,
    rollItemMacro
  };

  // register system settings
  registerSystemSettings();

  // Add custom constants for configuration.
  CONFIG.QUESTWORLDS = QUESTWORLDS;

  // Hook debugging
  CONFIG.debug.hooks = false;

  /**
   * Set an initiative formula for the system
   * @type {String}
   */
  CONFIG.Combat.initiative = {
    formula: "1d20",
    decimals: 2
  };

  // Define custom Document classes
  CONFIG.Actor.documentClass = QuestWorldsActor;
  CONFIG.Item.documentClass = QuestWorldsItem;

  // Register sheet application classes
  Actors.unregisterSheet("core", ActorSheet);
  Actors.registerSheet("questworlds", QuestWorldsActorCharacterSheet, {
    types: ["character"],
    makeDefault: true,
    label: "QUESTWORLDS.BasicCharacterSheet"
  });
  Actors.registerSheet("questworlds", QuestWorldsActorNpcSheet, {
    types: ["npc"],
    makeDefault: true,
    label: "QUESTWORLDS.BasicNpcSheet"
  });

  Items.unregisterSheet("core", ItemSheet);
  Items.registerSheet("questworlds", QuestWorldsItemSheet, { makeDefault: true });

  // initialize dynamic stylesheet for runes, conditional on useRunes
  if (game.settings.get("questworlds","useRunes")) {
    const runeFontSettings = game.settings.get("questworlds","runeFontSettings");
    setRuneCSSRules(runeFontSettings.cssRules);
  }


  // Preload Handlebars templates.
  return preloadHandlebarsTemplates();
});

/* -------------------------------------------- */
/*  Handlebars Helpers                          */
/* -------------------------------------------- */

// If you need to add Handlebars helpers, here are a few useful examples:
Handlebars.registerHelper('concat', function() {
  var outStr = '';
  for (var arg in arguments) {
    if (typeof arguments[arg] != 'object') {
      outStr += arguments[arg];
    }
  }
  return outStr;
});

Handlebars.registerHelper('toLowerCase', function(str) {
  return str.toLowerCase();
});

Handlebars.registerHelper('fullRating', function(context) {
  let outStr = '';
  let mastery_symbol = 'M';

  const rating = context.rating;
  const masteries = context.masteries;
  const abilityType = context.itemType || context.type;
  
  const useRunes = game.settings.get("questworlds","useRunes");

  if (useRunes) {
    mastery_symbol = '<span class="runes">W</span>';
  }

  const minusChar = "\u2212"; // unicode minus symbol (wider than hyphen to match '+' width)

  // if either portion is negative, put the negative on the front
  if (rating < 0 || masteries < 0) {
    outStr += minusChar;
  }
  // output basic rating part if it's non-zero
  if (Math.abs(rating) > 0) {
    // if it's positive and a benefit/consequence or breakout, prefix '+' first
    if (rating > 0 && (abilityType == 'benefit' || abilityType == 'breakout')) {
      outStr += "+";
    }
    // positive rating
    outStr += Math.abs(rating);
  }
  // when rating is zero and there are positive Ms, add a + for "+M"
  if (rating == 0 && masteries > 0) {
    outStr += "+";
  }

  // Master symbol with no number if 1, with number if > 1
  if (Math.abs(masteries) > 0) {
    outStr += mastery_symbol;
  }
  if (Math.abs(masteries) > 1) {
    outStr += Math.abs(masteries);
  }

  return new Handlebars.SafeString(outStr);
});

Handlebars.registerHelper('rune', function(token) {
  let useRunes = game.settings.get('questworlds','useRunes');

  // empty field, or not using runes anyway, don't render
  if (!useRunes || !token) {
    return '';
  }
  else {
    let runeFontSettings = game.settings.get('questworlds','runeFontSettings');
    let spanClass = runeFontSettings.runes[token]?.render.class;
    let spanTitle = game.i18n.localize(runeFontSettings.runes[token]?.name);
    let spanText = runeFontSettings.runes[token]?.render.text;

    if (!spanText) return '';   // token not in the list of known rune tokens

    return new Handlebars.SafeString(`<span class="${spanClass}" title="${spanTitle}">${spanText}</span>`);
  }
});

Handlebars.registerHelper('whichItemPartial', function (itemType, variantType) {
  let template = "systems/questworlds/templates/actor/parts/actor-abilities-" + variantType + ".html";
  return template;
});

Handlebars.registerHelper('whichEmbedPartial', function (embedType) {
  let template = "systems/questworlds/templates/embeds/embed-" + embedType + ".html";
  return template;
});

Handlebars.registerHelper('iseq', function (value1,value2) {
  return value1 == value2;
});

Handlebars.registerHelper('isgt', function (value1,value2) {
  return value1 > value2;
});

/* -------------------------------------------- */
/*  Ready Hook                                  */
/* -------------------------------------------- */

Hooks.once("ready", async function() {
  // Wait to register hotbar drop hook on ready so that modules could register earlier if they want to
  Hooks.on("hotbarDrop", (bar, data, slot) => createItemMacro(data, slot));
});

/* -------------------------------------------- */
/*  Hotbar Macros                               */
/* -------------------------------------------- */

/**
 * Create a Macro from an Item drop.
 * Get an existing item macro if one exists, otherwise create a new one.
 * @param {Object} data     The dropped data
 * @param {number} slot     The hotbar slot to use
 * @returns {Promise}
 */
async function createItemMacro(data, slot) {
  if (data.type !== "Item") return;
  if (!("data" in data)) return ui.notifications.warn("You can only create macro buttons for owned Items");
  const item = data.data;

  // Create the macro command
  const command = `game.questworlds.rollItemMacro("${item.name}");`;
  let macro = game.macros.entities.find(m => (m.name === item.name) && (m.command === command));
  if (!macro) {
    macro = await Macro.create({
      name: item.name,
      type: "script",
      img: item.img,
      command: command,
      flags: { "questworlds.itemMacro": true }
    });
  }
  game.user.assignHotbarMacro(macro, slot);
  return false;
}

/**
 * Create a Macro from an Item drop.
 * Get an existing item macro if one exists, otherwise create a new one.
 * @param {string} itemName
 * @return {Promise}
 */
function rollItemMacro(itemName) {
  const speaker = ChatMessage.getSpeaker();
  let actor;
  if (speaker.token) actor = game.actors.tokens[speaker.token];
  if (!actor) actor = game.actors.get(speaker.actor);
  const item = actor ? actor.items.find(i => i.name === itemName) : null;
  if (!item) return ui.notifications.warn(`Your controlled Actor does not have an item named ${itemName}`);

  // Trigger the item roll
  return item.roll();
}

/* -------------------------------------------- */
/*  TinyMCE Customizations                      */
/* -------------------------------------------- */
Hooks.on("ready", async () => {

  // Make TinyMCE allow saving at all times (allows closing unchanged editors)
  CONFIG.TinyMCE.save_enablewhendirty = false;

  // Make TinyMCE display the new formatting live
  if ( game.settings.get("questworlds","useRunes") ) {
    CONFIG.TinyMCE.content_css.push("systems/questworlds/css/tinymce-customizations.css");
  }
});
