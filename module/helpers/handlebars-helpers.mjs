import { RatingHelper } from "./rating-helpers.mjs";
import { tokenMarkupToHTML } from "./rune-helpers.mjs";


/* -------------------------------------------- */
/*  Handlebars Helpers                          */
/* -------------------------------------------- */

export function registerHandlebarsHelpers() {
    
    // If you need to add Handlebars helpers, here are a few useful examples:
    Handlebars.registerHelper('concat', function() {
        var outStr = '';
        for (var arg in arguments) {
        if (typeof arguments[arg] != 'object') {
            outStr += arguments[arg];
        }
        }
        return outStr;
    });
    
    Handlebars.registerHelper('toLowerCase', function(str) {
        return str.toLowerCase();
    });
    
    Handlebars.registerHelper('mastery', function(str){
        let mastery_symbol = 'M';
    
        if (game.settings.get("questworlds","useRunes")) {
        mastery_symbol = tokenMarkupToHTML('[[mastery]]');
        }
        return new Handlebars.SafeString(mastery_symbol);
    });
    
    Handlebars.registerHelper('fullRating', function(context) {
    
        const rating = context.rating;
        const masteries = context.masteries;
        const abilityType = context.itemType || context.type;
        const is_modifier = (abilityType == 'benefit' || abilityType == 'breakout');
    
        return new Handlebars.SafeString(
            RatingHelper.format(rating,masteries,is_modifier)
        );
    });

    Handlebars.registerHelper('formatRating', function(rating, masteries, options) {
        let is_modifier = options ? options.hash.modifier ? options.hash.modifier : null : null;
        is_modifier = is_modifier == 'true' || is_modifier == '1';
        return new Handlebars.SafeString(
            RatingHelper.format(rating,masteries,is_modifier)
        );
    });

    Handlebars.registerHelper('plural', function(num, singular, plural) {
        let numnum = window['Number'](num);
        return window['Number'](num) == 1 ? singular : plural
    });
    
    Handlebars.registerHelper('runes', function(tokens) {
        let useRunes = game.settings.get('questworlds','useRunes');
        if (!useRunes || !tokens) return '';
        else return new Handlebars.SafeString(tokenMarkupToHTML(tokens));
    });
    
    Handlebars.registerHelper('masterySymbol', () => {
        let useRunes = game.settings.get('questworlds','useRunes');
        if (useRunes) return new Handlebars.SafeString(tokenMarkupToHTML('[[mastery]]'));
        else return 'M';
    });
    
    Handlebars.registerHelper('rune', function(token) {
        let useRunes = game.settings.get('questworlds','useRunes');
    
        // empty field, or not using runes anyway, don't render
        if (!useRunes || !token) {
        return '';
        }
        else {
        let runeFontSettings = game.settings.get('questworlds','runeFontSettings');
        let spanClass = runeFontSettings.runes[token]?.render.class;
        let spanTitle = game.i18n.localize(runeFontSettings.runes[token]?.name);
        let spanText = runeFontSettings.runes[token]?.render.text;
    
        if (!spanText) return '';   // token not in the list of known rune tokens
    
        return new Handlebars.SafeString(`<span class="${spanClass}" title="${spanTitle}">${spanText}</span>`);
        }
    });
    
    Handlebars.registerHelper('whichItemPartial', function (itemType, variantType) {
        let template = "systems/questworlds/templates/actor/parts/actor-abilities-" + variantType + ".html";
        return template;
    });
    
    Handlebars.registerHelper('whichEmbedPartial', function (embedType) {
        let template = "systems/questworlds/templates/embeds/embed-" + embedType + ".html";
        return template;
    });
    
    Handlebars.registerHelper('iseq', function (value1,value2) {
        return value1 == value2;
    });
    
    Handlebars.registerHelper('isgt', function (value1,value2) {
        return value1 > value2;
    });

}