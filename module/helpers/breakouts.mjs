import { QuestWorldsItemSheet} from "../sheets/item-sheet.mjs"

export class BreakoutsSheetHelper {

  /**
   * Listen for click events on a breakout control to modify the list of breakouts in the sheet
   * @param {MouseEvent} event    The originating left click event
   * @private
   */
  static async onClickBreakoutControl(event) {
    event.preventDefault();
    const a = event.currentTarget;
    const action = a.dataset.action;

    /** if this is an item object
     * then
     *      theItem = this.object, easy!
     * else
     *      this should be an actor object,
     *      so get the item by id from the actor's embedded items,
     *      using data from the parent li.item tag
     */
    const theItem = this instanceof QuestWorldsItemSheet ?
      this.object :
      this.object.getEmbeddedDocument("Item",$(event.currentTarget)
        .parents("li.item")[0].dataset.itemId);

    // Perform create and delete actions.
    switch ( action ) {
      case "create":
        BreakoutsSheetHelper.createBreakout(event, theItem);
        break;
      case "delete":
        BreakoutsSheetHelper.deleteBreakout(event, theItem);
        break;
      case "edit":
        BreakoutsSheetHelper.editBreakout(event, theItem);
        break;
    }
  }

  /* -------------------------------------------- */

  /**
   * Create a new breakout.
   * @param {MouseEvent} event    The originating left click event
   * @param {Object} item   The item object.
   * @private
   */
  static async createBreakout(event, item) {
    const embeds = item.system.embeds;
    // push New Breakout into the item's embeds array
    let newBreakout = {
      "id": "breakout-" + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15),
      "name": "New Breakout Ability",
      "type": "breakout",
      "rating": 5,
    }
    embeds.push(newBreakout);

    // update the item data
    item.update({'system.embeds': embeds});    
  
  } // createBreakout()

  /**
   * Delete a breakout.
   * @param {MouseEvent} event    The originating left click event
   * @param {Object} item   The item object.
   * @private
   */
  static async deleteBreakout(event, item) {

    const a = event.currentTarget;
    const li = $(event.currentTarget).parents("li.breakout");
    const breakout_id = a.dataset.breakoutId;
    const embeds = item.system.embeds;

    //find and remove the breakout by id from temporary data
    let prunedEmbeds = embeds.filter(entry => { return entry.id !== breakout_id });
    
    /**
     * animate the removal, then
     * update the item after animation ends (or fails)
     */
    li.slideUp(150).promise().always(
      () => item.update({'system.embeds': prunedEmbeds})
    );
  
  } // deleteBreakout()

  /**
   * Edit a breakout.
   * @param {MouseEvent} event    The originating left click event
   * @param {Object} item   The item object.
   * @private
   */
  static async editBreakout(event, item) {
    const a = event.currentTarget;
    const breakout_id = a.dataset.breakoutId;
    const embeds = item.system.embeds;  
    const breakoutData = embeds.filter(item => { return item.id == breakout_id })[0];
    const dialogContent = await renderTemplate("systems/questworlds/templates/dialog/breakout-edit.html", breakoutData);
    
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
      const name = html.find("input#breakout-name").val();
      const changedBreakout = {
        rating: Number.parseInt(html.find("input#breakout-rating").val()),
        name: html.find("input#breakout-name").val(),
        id: breakout_id,
      }

      // find the right breakout and get index in list
      const updatedBreakouts = embeds;
      const targetIndex = embeds.findIndex(entry => { return entry.id == breakout_id })
   
      // create updated copy of list of embeds with a splice
      updatedBreakouts.splice(targetIndex,1,changedBreakout);

      //update the item data with copy contents
      item.update({'system.embeds': updatedBreakouts});
    } // updateBreakout()

    return;
    
  } // editBreakout()

} // class BreakoutsSheetHelper
