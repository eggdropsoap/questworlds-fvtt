import {onManageActiveEffect, prepareActiveEffectCategories} from "../helpers/effects.mjs";
import { EmbedsEvents, ContextMenus } from "../helpers/event-handlers.mjs";
import { tokenMarkupToHTML } from "../helpers/rune-helpers.mjs";
import { doItemTween } from "../documents/item.mjs";
import { GalleryControls } from "../helpers/event-handlers.mjs";
import { ContentEditableHelper } from "../helpers/event-handlers.mjs";
import { XPControls } from "../helpers/event-handlers.mjs";
import { StoryPoints } from "../helpers/story-points.mjs";

/**
 * Extend the basic ActorSheet with some very simple modifications
 * @extends {ActorSheet}
 */
export class QuestWorldsActorCharacterSheet extends ActorSheet {

  /** @override */
  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      classes: ["questworlds", "sheet", "actor"],
      template: "systems/questworlds/templates/actor/actor-sheet.html",
      width: 750,
      height: 650,
      tabs: [{ navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "main" }]
    });
  }

  /** @override */
  get template() {
    return `systems/questworlds/templates/actor/actor-${this.actor.type}-sheet.html`;
  }

  /** @override */
  get height() {
    return 300;
  }

  /* -------------------------------------------- */

  /** @override */
  async getData(options) {
    // Retrieve the data structure from the base sheet. You can inspect or log
    // the context variable to see the structure, but some key properties for
    // sheets are the actor object, the data object, whether or not it's
    // editable, the items array, and the effects array.
    const context = super.getData(options);

    // Use a safe clone of the actor data for further operations.
    const actorData = context.actor.toObject(false);

    // Add the actor's data to context.system for easier access, as well as flags.
    context.system = actorData.system;
    context.flags = actorData.flags;

    // Add some game settings to the context
    context.settings = {
      "useRunes": game.settings.get("questworlds","useRunes"),
      "sidekickName": game.settings.get("questworlds","sidekickName"),
      "keywordBreakout": game.settings.get("questworlds","keywordBreakout"),
      "advanceXP": game.settings.get('questworlds','XPtoAdvance'),
      "usePool": StoryPoints.usePool(),
    };
    // add some data based on game settings, but more directly accessible
    context.storyPointsName = StoryPoints.name('plural');
    context.storyPointsPoolName = StoryPoints.name('pool');
    context.poolValue = game.settings.get('questworlds','sharedStoryPointsPool');
    
    // Prepare character data and items.
    if (actorData.type == 'character') {
      this._prepareItems(context);
      this._prepareCharacterData(context);
    }

    // Prepare NPC data and items.
    if (actorData.type == 'npc') {
      this._prepareItems(context);
    }

    // Add roll data for TinyMCE editors.
    context.rollData = context.actor.getRollData();

    // Prepare rune replacements on description, biography, notes
    this._prepareRunesInEditors(context.system,['biography', 'description', 'notes']);

    // Prepare active effects
    context.effects = prepareActiveEffectCategories(this.actor.effects);

    // Prepare enrichedSystemDescription
    context.enrichedSystemDescription = await TextEditor.enrichHTML(this.object.system.description, {async: true});

    // Prepare enrichedSystemBiography
    context.enrichedSystemBiography = await TextEditor.enrichHTML(this.object.system.biography, {async: true});

    // Prepare enrichedSystemNotes
    context.enrichedSystemNotes = await TextEditor.enrichHTML(this.object.system.notes, {async: true});

    return context;
  }

  /**
   * Organize and classify Items for Character sheets.
   *
   * @param {Object} actorData The actor to prepare.
   *
   * @return {undefined}
   */
  _prepareCharacterData(context) {
    /* we don't have ability scores in QW
    // Handle ability scores.
    for (let [k, v] of Object.entries(context.data.abilities)) {
      v.label = game.i18n.localize(CONFIG.QUESTWORLDS.abilities[k]) ?? k;
    }
    */
  }

  /**
   * Organize and classify Items for Character sheets.
   *
   * @param {Object} actorData The actor to prepare.
   *
   * @return {undefined}
   */
  _prepareItems(context) {
    // Initialize containers.
    const abilities = [];
    const flaws = [];
    const benefits = [];
    
    // Iterate through items, allocating to containers
    for (let i of context.items) {
      // Set up image
      i.img = i.img || DEFAULT_TOKEN;
      // Graft item.type into item.system for convenient access
      i.system.itemType = i.type;

      // Append to main abilities.
      if (i.type === 'keyword' || i.type === 'ability' || i.type === 'sidekick') {
        abilities.push(i);
      }
      // Append to flaws.
      else if (i.type === 'flaw') {
        flaws.push(i);
      }
      // Append to benefits and consequences.
      else if (i.type === 'benefit' || i.type === 'consequence') {
        benefits.push(i);
      }
    }

    // Assign and return
    context.abilities = abilities;
    context.flaws = flaws;
    context.benefits = benefits;
  }

  _prepareRunesInEditors(data,fields) {
    if (!game.settings.get('questworlds','useRunes')) return;

    for (let field of fields) {
      data[field] = tokenMarkupToHTML(data[field]);
    }
  }

  /* -------------------------------------------- */

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);

    // Render the item sheet for viewing/editing prior to the editable check.
    html.find('.item-edit').click(ev => {
      const li = $(ev.currentTarget).parents(".item");
      const item = this.actor.items.get(li.data("itemId"));
      item.sheet.render(true);
    });

    // Art gallery lightbox for limited-permission users
    html.find('.tab.art .gallery').on('click','a[data-action="view"]',GalleryControls.onClickView.bind(this));


    // -------------------------------------------------------------
    // Everything below here is only needed if the sheet is editable
    if (!this.isEditable) return;
    

    // Add Inventory Item
    html.find('.item-create').click(this._onItemCreate.bind(this));

    // Delete Inventory Item
    html.find('.item-delete').click(async (ev) => {
      Dialog.confirm({
          title: ev.currentTarget.title,
          content: "<p><strong>" + game.i18n.localize('AreYouSure') + "</strong></p>",
          yes: () => {
            const li = $(ev.currentTarget).parents(".item");
            const item = this.actor.items.get(li.data("itemId"));
            doItemTween(`#item-${item._id}`,'remove',() => {
              item.delete();
              li.slideUp(200, () => this.render(false));
            });      
          },
          no: () => {},
          defaultYes: false
        });
    });

    // Active Effect management
    html.find(".effect-control").click(ev => onManageActiveEffect(ev, this.actor));

    // Remove, or edit embedded ability
    html.find(".item-controls").on("click", ".breakout-control", EmbedsEvents.onClickEmbedControl.bind(this));
    // Remove, or edit embedded ability
    html.find(".breakout-controls").on("click", ".breakout-control", EmbedsEvents.onClickEmbedControl.bind(this));


    // Move item controls into context menu
    html.on("contextmenu",".item>.item-body",ContextMenus.ItemMenu.activate);
    html.on("contextmenu",".breakout>.breakout-body",ContextMenus.ItemMenu.activate);
    html.on('mouseenter','.menu.active',ContextMenus.ItemMenu.keepAlive);
    html.on('mouseleave click',".menu.active",ContextMenus.ItemMenu.deactivate);

    // Move item list header controls into button-click menu
    const controls = html.find('.items-header .item-controls');
    for (let control of controls) {
      if ($(control)[0]?.childElementCount > 1) {
        ContextMenus.ConvertToMenu($(control));
      }  
    }

    // Add XP
    if (game.user.isGM) {
      html.find('.xp-control[data-action="add"]')
        .on('click',XPControls.onClickAddXP.bind(this))
        .show();
    }

    // Manage story points
    html.on('click','.main .resources .storypoints',StoryPoints.Handlers.onClickStoryPoints);

    // Advances control
    html.on('click','.advances.history',XPControls.openAdvancesHistory.bind(this));
    html.on('click','.advances.available.new',XPControls.dismissNewAdvanceNotice.bind(this));
    html.on('click','.advances.available',XPControls.openAdvancesPanel.bind(this));

    // Art gallery controls
    html.find('.tab.art .gallery')
      .on('click','a[data-action="add"]',GalleryControls.onClickAdd.bind(this))
      .on('click','a[data-action="delete"]',GalleryControls.onClickDelete.bind(this))
      .on('click','div.fake-input',ContentEditableHelper.onClickFakeInput)
      .find('li.art img').each((i,img) => {
        img.setAttribute("draggable", true);
        img.addEventListener('dragstart', GalleryControls.onDrag.bind(this), false);
        img.addEventListener('dragover', GalleryControls.onDrag.bind(this), false);
        img.addEventListener('dragenter', GalleryControls.onDrag.bind(this), false);
        img.addEventListener('drop', GalleryControls.onDrag.bind(this), false);
      });


    // Rollable abilities.
    html.find('.rollable').click(this._onRoll.bind(this));

    // Drag events for macros.
    if (this.actor.isOwner) {
      let handler = ev => this._onDragStart(ev);
      html.find('li.item').each((i, li) => {
        if (li.classList.contains("items-header")) return;
        li.setAttribute("draggable", true);
        li.addEventListener("dragstart", handler, false);
      });
    }
  }

  /**
   * Handle creating a new Owned Item for the actor using initial data defined in the HTML dataset
   * @param {Event} event   The originating click event
   * @private
   */
  async _onItemCreate(event) {
    event.preventDefault();
    const header = event.currentTarget;
    // Get the type of item to create.
    const type = header.dataset.type;
    // Grab any data associated with this control.
    const data = duplicate(header.dataset);
    // Initialize a default name.
    const itemType = header.dataset?.variant == 'sidekick' ?
      game.settings.get('questworlds',"sidekickName") :
      header.dataset.variant ? header.dataset.variant : type;
    const name = game.i18n.localize(`QUESTWORLDS.New${itemType.capitalize()}`);
    // Prepare the item object.
    const itemData = {
      name: name,
      type: type,
      system: data
    };
    // Remove the type from the dataset since it's in the itemData.type prop.
    delete itemData.system["type"];

    // Finally, create the item!
    return Item.create(itemData, {parent: this.actor, renderSheet: true});
  }

  _updateObject(event, formData) {

    if (formData.newart) {
      const filepath = formData.newart;
      const nextIndex = Object.keys(this.object.system.gallery).length;
      formData[`system.gallery.${nextIndex}`] = {
        img: filepath,
        caption: "",
      };
    }

    super._updateObject(event,formData);
  }

  /**
   * Handle clickable rolls.
   * @param {Event} event   The originating click event
   * @private
   */
  _onRoll(event) {
    event.preventDefault();
    const element = event.currentTarget;
    const dataset = element.dataset;

    // Handle item rolls.
    if (dataset.rollType) {
      if (dataset.rollType == 'item') { // direct item rolls
        const itemId = element.closest('.item').dataset.itemId;
        const item = this.actor.items.get(itemId);
        if (item) return item.roll();
      }
      else {  // embedded abilities rolls
        const itemId = element.closest('.item').dataset.itemId;
        const item = this.actor.items.get(itemId);
        const embedId = element.closest('.breakout').dataset.breakoutId;
        const embedData = {
          id: embedId,
          rating: dataset.masteries,
          masteries: dataset.masteries,
        }
        if (dataset.rollType == 'breakout') {
          const keyword = element.closest('.keyword');
          const keywordDataset = $(keyword).find('.rollable').dataset;
          if (keywordDataset) {
            const keywordRating = keywordDataset.rollRating;
            const keywordMasteries = keywordDataset.rollMasteries;
          }
        }
        item.roll(embedId);
      }
    }

    // Handle rolls that supply the formula directly.
    if (dataset.roll) {
      let label = dataset.label ? `[ability] ${dataset.label}` : '';
      let roll = new Roll(dataset.roll, this.actor.getRollData()).roll();
      roll.toMessage({
        speaker: ChatMessage.getSpeaker({ actor: this.actor }),
        flavor: label,
        rollMode: game.settings.get('core', 'rollMode'),
      });
      return roll;
    }
  }

}