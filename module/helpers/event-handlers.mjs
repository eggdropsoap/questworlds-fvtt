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

    /**
     * Hide a div or whatnot while revealing the associated input.
     * Target input's name must be in data-target-input of fake click receiver.
     * Swap work best visually when fake element's box layout matches real input's.
     * @param event 
     */
    static async onClickFakeInput(event) {
      const fake = event.currentTarget;
      const target = fake.dataset?.targetInput;
      const real = $(fake).siblings(`[name="${target}"]`)[0];
      if (real) {
        // hide the fake input
        $(fake).hide();
        //reveal and focus the real input
        real.setAttribute('type','text');
        real.removeAttribute('placeholder');
        real.focus();
      }

      let donothing;
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
     */
    const theItem = this instanceof QuestWorldsItemSheet ?
      this.object :
      this.object.getEmbeddedDocument(
        "Item",
        $(event.currentTarget).parents("li.item")[0].dataset.itemId
      );

    // Perform create, edit, and delete actions.
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
      let left = event.clientX - 4; // pointer on left padding
      switch (event.data?.position) {
        case 'left':
          // pointer on right padding
          left = event.clientX - $(menu)[0].getBoundingClientRect().width + 4;
          break;
        case 'above':
          // pointer on bottom middle padding
          top = event.clientY - $(menu)[0].getBoundingClientRect().height + 4 ;
          left = event.clientX - ( $(menu)[0].getBoundingClientRect().width / 2 );
          break;
        case 'below':
          // pointer on top middle padding
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
    // console.log("ConvertToMenu()",div);
    const newMenu = $('<div class="breakout-controls menu"></div>');
    div.find('a').appendTo(newMenu);
    div.append(newMenu);

    // add a child link as visual target for menu activation...
    div.append(`<a class="breakout-control" title="${game.i18n.localize('QUESTWORLDS.Add')}"><i class="fas fa-plus"></i></a>`);

    // ... but make the whole div the menu-activate click handler
    div.on('click',null,{position:'above'},this.ItemMenu.activate);

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

    const sizer = $('span.hidden-sizer')[0];
    if (!sizer) return;
    sizer.innerHTML = this.value.replaceAll(' ','&nbsp;') + adjust;
    const width =  sizer.getBoundingClientRect().width;
    $(this).css('width',width + 'px');
  }

}

export class GalleryControls {

  static onClickAdd(event) {
    event.preventDefault()
    // ui.notifications.info('Add art button clicked');

    const e = event.currentTarget;
    const targetId = e.dataset.targetId;
    const target = $(e).parent().find(`[data-id="${targetId}"]`)[0];
    const options = {
      field: target,
      callback: () => {
        this.submit()
          .then( () => {
            this.render()
          })
      }
    }
    const fp = new FilePicker(options);
    this.filepickers.push(fp);

    fp.browse();
  }

  static onClickDelete(event) {
    event.preventDefault()
    // ui.notifications.info('Delete art button clicked');

    // gate entire operation behind an Are You Sure? dialog
    Dialog.confirm({
      title: game.i18n.localize('QUESTWORLDS.dialog.RemoveGalleryImage'),
      content: '<p><strong>' + 
        game.i18n.localize('QUESTWORLDS.dialog.RemoveGalleryImageL1') +
        '</strong></p><p>' +
        game.i18n.localize('QUESTWORLDS.dialog.RemoveGalleryImageL2') +
        '</p>',
      yes: () => _doDelete.bind(this)(),
      no: () => {},
      defaultYes: false
    });

    function _doDelete() {
      const target = event.currentTarget.dataset.target;
      const actor = this.object;
      
      const galleryArray = Object.values(actor.data.data.gallery); // get gallery, convert to array
      galleryArray.splice(target,1);  // remove target index
      const newGalleryObj = Object.assign({},galleryArray); // back to object with sequential indices
  
      actor.update({'data.gallery': newGalleryObj},{render: false});  // store without re-render...
      // The last update *merged* new with old gallery, leaving last entry duplicated.
      // Delete last item to remove duplciation, this time with re-render
      // (TODO: see if there is a single-operation way to do this.)
      const lastIndex = galleryArray.length;
      actor.update({'data.gallery': {[`-=${lastIndex}`]: null}});
    }

  }

  static onClickView(event) {
    event.preventDefault()
    // ui.notifications.info('View art button clicked');

    const path = event.currentTarget.dataset?.path;
    const caption = $(event.currentTarget).parents('li.art').find('input').val();
    const character = this.actor.data.name;
    const title = caption ? `“${caption}”` : game.i18n.localize('QUESTWORLDS.untitled');
    if (path) {
      const ip = new ImagePopout(path, {
        title: `${character}: ${title}`,
        shareable: true,
        // entity: game.actors.getName("My Hero")
      });
      // Display the image popout
      ip.render(true);
    }
  }

  static onDrag(event) {
    const mode = event.type;

    if (mode == 'dragstart') {
      event.dataTransfer.effectAllowed = "move";
      const index = event.currentTarget.dataset.index;
      const path = event.currentTarget.dataset.path;
      event.dataTransfer.clearData();
      event.dataTransfer.setData("text/gallery-index",index); // custom type to check to allow drops
      event.dataTransfer.setData("text/local-path",path);
      event.dataTransfer.setData("text/plain",path);
  
    } else
    if (mode == 'dragover') {
      event.preventDefault(); // cancelling both this and dragenter allows drop
    } else
    if (mode == 'dragenter') {
      const isGalleryIndex = event.dataTransfer.types.includes("text/gallery-index");
      if (isGalleryIndex) {
        event.preventDefault(); // allow drop only if custom type is right
      }
    } else
    if (mode == 'drop') {
      // get drop target index
      const targetIndex = event.currentTarget.dataset?.index;
      if (!targetIndex) return; // no drop possible
      const sourceIndex = event.dataTransfer.getData("text/gallery-index");
      if (!sourceIndex) return; // no drop possible

      const actor = this.object;
      // get gallery, convert to array
      const galleryArray = Object.values(actor.data.data.gallery);
      // insert ahead of target
      const entry = galleryArray[sourceIndex];
      galleryArray.splice(sourceIndex,1);
      galleryArray.splice(targetIndex,0,entry);
      // reserialize as an object
      const galleryObj = Object.assign({},galleryArray);

      // update with rearranged gallery
      actor.update({'data.gallery': galleryObj});
    }

  }

}