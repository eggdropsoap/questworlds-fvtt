import { gsap, CSSPlugin, Power4, Back, Expo, Power1, Power2, Power3 } from "/scripts/greensock/esm/all.js";

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
    // one id schema for all embeds, since they can switch type later
    this.id = "embed-" + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

    this.type = legalEmbedTypes.includes(type) ? type : 'info';

    // STUB: name should be localized in the switch statement
    this.name = name || "New " + this.type.charAt(0).toUpperCase() + this.type.slice(1);

    switch(type) {
      case 'ability':
        // new abilities default to 13M0
        this.rating = rating || 13;
        break;
      case 'breakout':
        // new breakouts default to +1
        this.rating = rating || 1;
        break;
      case 'keyword':
        // new keywords default to 13
        this.rating = rating || 13;
        break;
      case 'info':
        // info doesn't need a rating
        this.rating = rating || 0;
        break;
      default:
        this.rating = rating || 0;  // should never happen since not in legalEmbedTypes
    }

    // nothing defaults to having a mastery
    this.masteries = masteries || 0;

    // nothing starts with a rune
    this.rune = rune || null;

    // initialize with its own empty embeds list
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
    
    if (parentId) {
      // find the sub-ability to embed the new ability inside
      const parent = this.getEmbedById(embeds,parentId);
      // if found (not null) push into nested list
      if (parent) parent.embeds.push(newBreakout);
    }
    else { // it's an Item, not an embed
      // push new sub-ability directly into the item's top-level embeds array
      embeds.push(newBreakout);
    }

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
    // const li = $(a).parents("li.breakout");
    const breakout_id = a.dataset.breakoutId;
    const ability = item.data.data;

    /** removeFromTree() is (c) Rodrigo Rodrigues, licensed CC BY-SA 4.0 at https://stackoverflow.com/a/55083533/480642 */
    function removeFromTree(node, targetId) {
      if (node.id == targetId) {
        node = undefined
      } else {
        node.embeds.forEach((child, id) => {
          if (!removeFromTree(child, targetId)) node.embeds.splice(id, 1)
        })
      }
      return node
    }
    let prunedAbility = removeFromTree(ability, breakout_id);
    if (!prunedAbility) { console.error(`prunedAbility is ${typeof(prunedEmbeds)}`); return };

    /**
     * animate the removal, then
     * update the item after animation ends (or fails)
     */
    // $(breakout_id).slideUp(150).promise().always(
    //   () => {console.log(`Slideup promise on ${breakout_id}`); item.update({'data.embeds': prunedAbility.embeds}) }
    // );

    Dialog.confirm({
      title: event.currentTarget.title,
      content: "<p><strong>" + game.i18n.localize('AreYouSure') + "</strong></p>",
      yes: () => {
        const breakout = `#${breakout_id}`;
        doItemTween(breakout,'delete', () => { item.update({'data.embeds': prunedAbility.embeds}) });    
      },
      no: () => {},
      defaultYes: false
    });

    // const breakout = `#${breakout_id}`;
    // doItemTween(breakout,'delete', () => { item.update({'data.embeds': prunedAbility.embeds}) });

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
    const breakoutData = this.getEmbedById(embeds, breakout_id);
    breakoutData.settings = {
      useRunes: game.settings.get('questworlds','useRunes'),
    }
    
    const dialogContent = await renderTemplate("systems/questworlds/templates/dialog/breakout-edit.html", breakoutData);
    // TODO: dialogs per breakout type
    // TODO: Handle multiple runes input

    new Dialog({
      title: "Editing Breakout",
      content: dialogContent,
      buttons: {
        saveButton: {
          label: "Save",
          icon: `<i class="fas fa-save"></i>`,
          callback: (html) => updateBreakout(html),
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
      const newRunes = html.find('input[name="runes"]').val();
      const newName = html.find('input[name="name"]').val();
      const newRating = Number.parseInt(html.find('input[name="rating"]').val());
      const newMasteries = Number.parseInt(html.find('input[name="masteries"]').val());


      // extract a reference to the right breakout
      const targetEmbed = QuestWorldsItem.getEmbedById(embeds, breakout_id);

      // update data in embeds via the reference
      targetEmbed.runes = newRunes;
      targetEmbed.name = newName;
      targetEmbed.rating = newRating;
      targetEmbed.masteries = newMasteries;

      // console.log(targetEmbed);
      // console.log(embeds);

      //update the item data with copy contents
      item.update({'data.embeds': embeds});
    
    } // updateBreakout()
    
  } // editEmbed()

  /**
   * Find and return an embedded breakout by id from an Item.
   * Returns null if not found.
   * @param {Array} embeds        // the Item
   * @param {String} id           // the id to find
   * @param {Function} callback   // An optional callback to process the found entry directly
   */
  static getEmbedById(embeds, id) {

    /**
     * flatten() is (c) Thomas, licensed CC BY-SA 3.0 at https://stackoverflow.com/a/35272973/480642
     * Create a flattened array of an arbitrarily nested structure
     *    that does its nesting in an 'embeds' node.
     * @param {Array} into   // An array to append discovered entries onto
     * @param {Any} node     // The object containing nesting things
    */
    function flatten(into, node){
      if(node == null) return into;
      if(Array.isArray(node)) return node.reduce(flatten, into);
      into.push(node);
      return flatten(into, node.embeds);
    }
    
    const list = flatten([], embeds);

    const i = list.findIndex(entry => { return entry.id == id });
    if (i == -1) return null;
    return list[i];
  }

}

export function doItemTween(target, action='remove', callback=null) {
  const duration1 = 0.2;
  const duration2 = duration1 * 0.8;
  let fn = gsap.to;
  if (action == 'add') fn = gsap.from;
  fn(target,{
    opacity: 0,
    duration: duration2,
    ease: Expo.easeOut,
  });
  fn(target,{
    // delay: 0.1,
    height: 0,
    duration: duration1,
    // ease: Power4.easeInOut,
    ease: Power2.easeOut,
    onComplete: callback,
  });
}