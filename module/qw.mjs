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
import { registerHandlebarsHelpers } from "./helpers/handlebars-helpers.mjs";
// Import system settings
import { registerSystemSettings } from "./helpers/settings.mjs";
import { setRuneCSSRules } from "./documents/rune-settings-menu.mjs";
import { ChatContest } from "./documents/chat-contest.mjs";
import { StoryPoints } from "./helpers/story-points.mjs";


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
  Items.registerSheet("questworlds", QuestWorldsItemSheet, {
    makeDefault: true,
    label: "QUESTWORLDS.CoreItemSheet"
  });

  // initialize dynamic stylesheet for runes, conditional on useRunes
  if (game.settings.get("questworlds","useRunes")) {
    const runeFontSettings = game.settings.get("questworlds","runeFontSettings");
    setRuneCSSRules(runeFontSettings.cssRules);
  }

  // register Handlebars helpers
  registerHandlebarsHelpers();

  // Preload Handlebars templates.
  return preloadHandlebarsTemplates();
});

/* -------------------------------------------- */
/*  Socketlib ready hook                        */
/* -------------------------------------------- */

Hooks.once("socketlib.ready", () => {
  const socket = socketlib.registerSystem('questworlds');
  QUESTWORLDS.socket = socket;
  const socketFunctions = [
    {
      name: 'updateRuneCSS',
      call: function() {
        const runeFontSettings = game.settings.get("questworlds","runeFontSettings");
        setRuneCSSRules(runeFontSettings.cssRules);
        console.log('CSS Rules for Runes:',runeFontSettings.cssRules);
      }
    },
    {
      name: 'reducePool',
      call: StoryPoints.reducePool
    }
  ]
  for (const fn of socketFunctions) socket.register(fn.name,fn.call);
});

/* -------------------------------------------- */
/*  Ready Hook                                  */
/* -------------------------------------------- */

Hooks.once("ready", async function() {
  // Warn that socketlib is required
  if(!game.modules.get('socketlib')?.active) { 
    if (game.user.isGM) {
      // const error_message = "QuestWorlds depends on the socketlib module. Please activate socketlib in <i class=\"fas fa-cogs\"></i> Game Settings \u2192 <i class=\"fas fa-cube\"></i> Manage Modules.";
      const buttonLabels = {
        settings: game.i18n.localize('SETTINGS.SettingsHeader'),
        modules: game.i18n.localize('SETTINGS.ManageModules')
      }
      const error_message = game.i18n.format('QUESTWORLDS.socketlibError',buttonLabels);
      ui.notifications.error(error_message);
    }
  } else {
    // Register ui.players.render with socketlib if it exists, and when it's ready
    CONFIG.QUESTWORLDS.socket.register('refreshPlayerList',() => { ui.players.render() });
  }


  // Wait to register hotbar drop hook on ready so that modules could register earlier if they want to
  Hooks.on("hotbarDrop", (bar, data, slot) => createItemMacro(data, slot));

  // Make TinyMCE allow saving at all times (allows closing unchanged editors)
  CONFIG.TinyMCE.save_enablewhendirty = false;

  // Make TinyMCE display the new formatting live
  if ( game.settings.get("questworlds","useRunes") ) {
    CONFIG.TinyMCE.content_css.push("systems/questworlds/css/tinymce-customizations.css");
  }
  
});

/* -------------------------------------------- */
/*  Chat cards hooks                            */
/* -------------------------------------------- */

Hooks.on('renderChatLog', (app, html, data) => ChatContest.HookListeners.renderChatLog(app, html, data));
Hooks.on('renderChatMessage', (app, html, data) => ChatContest.HookListeners.renderChatMessage(app, html, data));
Hooks.on('updateChatMessage', (chatMessage, chatData, diff, speaker) => ChatContest.HookListeners.updateChatMessage(chatMessage, chatData, diff, speaker));

/* -------------------------------------------- */
/*  Story Points UI hooks                       */
/* -------------------------------------------- */

Hooks.on('renderPlayerList', async (list,html,options) => StoryPoints.Handlers.onRenderPlayerList(list,html,options));
Hooks.on('getChatLogEntryContext', (html, options) => StoryPoints.Handlers.onChatEntryContext(html,options));

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
