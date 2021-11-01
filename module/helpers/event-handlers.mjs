import { QuestWorldsItem } from "../documents/item.mjs";
import { QuestWorldsItemSheet } from "../sheets/item-sheet.mjs";
import { moveIndex } from "../utils.mjs";
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

export class XPControls {

  static onClickAddXP(event) {
    event.preventDefault();
    const name = this.object.data.name;

    function _doAddXP(event) {
      const requiredXP = game.settings.get('questworlds','XPtoAdvance');
      // const e = event.currentTarget;
      const pc = this.object;
      const points = {
        xp: pc.data.data.points.xp,
        careerXp: pc.data.data.points.careerXp,
        advances: pc.data.data.points.advances,
      };
      points.xp++;
      points.careerXp++;
      if (points.xp >= requiredXP) {
        points.advances++;
        points.xp = 0;
      }
      pc.update({'data.points': points})

    }

    const content = '<p>' +
      game.i18n.format('QUESTWORLDS.dialog.AddXPMessage', {name: name}) +
      '</p>';

    Dialog.confirm({
      title: game.i18n.localize('QUESTWORLDS.dialog.AddXPTitle'),
      content: content,
      yes: () => _doAddXP.bind(this)(event),
      no: () => {},
      defaultYes: false
    });
    
  }

  static async openAdvancesHistory(event) {
    event.preventDefault();

    const sheetContext = this.getData();

    const panelContext = {
      advances: sheetContext.data.advanceHistory,
      title: game.i18n.localize('QUESTWORLDS.AdvancePanels.AdvanceHistory'),
      cssClass: "advanceHistory",
      XPtoAdvance: game.settings.get('questworlds','XPtoAdvance'),
    }

    const content = await renderTemplate("/systems/questworlds/templates/dialog/advances-history.html", panelContext);

    Dialog.prompt({
      title: game.i18n.localize('QUESTWORLDS.Advances'),
      content: content,
      label: game.i18n.localize('Close'),
      callback: () => {},
    });//, options);
  }

  static async dismissNewAdvanceNotice(event) {
    event.preventDefault();
    const target = event.currentTarget;
    $(target).removeClass('new');
  }

  static async openAdvancesPanel(event) {
    event.preventDefault();

    _activateListeners();

    const sheetContext = this.getData();
    const actor = this.actor;

    const ADVANCE_OPTIONS = {
      ABILITY_POINTS_1: {
        name: "QUESTWORLDS.AdvanceOptions.AbilityPoints",
      },
      ABILITY_POINTS_2: {
        name: "QUESTWORLDS.AdvanceOptions.AbilityPoints",
      },
      KEYWORD_POINTS_1: {
        name: "QUESTWORLDS.AdvanceOptions.KeywordPoints",
      },
      KEYWORD_POINTS_2: {
        name: "QUESTWORLDS.AdvanceOptions.KeywordPoints",
      },
      IMPROVE_BREAKOUT: {
        name: "QUESTWORLDS.AdvanceOptions.ImproveBreakout",
      },
      NEW_BREAKOUT: {
        name: "QUESTWORLDS.AdvanceOptions.NewBreakout",
      },
      NEW_ABILITY: {
        name: "QUESTWORLDS.AdvanceOptions.NewAbility",
      },
      PROMOTE_ABILITY: {
        name: "QUESTWORLDS.AdvanceOptions.PromoteAbility",
      },
      BUYOFF_FLAW: {
        name: "QUESTWORLDS.AdvanceOptions.BuyoffFlaw",
      },
      REPLACEMENT_SK: {
        name: "QUESTWORLDS.AdvanceOptions.ReplacementSidekick",
      },
      NEW_FLAW: {
        name: "QUESTWORLDS.AdvanceOptions.AddFlaw",
      },
    }

    let selectOptions = Object.entries(ADVANCE_OPTIONS)
      .reduce( (list, entry) => {
        list.push([entry[0],entry[1].name]);
        return list;
      },[]);
    selectOptions.unshift(['','']);   // blank top entry
    selectOptions.pop();              // remove NEW_FLAW entry from end
    selectOptions = Object.fromEntries(selectOptions);  // turn into indexed Object

    const panelContext = {
      advances: sheetContext.data.advanceHistory,
      options: selectOptions,
    }

    const content = await renderTemplate("/systems/questworlds/templates/dialog/choose-advances.html", panelContext);

    new Dialog({
      title: game.i18n.localize('QUESTWORLDS.Advances'),
      content: content,
      buttons: {
        saveButton: {
          label: game.i18n.localize('QUESTWORLDS.dialog.Save'),
          icon: `<i class="fas fa-save"></i>`,
          callback: (html) => _updateAdvances(html,actor),
        },
        cancelButton: {
          label: game.i18n.localize('QUESTWORLDS.dialog.Cancel'),
          icon: `<i class="fas fa-times"></i>`
        },
      },
      default: "saveButton",
      render: disableSaveButton,
    }).render(true);

    function disableSaveButton(html) {
      const saveButton = html.filter('.dialog-buttons').find('.saveButton');
      if (saveButton.length){
        saveButton[0].disabled = true;
      }
    }

    function _updateAdvances(html,actor) {
      const formElement = $(html).find('form')[0];
      const form = new FormDataExtended(formElement);
      const data = form.toObject();

      if (data.choice1 == '' || data.choice2 == '') {
        ui.notifications.warn(game.i18n.localize('QUESTWORLDS.AdvancePanels.ValidationWarning'));
        return;
      }

      const points = actor.data.data.points;
      const advanceHistory = actor.data.data.advanceHistory;

      const newOptionsArr = [];
      newOptionsArr.push(["0",ADVANCE_OPTIONS[data.choice1]]);
      newOptionsArr.push(["1",ADVANCE_OPTIONS[data.choice2]]);
      if (data.newflaw) {
        newOptionsArr.push(["2",ADVANCE_OPTIONS['NEW_FLAW']]);
      }
      const newOptionsObj = Object.fromEntries(newOptionsArr);
  
      let donothing;
    }

    function _activateListeners() {
      const optionSelect = 'div.choose-advances form select.advance-option';
      
      $(document)
        .on('input',optionSelect,_onSelectInput);

      function _onSelectInput(event) {
        const e = event.currentTarget;
        const dialog = $(e).closest('.window-content');
        const option = e.value;
        const name = e.name;
        const sibling = name == 'choice1' ? 'choice2' : 'choice1';
        const form = $(dialog).find('div.choose-advances form');
        const saveButton = $(dialog).find('.dialog-buttons .saveButton')[0];

        // enable all options in sibling select
        form.find(`select[name="${sibling}"] option`)
          .removeAttr('disabled');

        // if new option is the blank option, disable the Save button,
        // else
        //    disable the matching option in the sibling
        //    & if both options are chosen
        //      then enable Save button
        if (option == '') {
          // disable save button
          saveButton.disabled = true;
        } else {
          // disable matching option in sibling select
          form.find(`select[name="${sibling}"] option[value="${option}"]`)[0].disabled = true;
          // are both options chosen yet?
          const valid = form.find('select option:selected').get().reduce((a,b) => { return a && b.value != '' },true);  // reduces to true if all select non-empty
          if (valid) {
            // enable Save button
            saveButton.disabled = false;
          }
        }
      }
    }

  }

}

export class GalleryControls {

  static onClickAdd(event) {
    event.preventDefault();
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
      moveIndex(galleryArray,sourceIndex,targetIndex);
      // reserialize as an object
      const galleryObj = Object.assign({},galleryArray);

      // update with rearranged gallery
      actor.update({'data.gallery': galleryObj});
    }

  }

}