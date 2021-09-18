/**
 * An object with a property for each rune, used to pre-load the Rune Settings submenu.
 * Organized by rune types just for maintainability reasons.
 * 
 * NOTE: Should not be referenced directly for a list of runes, since may be incomplete.
 * Read the runes settings object's .list[] property instead.
 */

export const defaultRunes = [
    /** MAJOR RUNES **/

    /* Elemental Runes */
    "air",
    "darkness",
    "earth",
    "fire",
    "water",
    "moon",
    /* Power Runes */
    "stasis",
    "movement",
    "life",
    "death",
    "truth",
    "illusion",
    "harmony",
    "disorder",
    /* Form Runes */
    "man",
    "plant",
    "beast",
    "spirit",
    "dragonewt",
    "chaos",
    /* Condition Runes */       // minus duplicates: moon, chaos
    "mastery",
    "communication",
    "light",
    "law",
    "fate",
    "luck",
    "infinity",
    "undead",
    "dragon",
    "magic",
    "eternal_battle",
    "power",

    /** MINOR RUNES **/

    
    /* Personal Runes */
    "yinkin",
    "lightbringers",
    "shargash",
    "heler",
    "barntar",
    "sartar",

    /* Moon Phases Runes */
    "dying_moon",
    "crescent_go",
    "full_half_moon",
    "full_moon",
    "empty_half_moon",
    "crescent_come",
    "black_moon",

    /* Other */
    "horse",
    "bear",
    "god_world",
    "hell",
    "heat",
    "cold",

]