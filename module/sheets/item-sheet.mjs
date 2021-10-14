import { DEFAULT_ICONS } from "../documents/item.mjs";
import { EmbedsEvents, ContextMenus, FieldHelpers } from "../helpers/event-handlers.mjs";
import { RatingHelper } from "../helpers/rating-helpers.mjs";

/**
 * Extend the basic ItemSheet with some very simple modifications
 * @extends {ItemSheet}
 */
export class QuestWorldsItemSheet extends ItemSheet {

    /** @override */
    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            classes: ["questworlds", "sheet", "item"],
            width: 520,
            height: 480,
            tabs: [{ navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "description" }]
        });
    }

    /** @override */
    get template() {
        const path = "systems/questworlds/templates/item";
        
        // Return a sheet for each item type and/or item type variant
        if (this.item.data.type == "ability")
            return `${path}/item-${this.item.data.data.variant}-sheet.html`;
        else
            return `${path}/item-${this.item.data.type}-sheet.html`;
    }

    /* -------------------------------------------- */

    /** @override */
    getData() {
        // Retrieve base data structure.
        const context = super.getData();

        // Use a safe clone of the item data for further operations.
        const itemData = context.item.data;

        // Retrieve the roll data for TinyMCE editors.
        context.rollData = {};
        let actor = this.object?.parent ?? null;
        if (actor) {
            context.rollData = actor.getRollData();
        }

        // Add the item's data to context.data for easier access, as well as flags.
        context.data = itemData.data;
        context.flags = itemData.flags;
        // Add item type to the data.
        context.data.itemType = context.item.type;

        // create a flat token:name object for the set of runes, sorted
        const runeSettingList = Object.entries(game.settings.get('questworlds','runeFontSettings').runes).sort();
        let runeSet = runeSettingList.reduce((set,e) => {
            let [key, name] = [ e[0], e[1].name ];
            set.push([key,name]);
            return set; 
        },[]);
        runeSet.unshift(['','']);   // we need a "none" or blank option at the top
        runeSet = Object.fromEntries(runeSet);  // convert array of entries to dictionary
    
        // Add some game settings to the context
        context.settings = {
            "useRunes": game.settings.get("questworlds","useRunes"),
            "sidekickName": game.settings.get("questworlds","sidekickName"),
            "keywordBreakout": game.settings.get("questworlds","keywordBreakout"),
            "runeSet": runeSet,
        };

        return context;
    }

    /* -------------------------------------------- */

    // TODO: input validation, mostly rating rectification
    // _updateObject()

    /* -------------------------------------------- */

    /** @override */
    activateListeners(html) {
        super.activateListeners(html);

        // Everything below here is only needed if the sheet is editable
        if (!this.isEditable) return;

        // Roll handlers, click handlers, etc. would go here.

        // Add, remove, or edit breakout ability
        html.find(".breakout-controls").on("click", ".breakout-control", EmbedsEvents.onClickEmbedControl.bind(this));


        // html.on("contextmenu",".item>.item-body",ContextMenus.ItemMenu.activate);
        html.on("contextmenu",".breakout>.breakout-body",ContextMenus.ItemMenu.activate);
        html.on('mouseleave click',".menu.active",ContextMenus.ItemMenu.deactivate);

        const controls = html.find('.abilities-header .breakout-controls');
        if (controls[0]?.childElementCount > 1) {
            ContextMenus.ConvertToMenu($(controls[0]));
        }

        // adjust size of header field [input]s according to content
        html.on('keypress keyup',".header-fields h1 input.resizing", FieldHelpers.AdjustSizeToContent);
        $('.header-fields h1 input.resizing').trigger('keyup');


    }

    /** @override */
    async _updateObject(event, formData) {
        const item = this.object;

        // update default icon if it's still a default
        if (item.type == 'benefit') {
            // get variant of NEW data
            const newVariant = RatingHelper.merge({
                rating: formData['data.rating'],
                masteries: formData['data.masteries']
            }) >= 0 ? 'benefit' : 'consequence';
            updateDefaultImage(newVariant);
        } else
        if (this.object.type == 'ability') {
            const newVariant = formData['data.variant'];
            updateDefaultImage(newVariant);
        }

        /**
         * IF the current icon matches the current variant default icon
         * AND the variant is changing,
         * THEN change to new variant's default icon.
         * Otherwise leave it alone.
         * @param {String} newVariant   The variant-to-be based on new form data
         */
        function updateDefaultImage(newVariant) {
            const img = item.data.img;
            if (img == DEFAULT_ICONS[item.variant] && item.variant != newVariant) {
                formData.img = DEFAULT_ICONS[newVariant];
            }
        }

        // rationalize ratings
        const isModifier = (item.type == 'benefit');
        let fixedRating = RatingHelper.rationalize({
            rating: formData['data.rating'],
            masteries: formData['data.masteries']
        },isModifier);

        // make sure benefits are always non-zero
        if (this.object.type == 'benefit') {
            if (RatingHelper.merge(fixedRating) == 0)
                fixedRating.rating = RatingHelper.defaultRating('benefit');
        } else {
            // ... and that non-benefits are always positive
            fixedRating = RatingHelper.abs(fixedRating);
        }


        formData['data.rating'] = fixedRating.rating;
        formData['data.masteries'] = fixedRating.masteries;

        return super._updateObject(event, formData);
    }
}
