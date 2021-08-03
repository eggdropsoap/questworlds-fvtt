export class BreakoutsSheetHelper {

  /**
   * Listen for click events on a breakout control to modify the list of breakouts in the sheet
   * @param {MouseEvent} event    The originating left click event
   * @private
   */
  static async onClickBreakoutControl(event) {
    event.preventDefault();
    const a = event.target;
    const action = a.dataset.action;

    console.log("Click processing: " + action)
    //console.log(event)

    // Perform create and delete actions.
    switch ( action ) {
      case "create":
        console.log("Create processing")
        BreakoutsSheetHelper.createBreakout(event, this);
        break;
      case "delete":
        console.log("Delete processing")
        BreakoutsSheetHelper.deleteBreakout(event, this);
        break;
    }
  }

  /* -------------------------------------------- */

  /**
   * Listen for the roll button on attributes.
   * @param {MouseEvent} event    The originating left click event
   */
/*  static onAttributeRoll(event) {
    event.preventDefault();
    const button = event.currentTarget;
    const label = button.closest(".attribute").querySelector(".attribute-label")?.value;
    const chatLabel = label ?? button.parentElement.querySelector(".attribute-key").value;
    const shorthand = game.settings.get("worldbuilding", "macroShorthand");
    const rollData = this.object.getRollData();
    let formula = button.closest(".attribute").querySelector(".attribute-value")?.value;

    // If there's a formula, attempt to roll it.
    if ( formula ) {
      // Get the machine safe version of the item name.
      let replacement = null;
      if ( formula.includes('@item.') && this.item ) {
        let itemName = this.item.name.slugify({strict: true});
        replacement = !!shorthand ? `@items.${itemName}.` : `@items.${itemName}.attributes.`;
        formula = formula.replace('@item.', replacement);
      }
      formula = EntitySheetHelper.replaceData(formula, rollData, {missing: null});
      // Replace `@item` shorthand with the item name and make the roll.
      let r = new Roll(formula, rollData);
      r.roll().toMessage({
        user: game.user._id,
        speaker: ChatMessage.getSpeaker({ actor: this.actor }),
        flavor: `${chatLabel}`
      });
    }
  }
*/

  /* -------------------------------------------- */

  /**
   * Create new breakouts.
   * @param {MouseEvent} event    The originating left click event
   * @param {Object} app          The form application object.
   * @private
   */
  static async createBreakout(event, app) {
    console.log("createBreakout() reached");

    const a = event.target;
    //    let dtype = a.dataset.dtype;
    const theKeyword = app.object;
    const breakouts = theKeyword.data.data.breakouts;
    const form = app.form;
    
    // push New Breakout into the item's breakouts array
    let newBreakout = {
      "id": "breakout-" + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15),
      "name": "New Breakout Ability",
      "bonus": 1,
    }
    breakouts.push(newBreakout);
    console.log(breakouts);
    console.log(app.object.update);

    // update the item data
    theKeyword.update({'data.breakouts': breakouts});    
  }

  /**
   * Delete an attribute.
   * @param {MouseEvent} event    The originating left click event
   * @param {Object} app          The form application object.
   * @private
   */
  static async deleteBreakout(event, app) {
    console.log("deleteBreakout() stub reached");
    return;

    const a = event.currentTarget;
    const li = a.closest(".attribute");
    if ( li ) {
      li.parentElement.removeChild(li);
      await app._onSubmit(event);
    }
  }


}