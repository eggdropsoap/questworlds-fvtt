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
      let top = event.clientY - buttonHeight; // pointer between 1st & 2nd controls
      let left = event.clientX - 4; // pointer on left margin
      switch (event.data?.position) {
        case 'left':
          // pointer on right margin
          left = event.clientX - $(menu)[0].getBoundingClientRect().width + 4;
          break;
        case 'top':
          top = event.clientY - $(menu)[0].getBoundingClientRect().height + 4 ;
          left = event.clientX - ( $(menu)[0].getBoundingClientRect().width / 2 );
          break;
        case 'bottom':
          top = event.clientY + 4 ;
          left = event.clientX - ( $(menu)[0].getBoundingClientRect().width / 2 );
          break;
      }
      menu.css("top",top); 
      menu.css('left',left);
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

  static ConvertToMenu(div) {
    // pack child controls into a new div
    const newMenu = $('<div class="breakout-controls menu"></div>');
    div.find('a.breakout-control').appendTo(newMenu);
    div.append(newMenu);

    // re-add a child link and attach click handler to it to activate menu
    div.append(`<a class="breakout-control" title="${game.i18n.localize('QUESTWORLDS.Add')}"><i class="fas fa-plus"></i></a>`);

    // make the whole div a menu-activate click handler
    div.on('click',null,{position:'top'},this.ItemMenu.activate);

  }; // ConvertToMenu()

}
  
export class FieldHelpers {
  
  static AdjustSizeToContent(event) {
    const etype = event.type;
    const ekey = event.key;
    if (ekey == "Enter" || ekey == "Return") {
      // $(this).next('input').focus();
      return;
    }
    let adjust = etype == 'keypress' ? ekey : '';
    // onkeypress the key isn't part of the input.value yet, but we know the key;
    // onkeyup the key IS part of the input.value already and doesn't need adding

    if (adjust == ' ' || (etype == 'keyup' && this.value.slice(-1) == ' ')) adjust = "&nbsp;";
    // console.log(etype, '"'+adjust+'"');

    const sizer = $('span.hidden-sizer')[0];
    sizer.innerHTML = this.value.replaceAll(' ','&nbsp;') + adjust;
    const width =  sizer.getBoundingClientRect().width;
    $(this).css('width',width + 'px');
  }

}