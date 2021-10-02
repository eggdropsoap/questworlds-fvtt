import { tokenNameToHTML } from "./rune-helpers.mjs";

export class RatingHelper {

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

    static split(total,preserveZero=false) {
        const sign = total < 0 ? -1 : 1;
        const t = Math.abs(total);
        if (t==0) return [0,0];     // avoids returning [20,0]
        else if (preserveZero)
        return [                    // rolls over only on exactly t/20 (rescues bare +M/-M modifiers)
            (t % 20) * sign,
            t/20 > 1 ? Math.floor((t - 1) /20) : 0
        ];
        else return [               // the most typical cases
            (t % 20 || 20) * sign,
            t/20 > 1 ? Math.floor((t - 1) /20) : 0
        ]
    }

    static merge(r,m/*,preserveZero=false*/) {
        const sign = r < 0 || m < 0 ? -1 : 1;
        // console.log('sign', sign);
        // console.log('merge',(Math.abs(r) + Math.abs(m*20)) * sign);
        // if (preserveZero && r == 0) return Math.abs(m*20) * sign;
        // else
        return (Math.abs(r) + Math.abs(m*20)) * sign;
    }

    static rationalize(r,m) {
        return this.split(this.merge(r,m,true));
    }
  
    static format(rating,masteries,isBonus) {
        let mastery_symbol = 'M';
        if (game.settings.get('questworlds','useRunes')) {
            mastery_symbol = tokenNameToHTML('mastery');
        }
        const sign = (rating < 0 || masteries < 0) ? "-" : isBonus ? "+" : "";
        return(`${sign}${rating}${mastery_symbol}${masteries}`);
    }
}
