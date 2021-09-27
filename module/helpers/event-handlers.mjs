import { QuestWorldsItem } from "../documents/item.mjs";
import { QuestWorldsItemSheet } from "../sheets/item-sheet.mjs";
import { gsap/*, CSSPlugin, Power4, Back, Expo, Power1, Power2, Power3*/ } from "/scripts/greensock/esm/all.js";


export class ContentEditableHelper {

    /**
     * Sync contenteditables with real inputs
     * @param event     Originating html event
     * @private
     */
    static async onInputEditableElement(event) {
        const a = event.target;
        const realInput = document.getElementById(event.target.dataset.realInputId);
        if (a.innerText == "") a.innerHTML = "&nbsp;";
        realInput.value = a.innerText;
    }

    /**
     * Submit form on focusout from contenteditables
     * @param event     Originating html event
     * @private
     */
    static async onBlurEditableElement(event) {
        await this.submit();
    }
}

export class EmbedsEvents {

  /**
   * Listen for click events on a breakout control to modify the list of breakouts in the sheet
   * @param {MouseEvent} event    The originating left click event
   * @private
   */
  static async onClickEmbedControl(event) {
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
     *      (in an ugly one-liner, sorry)
     * 
     * TODO: instead use an anonymous function that returns the right object,
     *       for readability and maintainability
     */
    const theItem = this instanceof QuestWorldsItemSheet ? this.object : this.object.getEmbeddedDocument("Item",$(event.currentTarget).parents("li.item")[0].dataset.itemId);

    // Perform create and delete actions.
    switch ( action ) {
      case "create":
        QuestWorldsItem.createEmbed(event, theItem);
        break;
      case "delete":
        QuestWorldsItem.deleteEmbed(event, theItem);
        break;
      case "edit":
        QuestWorldsItem.editEmbed(event, theItem);
        break;
    }
  }
}

export class ContextMenus {


  static ItemMenu = {
    activate: (event) => {
      const menu = $(event.currentTarget).find('.menu');
      menu.addClass('active');
      const buttonHeight = menu.find('a').css('height').replace('px','');
      menu.css("top",event.clientY - buttonHeight); // position menu so pointer is between 1st & 2nd controls
      menu.css("left",event.clientX-4);   // pointer on left margin
      gsap.to('.menu.active',{
        // height: '40px',
        opacity: 0.95,
        duration: 0.1,
      });
    },

    deactivate: (event) => {
      $(event.currentTarget).removeClass('active');
    },
  };  // ItemMenu

}
  
