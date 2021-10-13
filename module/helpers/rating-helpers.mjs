import { tokenNameToHTML,tokenMarkupToHTML } from "./rune-helpers.mjs";

export class RatingHelper {

    /**
     * Sums two simple ratings objects
     * @param {Object} obj1     First {rating,masteries} object to add
     * @param {Object} obj2     Second {rating,masteries} object to add
     * @returns {Object}        Sum of 1st and 2nd objects, rationalized
     */
    static add(obj1,obj2) {
        const rating = this._add(obj1.rating,obj1.masteries,obj2.rating,obj2.masteries);
        return rating;
    }

    /**
     * Adds two xMy format ability ratings together, returning a xMy result as array[x,y].
     * The result is rationalized for a rating ±[1-20] and rollover incrementing masteries.
     * Signs of inputs is accounted for, final sign being returned on the ratings portion.
     * @param {Number} rating1
     * @param {Number} mastery1 
     * @param {Number} rating2 
     * @param {Number} mastery2 
     * @returns {Object} {rating,masteries}
     */
    static _add(rating1, mastery1, rating2, mastery2) {
        if ( [rating1,mastery1,rating2,mastery2]
            .some(e => { return e === undefined || e === NaN || e === null })
        ) //return [null, null];
        throw new Error(`Can't add ${rating1}M${mastery1} and ${rating2}M${mastery2}`); 

        const a = this.merge({rating: rating1,masteries: mastery1});
        // console.log('a',a);
        const b = this.merge({rating: rating2,masteries: mastery2});
        // console.log('b',b);
        // console.log('a + b', a + b);
        return this.split(a+b);
    }

    /**
     * Takes a number and returns an array[x,y] of its xMy equivalent.
     * Sign is preserved. Returned sign is on the rating (x), unless
     * preserveZero true & rating is zero, then sign is on the mastery (y).
     * @param {Number} total 
     * @param {Boolean} preserveZero    Preserve zero ratings? e.g. +/-20 => +/-(0)M1
     * @returns {Object}                {rating,masteries}
     */
    static split(total,preserveZero=false) {
        const sign = total < 0 ? -1 : 1;
        const t = Math.abs(total);
        if (t==0)                   // avoids returning [20,0]
            return {rating:0,masteries:0};
        else if (preserveZero) {    // rolls over only on exactly t/20 (rescues bare +My/-My modifiers)
            const r = (t % 20);
            const m = Math.floor(t /20);
            return r == 0 ? {
                rating: r,
                masteries: m*sign
            } : {
                rating: r*sign,
                masteries: m
            };
        }
        else                        // the most typical cases
            return {
                rating: (t % 20 || 20) * sign,
                masteries: Math.floor((t - 1) /20)
            };
    }

    /**
     * Takes a rating object merges the .rating and .masteries into a single-number equivalent.
     * Sign of result is negative if either portion is negative.
     * Accepts partial objects by assuming the other is 0.
     * If neither property is defined, returns undefined.
     * @param {Object} rating   {rating,masteries} object
     * @returns {Number}        The result
     */
    static merge({rating,masteries}/*,preserveZero=false*/) {
        if (rating === undefined && masteries === undefined) return undefined;
        const r = rating || 0;
        const m = masteries || 0;
        const sign = r < 0 || m < 0 ? -1 : 1;
        return (Math.abs(r) + Math.abs(m*20)) * sign;
    }

    /**
     * Rebalances a xMy rating so that x is [1-20], remainders incrementing the masteries.
     * If is_modifier is true, rebalances so x is [0-19], allowing for returning -M, +M2, etc.
     * Sign result is negative if either portion is negative. Sign is on the returend rating,
     * unless is_modifer true & rating is zero, then sign is on the returned mastery.
     * @param {Object} ratingObj        {rating,masteries} Object to rationalize
     * @param {Boolean} is_modifier     Is this a modifier?
     * @returns {Object}                {rating,mastery} rationalized
     */
    static rationalize(ratingObj={rating,masteries},is_modifier=false) {
        return this.split(this.merge(ratingObj),is_modifier);
    }
  
    /**
     * Return HTML of formatted xMy ability rating.
     * The input is rationalized so x is in [1-20], or [0-19] if is_modifier,
     * with masteries (y) appropriately ajusted for x's out of range.
     * If is_modifier, a + will be prefixed for positive ability ratings.
     * @param {Number} rating       // rating (the x in xMy)
     * @param {Number} masteries    // masteries (the y in xMy)
     * @param {Boolean} is_modifier // is this a bonus/malus?
     * @returns {String}
     */
    static format(rating,masteries,is_modifier=false,useRunes=null) {
        const minusChar = "\u2212"; // unicode minus symbol (wider than hyphen to match '+' width)

        ({rating,masteries} = RatingHelper.rationalize({rating:rating,masteries:masteries},is_modifier));

        let outStr = '';
        let mastery_symbol = 'M';
        is_modifier = is_modifier ? true : false;
        
        useRunes = useRunes != null ? useRunes : game.settings.get("questworlds","useRunes");
      
        if (useRunes) {
            mastery_symbol = tokenMarkupToHTML('[[mastery]]');
        }
      
        // if negative, put the minus on the front
        if (this.merge({rating:rating,masteries:masteries}) < 0) {
            outStr += minusChar;
        }
        // output basic rating part if it's non-zero
        if (Math.abs(rating) > 0) {
            // if it's positive and a modifier, prefix '+' first
            if (this.merge({rating:rating,masteries:masteries}) > 0 && is_modifier) {
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

        return outStr;
    }

    static legalEmbedTypes = [
        'ability',
        'breakout',
        'keyword',
        'info'
    ];
    
    static defaultRating(type) {
        // TODO: replace this with a lookup table (TODO: which can be changed by config options)
        switch(type) {
            case 'ability':
            case 'keyword':
                // new abilities and keywords default to 15M0
                return 15;
                break;
            case 'benefit':
            case 'breakout':
                // new breakouts and benefits default to +5
                return 5;
                break;
            case 'info':
                // info doesn't need a rating
                return 0;
                break;
            default:
                return 0;  // should never happen since not in legalEmbedTypes or template.json items
        }
    
    }

    static DIFFICULTY_LEVELS =      // TODO: get this from a settings table // this is the HQG table
    {
        'nearly_impossible': {name: 'Nearly Impossible', modifier: 40 },
        'very_high': {name: 'Very High', modifier: 20 },
        'high': {name: 'High', modifier: 6 },
        'moderate': {name: 'Moderate', modifier: 0 },
        'low': {name: 'Low', modifier: -6 },
        'very_low': {name: 'Very Low', modifier: -20, min: 6 },
    }
    static DIFFICULTY_BASE = 'moderate';

    static BASE_RATING = {rating: 13, masteries: 0};    // HQG base difficulty

    static getDifficulty(level='moderate') {
        const baseRating = this.BASE_RATING; // TODO: get this from a UI control (itself set by setting?)
        const ratingsTable = this.DIFFICULTY_LEVELS;
        let rating;
        if (ratingsTable.hasOwnProperty(level)) {
            // rating is base difficulty plus modifier...
            rating = RatingHelper.add(baseRating,{rating: ratingsTable[level].modifier, masteries: 0})
            if (ratingsTable[level].hasOwnProperty('min')) {
                // ... unless there's a minimum and the mod made it too low
                const min = ratingsTable[level].min;
                rating = RatingHelper.merge(rating) > min ? rating : {rating: min,masteries: 0};
            }
        } else {
            // ... unless no difficulty level is specified at all
            rating = baseRating;
        }
        return rating;
    }
}
