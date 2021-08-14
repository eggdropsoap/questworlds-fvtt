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

    // Perform create and delete actions.
    switch ( action ) {
      case "create":
        BreakoutsSheetHelper.createBreakout(event, this);
        break;
      case "delete":
        BreakoutsSheetHelper.deleteBreakout(event, this);
        break;
      case "edit":
        BreakoutsSheetHelper.editBreakout(event, this);
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
   * Create a new breakout.
   * @param {MouseEvent} event    The originating left click event
   * @param {Object} app          The form application object.
   * @private
   */
  static async createBreakout(event, app) {

    const a = event.currentTarget;
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

    // update the item data
    theKeyword.update({'data.breakouts': breakouts});    
  
  } // createBreakout()

  /**
   * Delete a breakout.
   * @param {MouseEvent} event    The originating left click event
   * @param {Object} app          The form application object.
   * @private
   */
  static async deleteBreakout(event, app) {

    const a = event.currentTarget;
    const li = $(event.currentTarget).parents("li.breakout");
    const breakout_id = a.dataset.breakoutId;
    const theKeyword = app.object;
    const breakouts = theKeyword.data.data.breakouts;

    //find and remove the breakout by id from temporary data
    let prunedBreakouts = breakouts.filter(item => { return item.id !== breakout_id });
    
    /**
     * animate the removal, then
     * update the item after animation ends (or fails)
     */
    li.slideUp(200).promise().always(
      () => theKeyword.update({'data.breakouts': prunedBreakouts})
    );
  
  } // deleteBreakout()

  /**
   * Edit a breakout.
   * @param {MouseEvent} event    The originating left click event
   * @param {Object} app          The form application object.
   * @private
   */
  static async editBreakout(event, app) {

    const a = event.currentTarget;
    const breakout_id = a.dataset.breakoutId;
    const theKeyword = app.object;
    const breakouts = theKeyword.data.data.breakouts;

    const breakoutData = breakouts.filter(item => { return item.id == breakout_id })[0];

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
        bonus: Number.parseInt(html.find("input#breakout-bonus").val()),
        name: html.find("input#breakout-name").val(),
        id: breakout_id,
      }

      // find the right breakout and get index in list
      const updatedBreakouts = breakouts;
      const targetIndex = breakouts.findIndex(item => { return item.id == breakout_id })
   
      // create updated copy of list of breakouts with a splice
      updatedBreakouts.splice(targetIndex,1,changedBreakout);

      //update the item data with copy contents
      theKeyword.update({'data.breakouts': updatedBreakouts});

    } // updateBreakout()

    return;
    
  } // editBreakout()

} // class BreakoutsSheetHelper