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
        let outStr = '';
        let mastery_symbol = 'M';
    
        const rating = context.rating;
        const masteries = context.masteries;
        const abilityType = context.itemType || context.type;
        
        const useRunes = game.settings.get("questworlds","useRunes");
    
        if (useRunes) {
        mastery_symbol = tokenMarkupToHTML('[[mastery]]');
        }
    
        const minusChar = "\u2212"; // unicode minus symbol (wider than hyphen to match '+' width)
    
        // if either portion is negative, put the negative on the front
        if (rating < 0 || masteries < 0) {
        outStr += minusChar;
        }
        // output basic rating part if it's non-zero
        if (Math.abs(rating) > 0) {
        // if it's positive and a benefit/consequence or breakout, prefix '+' first
        if (rating > 0 && (abilityType == 'benefit' || abilityType == 'breakout')) {
            outStr += "+";
        }
        // positive rating
        outStr += Math.abs(rating);
        }
        // when rating is zero and there are positive Ms, add a + for "+M"
        if (rating == 0 && masteries > 0) {
        outStr += "+";
        }
    
        // Master symbol with no number if 1, with number if > 1
        if (Math.abs(masteries) > 0) {
        outStr += mastery_symbol;
        }
        if (Math.abs(masteries) > 1) {
        outStr += Math.abs(masteries);
        }
    
        return new Handlebars.SafeString(outStr);
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