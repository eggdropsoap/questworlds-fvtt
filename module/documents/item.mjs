const legalEmbedTypes = [
  'ability',
  'breakout',
  'keyword',
  'info'
];

/**
 * set up the embeds class
 * @param {String} type   // ability, breakout, keyword, info
 * @param {String} name   // new ability's name
 */
class EmbeddedAbility {

  constructor(type, name, rating, masteries, rune) {
    this.id = "embed-" + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

    this.type = legalEmbedTypes.includes(type) ? type : 'info';
    this.name = name || "New " + this.type.charAt(0).toUpperCase() + this.type.slice(1);
    this.rating = rating || 0;
    this.masteries = masteries || 0;
    this.rune = rune || null;

    this.embeds = [];
  }

}


/**
 * Extend the basic Item with some very simple modifications.
 * @extends {Item}
 */
export class QuestWorldsItem extends Item {
  /**
   * Augment the basic Item data model with additional dynamic data.
   */
  prepareData() {
    // As with the actor class, items are documents that can have their data
    // preparation methods overridden (such as prepareBaseData()).
    super.prepareData();
  }

  /**
   * Prepare a data object which is passed to any Roll formulas which are created related to this Item
   * @private
   */
   getRollData() {
    // If present, return the actor's roll data.
    if ( !this.actor ) return null;
    const rollData = this.actor.getRollData();
    rollData.item = foundry.utils.deepClone(this.data.data);

    return rollData;
  }

  /**
   * Handle clickable rolls.
   * @param {Event} event   The originating click event
   * @private
   */
  async roll() {
    const item = this.data;

    // Initialize chat data.
    const speaker = ChatMessage.getSpeaker({ actor: this.actor });
    const rollMode = game.settings.get('core', 'rollMode');
    const label = `[${item.type}] ${item.name}`;

    // If there's no roll data, send a chat message.
    if (!this.data.data.formula) {
      ChatMessage.create({
        speaker: speaker,
        rollMode: rollMode,
        flavor: label,
        content: item.data.description ?? ''
      });
    }
    // Otherwise, create a roll and send a chat message from it.
    else {
      // Retrieve roll data.
      const rollData = this.getRollData();

      // Invoke the roll and submit it to chat.
      const roll = new Roll(rollData.item.formula, rollData).roll();
      roll.toMessage({
        speaker: speaker,
        rollMode: rollMode,
        flavor: label,
      });
      return roll;
    }
  }

  /**
   * Create a new embed
   * @param {MouseEvent} event    The originating left click event
   * @param {Object} item         The item object.
   */
  static async createEmbed(event, item) {
    
    const a = event.currentTarget;
    const parentId = a.dataset.parentId;
    const embeds = item.data.data.embeds;
    const newEmbedType = a.dataset.type;

    const newBreakout = new EmbeddedAbility(newEmbedType);
    // console.log(newBreakout);

    if (parentId) {
      // find the sub-ability to embed the new ability inside
      // console.log(`Looking for nested ability ${parentId}…`);
      const parent = this.getEmbedById(embeds,parentId);
      // if found (not null) push into nested list
      if (parent) parent.embeds.push(newBreakout);
    }
    else {
      // push new sub-ability directly into the item's top-level embeds array
      embeds.push(newBreakout);
    }

    console.log(embeds);

    // update the item data
    item.update({'data.embeds': embeds});    

  } // createEmbed()

  /**
   * Delete an embed
   * @param {MouseEvent} event    The originating left click event
   * @param {Object} item         The item object.
   */
  static async deleteEmbed(event, item) {

    const a = event.currentTarget;
    const li = $(a).parents("li.breakout");
    const breakout_id = a.dataset.breakoutId;
    const embeds = item.data.data.embeds;

    //find and remove the breakout by id from temporary data
    let prunedEmbeds = embeds.filter(entry => { return entry.id !== breakout_id });
 
    // console.log(prunedEmbeds);

    /**
     * animate the removal, then
     * update the item after animation ends (or fails)
     */
    li.slideUp(150).promise().always(
      () => item.update({'data.embeds': prunedEmbeds})
    );

  } // deleteEmbed()

  /**
   * Edit an embed
   * @param {MouseEvent} event    The originating left click event
   * @param {Object} item         The item object.
   */
   static async editEmbed(event, item) {

    const a = event.currentTarget;
    const breakout_id = a.dataset.breakoutId;
    const embeds = item.data.data.embeds;
    const breakoutData = embeds.filter(item => { return item.id == breakout_id })[0];
    
    const dialogContent = await renderTemplate("systems/questworlds/templates/dialog/breakout-edit.html", breakoutData);
    // TODO: dialogs per breakout type

    new Dialog({
      title: "Editing Breakout",
      content: dialogContent,
      buttons: {
        saveButton: {
          label: "Save",
          callback: (html) => updateBreakout(html)
          //icon: `<i class="fas fa-check"></i>`
        },
        cancelButton: {
          label: "Cancel",
          icon: `<i class="fas fa-times"></i>`
        },
      },
      default: "saveButton"
    }).render(true);

    function updateBreakout(html) {
      // get new info from the dialog
      const newRating = Number.parseInt(html.find("input#breakout-rating").val());
      const newName = html.find("input#breakout-name").val()

      // find the right breakout and get index in list
      const i = embeds.findIndex(entry => { return entry.id == breakout_id });
      const targetEmbed = embeds[i];

      targetEmbed.name = newName;
      targetEmbed.rating = newRating;

      //update the item data with copy contents
      item.update({'data.embeds': embeds});
      console.log(embeds);
    
    } // updateBreakout()
    
  } // editEmbed()

  /**
   * Find and return an embedded breakout by id from an Item.
   * Returns null if not found.
   * @param {Array} embeds    // the Item
   * @param {String} id       // the id to find
   */
  static getEmbedById(embeds, id) {
    // PLACEHOLDER: this only works for the top-level embeds
    // TODO: recurse into structure to find at arbitrary nesting levels
    const i = embeds.findIndex(entry => { return entry.id == id });
    if (i == -1) return null;
    return embeds[i];
  }

}
