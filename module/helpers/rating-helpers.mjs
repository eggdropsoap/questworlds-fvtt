import { tokenNameToHTML,tokenMarkupToHTML } from "./rune-helpers.mjs";

export class RatingHelper {

    /**
     * Adds two xMy format ability ratings together, returning a xMy result as array[x,y].
     * The result is rationalized for a rating ±[1-20] and rollover incrementing masteries.
     * Signs of inputs is accounted for, final sign being returned on the ratings portion.
     * @param {Number} rating1
     * @param {Number} mastery1 
     * @param {Number} rating2 
     * @param {Number} mastery2 
     * @returns {Array} [total_rating,total_masteries]
     */
    static add(rating1, mastery1, rating2, mastery2) {
        console.log(rating1,'M',mastery1,'+',rating2,'M',mastery2);

        // let ratingInitial = rating1 + rating2;
        // let ratingFinal = ratingInitial % 20 || 20;
        // let extraMastery = ratingInitial/20 > 1 ? Math.floor((ratingInitial - 1) /20) : 0;
        // console.log('rating',ratingInitial);
        // console.log('extraMastery', extraMastery);
        // // console.log('masteries',mastery1,mastery2);
        // let masteryFinal = mastery1 + mastery2 + extraMastery;
    
        // console.log(this.format(ratingFinal,masteryFinal));

        // return [ratingFinal,masteryFinal];

        if ( [rating1,mastery1,rating2,mastery2]
            .some(e => { return e === undefined || e === NaN || e === null })
        ) //return [null, null];
        throw new Error(`Can't add ${rating1}M${mastery1} and ${rating2}M${mastery2}`); 

        const a = this.merge(rating1,mastery1);
        // console.log('a',a);
        const b = this.merge(rating2,mastery2);
        // console.log('b',b);
        // console.log('a + b', a + b);
        return this.split(a+b);
    }

    /**
     * Takes a number and returns an array[x,y] of its xMy equivalent.
     * Sign is preserved. Returned sign is on the rating (x), unless
     * preserveZero true & rating is zero, then sign is on the mastery (y).
     * @param {Number} total 
     * @param {Boolean} preserveZero // Preserve zero ratings? e.g. +/-20 => +/-(0)M1
     * @returns {Array} // [rating,mastery]
     */
    static split(total,preserveZero=false) {
        const sign = total < 0 ? -1 : 1;
        const t = Math.abs(total);
        if (t==0)                   // avoids returning [20,0]
            return [0,0];
        else if (preserveZero) {    // rolls over only on exactly t/20 (rescues bare +My/-My modifiers)
            const r = (t % 20);
            const m = Math.floor(t /20);
            return r == 0 ? [r, m*sign] : [r*sign, m];
        }
        else                        // the most typical cases
            return [                
                (t % 20 || 20) * sign,
                Math.floor((t - 1) /20)
            ];
    }

    /**
     * Takes a rating and masteries and merges them into a single-number equivalent.
     * Sign of result is negative if either portion is negative.
     * @param {Number} r rating portion
     * @param {Number} m masteries portion
     * @returns {Number} result
     */
    static merge(r,m/*,preserveZero=false*/) {
        const sign = r < 0 || m < 0 ? -1 : 1;
        // console.log('sign', sign);
        // console.log('merge',(Math.abs(r) + Math.abs(m*20)) * sign);
        // if (preserveZero && r == 0) return Math.abs(m*20) * sign;
        // else
        return (Math.abs(r) + Math.abs(m*20)) * sign;
    }

    /**
     * Rebalances a xMy rating so that x is [1-20], remainders incrementing the masteries.
     * If is_modifier is true, rebalances so x is [0-19], allowing for returning -M, +M2, etc.
     * Sign result is negative if either portion is negative. Sign is on the returend rating,
     * unless is_modifer true & rating is zero, then sign is on the returned mastery.
     * @param r rating portion
     * @param m mastery portion
     * @param is_modifier Is this a modifier?
     * @returns array [rating,mastery] rationalized
     */
    static rationalize(r,m,is_modifier=false) {
        return this.split(this.merge(r,m),is_modifier);
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
    static format(rating,masteries,is_modifier) {
        const minusChar = "\u2212"; // unicode minus symbol (wider than hyphen to match '+' width)

        let outStr = '';
        let mastery_symbol = 'M';
        
        const useRunes = game.settings.get("questworlds","useRunes");
      
        if (useRunes) {
          mastery_symbol = tokenMarkupToHTML('[[mastery]]');
        }
      
        // if negative, put the minus on the front
        if (this.merge(rating,masteries) < 0) {
          outStr += minusChar;
        }
        // output basic rating part if it's non-zero
        if (Math.abs(rating) > 0) {
          // if it's positive and a modifier, prefix '+' first
          if (this.merge(rating,masteries) > 0 && is_modifier) {
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
      // TODO: replace this with a lookup table (TODO: that can be changed by config options)
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
}
