import { gsap, Expo, Power2, /* CSSPlugin, Power4, Back, Power1, Power3 */ } from "/scripts/greensock/esm/all.js";
import { tokenNameToHTML,tokenMarkupToHTML } from "../helpers/rune-helpers.mjs"; 
import { RatingHelper } from "../helpers/rating-helpers.mjs";

const legalEmbedTypes = RatingHelper.legalEmbedTypes;

export const DEFAULT_ICONS = {
    ability: 'systems/questworlds/assets/ability.svg',
    keyword: 'systems/questworlds/assets/keyword.svg',
    sidekick: 'systems/questworlds/assets/sidekick.svg',
    magicgroup: 'systems/questworlds/assets/magic-group.svg',
    flaw: 'systems/questworlds/assets/flaw.svg',
    benefit: 'systems/questworlds/assets/benefit.svg',
    consequence: 'systems/questworlds/assets/consequence.svg',
}

/**
 * set up the embeds class
 * @param {String} type   // ability, breakout, keyword, info
 * @param {String} name   // new ability's name
 */
class EmbeddedAbility {

    constructor(type, parentId, name, rating, masteries, rune) {
        // one id schema for all embeds, since they can switch type later
        this.id = "embed-" + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

        this.type = legalEmbedTypes.includes(type) ? type : 'info';

        this.parentId = parentId || null;

        this.name = name ||  game.i18n.localize('QUESTWORLDS.New' + this.type.capitalize());

        this.rating = rating || RatingHelper.defaultRating(this.type);

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
    
    /** @override */
     async _preCreate(data, options, userId) {
        await super._preCreate(data, options, userId);
        const itemType = this.system?.variant || this.type;

        // set default Item icon per type and variant
        if (data.img === undefined) {
            const img = DEFAULT_ICONS[itemType];
            if (img) await this.updateSource({ img : img});
        }

        // set default rating
        let defaultRating;
        switch (itemType) {
            case 'ability':
            case 'keyword':
            case 'flaw':
            case 'benefit':
                defaultRating = RatingHelper.defaultRating(itemType);
            default:
        }
        if (defaultRating) await this.updateSource({system: {rating: defaultRating}});
    }

    /**
     * variant() accessor
     * 
     * Deduce what kind of item this is, and return its most specific type identity string
     * 
     * Pseudocode:
     * If this is a Benefit Item, type is based on rating sign
     *      - get item's rating and mastery
     *      - translate them into an integer
     *      - if integer is zero or positive: benefit variant
     *      - other: consequence variant
     * Otherwise this is any other kind of Item, which is either identified from Item Type or system.variant
     *      - is system.variant not null? Then it's that string
     *      - else is Item Type not null? Then it's that string
     *      - else it's undefined (which should never happen outside bugs), so return undefined
     */
    get variant() {
        if (this.type == 'benefit')
            return RatingHelper.merge({
                rating: this.system.rating,
                masteries: this.system.masteries
            }) >= 0 ? 'benefit' : 'consequence';
        else return this.system?.variant || this.type || undefined;
    }

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
        rollData.item = foundry.utils.deepClone(this.system);
        rollData.item.name = this.name;
        rollData.item.type = this.type;

        return rollData;
    }

    /**
     * Handle clickable rolls.
     * @param {Event} event   The originating click event
     * @private
     */
    async roll(embedId=null) {
        const item = this;

        // Initialize chat data.
        const speaker = ChatMessage.getSpeaker({ actor: this.actor });
        const rollMode = game.settings.get('core', 'rollMode');
        const itemType = this.variant;
        let rating = item.system.rating;
        let masteries = item.system.masteries;
        let fullRating = RatingHelper.format(rating,masteries);
        let rune = item.system.rune ? tokenNameToHTML(item.system.rune) + ' ' : '';
        let name = item.name;

        let label = `${rune}${name} ${fullRating}`;

        // Benefits/consequences can't be rolled, send an info card message to chat
        if (itemType == 'benefit' || itemType == 'consequence') {
            fullRating = RatingHelper.format(rating,masteries,true);
            label = `${rune}${name} ${fullRating}`;
            ChatMessage.create({
                speaker: speaker,
                rollMode: rollMode,
                flavor: game.i18n.localize(`QUESTWORLDS.${itemType.capitalize()}`) + ": " + label,
                content: item.system.description ?? ''
            });
            return;
        }
        // Otherwise, create a roll and send a chat message from it.
        else {
            // Retrieve roll data.
            const rollData = this.getRollData();

            // prepare some form data
            const benefitsItems = this.actor.items.contents.filter(item => { return item.type == 'benefit' });
            const benefits = JSON.parse(JSON.stringify(benefitsItems));
            for (const key of Object.keys(benefitsItems)) {
                benefits[key]['variant'] = benefitsItems[key].variant;
            }

            if (embedId) {
                const embed = QuestWorldsItem.getEmbedById(this.system.embeds,embedId);
                // console.log("embed", embed);

                // if it's an info line, send an info card to chat
                if (embed.type == 'info') {
                    const info = game.i18n.localize('QUESTWORLDS.Info');
                    ChatMessage.create({
                        speaker: speaker,
                        rollMode: rollMode,
                        flavor: `[${info}] ${embed.name}`,
                        content: embed.description ?? ''
                    });
                    return;
                }
            


                rating = embed.rating;
                masteries = embed.masteries;
                name = embed.name;
                rune = embed.runes ? tokenMarkupToHTML(embed.runes) + ' ' : '';
                if (embed.type == 'breakout') {
                    // rating is just a bonus, so add to the parent (assumed a keyword)
                    let parent = QuestWorldsItem.getEmbedById(this.system.embeds,embed.parentId);
                    if(!parent) parent = item.system; // it's a breakout directly from an Item, not embed
                    ({rating, masteries} = RatingHelper.add(
                        {rating: rating, masteries: masteries},
                        {rating: parent?.rating, masteries: parent?.masteries})
                    );
                    // console.log(RatingHelper.format(rating,masteries,true));
                }
                fullRating = RatingHelper.format(rating,masteries);

                label = `${rune}${name} ${fullRating}`;
            } else {
                rating = rollData.item.rating;
                masteries = rollData.item.masteries;
            }


            // gate starting the chat contest card behind a confirmation dialog
            let gatecheckPassed = false;
            const message = '<div style="text-align: center; margin: 0 0 1em;">'
            + `<p style="font-size: 1.1em"><strong>${label}</strong></p>`
            + "<hr>"
            +`<p>${game.i18n.localize('QUESTWORLDS.dialog.StartContestMessage')}</p>`
            + "</div>"
            await Dialog.confirm({
                title: game.i18n.localize("QUESTWORLDS.dialog.StartContestTitle"),
                content: message,
                yes: () => { gatecheckPassed = true },
                no:  () => { gatecheckPassed = false },
            });
            if (gatecheckPassed == false) return;


            // create the message first since we need the ID for the form
            const msg = await ChatMessage.create({
                speaker: speaker,
                // rollMode: 'gmroll',     // this is bugged in FVTT 0.8.x, reminder here for 0.9
                whisper: ChatMessage.getWhisperRecipients('gm'),    // current workaround
                flavor: game.i18n.localize('QUESTWORLDS.chatcontest.Tactic') +": " + label,
            });

            const formData = {
                chatId: msg.id,
                waitingForPlayer: true,
                readyToRoll: false,
                benefits: ( () => {
                    let remap = {};
                    for (const key of Object.keys(benefits)) {
                        remap[key] = {};
                        remap[key].id = benefits[key]._id;
                        remap[key].name = benefits[key].name;
                        remap[key].variant = benefits[key].variant;
                        remap[key].system = {
                            rating: benefits[key].system.rating,
                            masteries: benefits[key].system.masteries,
                        }
                        remap[key].checked = false;
                    }
                    return remap;
                }
                )(),
                benefitsCount: benefits.length,
                tactic: {rating: rating, masteries: masteries},
                total: {rating: rating, masteries: masteries},
                resistance: RatingHelper.getDifficulty(),
                baseDifficulty: RatingHelper.getDifficulty(),
                hp: rollData.points.hero,
                difficultyLevel: RatingHelper.getBaseDifficultyLevel(),
                settings: {
                    difficultyLevels: ( () => {
                        let result = {};
                        let list = RatingHelper.getDifficultyTable();
                        for (const key of Object.keys(list)) {
                            const name = list[key].name;
                            let mod = RatingHelper.format(list[key].modifier, 0,true,false);
                            mod = mod ? mod : '+0';
                            const min = list[key]?.min ? list[key].min : null;
                            const label = min ? `${name} (${mod} or ${min})` : `${name} (${mod})`;
                            result[key] = label;
                        }
                        return result;
                    })(),
                }
            }

            await msg.setFlag('questworlds','formData',formData);
            const content = await renderTemplate("systems/questworlds/templates/chat/chat-contest.html",formData);
            await msg.update({'content': content});
            ui.chat.scrollBottom();
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
        const embeds = item.system.embeds;
        const newEmbedType = a.dataset.type;

        const newBreakout = new EmbeddedAbility(newEmbedType,parentId);
        const breakoutId = newBreakout.id;
        
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

        // update the item data & then show the edit dialog
        item.update({'system.embeds': embeds})
            .then(() => { _breakoutDialog(item,breakoutId) });



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
        const ability = item.system;

        /** removeFromTree() is (c) Rodrigo Rodrigues, licensed CC BY-SA 4.0 at https://stackoverflow.com/a/55083533/ */
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

        Dialog.confirm({
            title: event.currentTarget.title,
            content: "<p><strong>" + game.i18n.localize('AreYouSure') + "</strong></p>",
            yes: () => {
                const breakout = `#${breakout_id}`;
                doItemTween(breakout,'delete', () => {
                    item.update({'system.embeds': prunedAbility.embeds})
                });
            },
            no: () => {},
            defaultYes: false
        });

    } // deleteEmbed()

    /**
     * Edit an embed
     * @param {MouseEvent} event    The originating left click event
     * @param {Object} item         The item object.
     */
    static async editEmbed(event, item) {

        const a = event.currentTarget;
        const breakout_id = a.dataset.breakoutId;

        _breakoutDialog(item,breakout_id);
        
    } // editEmbed()

    /**
     * Find and return an embedded breakout by id from an Item.
     * Returns null if not found.
     * @param {Array} embeds        // the Item
     * @param {String} id           // the id to find
     */
    static getEmbedById(embeds, id) {

        /**
         * flatten() is (c) Thomas, licensed CC BY-SA 3.0 at https://stackoverflow.com/a/35272973/
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

/**
 * 
 * @param {QuestWorldsItem} item The item that contains the embed to edit
 * @param {String} breakout_id The ID of the embed to edit
 */
async function _breakoutDialog(item,breakout_id) {

    const breakoutData = QuestWorldsItem.getEmbedById(item.system.embeds, breakout_id);
    const context = foundry.utils.deepClone(breakoutData);
    context.settings = {
        useRunes: game.settings.get('questworlds','useRunes'),
    }
    context.cssClass = 'edit-ability';
    
    const dialogTitle = 'QUESTWORLDS.dialog.Editing' + context.type.capitalize();
    const dialogContent = await renderTemplate("systems/questworlds/templates/dialog/breakout-edit.html", context);

    new Dialog({
        title: game.i18n.localize(dialogTitle),
        content: dialogContent,
        buttons: {
            saveButton: {
                label: game.i18n.localize('QUESTWORLDS.dialog.Save'),
                icon: `<i class="fas fa-save"></i>`,
                callback: (html) => _updateBreakout(html,item,breakout_id),
            },
            cancelButton: {
                label: game.i18n.localize('QUESTWORLDS.dialog.Cancel'),
                icon: `<i class="fas fa-times"></i>`
            },
        },
        default: "saveButton"
    }).render(true);

    function _updateBreakout(html,item,breakout_id) {
        const embeds = item.system.embeds;
    
        // get new info from the dialog
        const newRunes = html.find('input[name="runes"]').val();
        const newName = html.find('input[name="name"]').val();
        // rationalize the rating and masteries
        const newRating = RatingHelper.rationalize({
            rating: Number.parseInt(html.find('input[name="rating"]').val()) || 0,
            masteries: Number.parseInt(html.find('input[name="masteries"]').val()) || 0,
        });
    
        // extract a reference to the right breakout
        const targetEmbed = QuestWorldsItem.getEmbedById(embeds, breakout_id);
    
        // update data in embeds via the reference
        targetEmbed.runes = newRunes;
        targetEmbed.name = newName;
        targetEmbed.rating = newRating.rating;
        targetEmbed.masteries = newRating.masteries;
    
        //update the item data with copy contents
        item.update({'system.embeds': embeds});
    
    } // _updateBreakout()

} // _breakoutDialog