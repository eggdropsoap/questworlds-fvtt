import { RuneFontsSettingsMenuClass } from "../documents/rune-settings-menu.mjs";
import { RatingHelper } from "./rating-helpers.mjs";

export const registerSystemSettings = function() {

    /**
     * Whether to enable suport for runes
     */
    game.settings.register("questworlds", "useRunes", {
        name: "SETTINGS.useRunesN",
        hint: "SETTINGS.useRunesL",
        scope: "world",
        config: true,
        type: Boolean,
        default: false,
    });

    /**
     * What to call a "Sidekick" in the UI / sheets
     */
    game.settings.register("questworlds", "sidekickName", {
        name: "SETTINGS.sidekickNameN",
        hint: "SETTINGS.sidekickNameL",
        scope: "world",
        config: true,
        type: String,
        choices: {
            "Sidekick": "QUESTWORLDS.Sidekick",
            "Companion": "QUESTWORLDS.Companion"
        },
        default: "sidekick",
    /*     onChange: value => { // A callback function which triggers when the setting is changed
            console.log(value);
        } */
    });

    /**
     * Whether Keywords have breakouts or sub-abilities
     */
    game.settings.register("questworlds", "keywordBreakout", {
        name: "SETTINGS.keywordBreakoutN",
        hint: "SETTINGS.keywordBreakoutL",
        scope: "world",
        config: true,
        type: String,
        choices: {
            "breakout": "QUESTWORLDS.keywordUmbrellaOptionName",
            "ability": "QUESTWORLDS.keywordPackageOptionName"
        },
        default: "breakout",
    /*     onChange: value => { // A callback function which triggers when the setting is changed
            console.log(value);
        } */
    });

    /**
     * Whether to enable suport for runes
     */
    game.settings.register("questworlds", "useClassicOutcomes", {
        name: "SETTINGS.useClassicOutcomesN",
        hint: "SETTINGS.useClassicOutcomesL",
        scope: "world",
        config: true,
        type: Boolean,
        default: false,
    });
    
    /**
     * Current base difficulty. Starts at value set by difficultyTable.
     */
     game.settings.register("questworlds", "baseDifficulty", {
        name: "SETTINGS.baseDifficultyN",
        hint: "SETTINGS.baseDifficultyH",
        scope: "world",
        config: true,
        type: Number,
        default: 10,    // to initially match default choice of difficultyTable at world-creation
    });
        
    /**
     * What difficulty table to use. Also (re)sets the baseDifficulty setting!
     */
     game.settings.register("questworlds", "difficultyTable", {
        name: "SETTINGS.difficultyTableN",
        hint: "SETTINGS.difficultyTableH",
        scope: "world",
        config: true,
        type: String,
        choices: {
            "srd": "QuestWorlds SRD",
            "hqg": "HQG",
            "hq2": "HQ2",
        },
        default: "srd",
        onChange: choice => {
            const base = RatingHelper.merge(RatingHelper.DIFFICULTY_TABLES[choice].BASE_DIFFICULTY);
            setTimeout(() => {
                game.settings.set('questworlds','baseDifficulty',base);
            }, 300);
        },
    });


    /** ** ** ** ** ** ** ** ** ** ** ** **
     *   Rune fonts configuration menu    *
     ** ** ** ** ** ** ** ** ** ** ** ** **/

    game.settings.registerMenu("questworlds", "RuneFontSettingsMenu", {
        name: "SETTINGS.runeFontSettingsN",
        label: "SETTINGS.runeFontSettingsL", // The text label used in the button
        hint: "SETTINGS.runeFontSettingsH",
        icon: "fas fa-font",               // A Font Awesome icon used in the submenu button
        type: RuneFontsSettingsMenuClass,   // A FormApplication subclass
        restricted: true,                   // Restrict this submenu to gamemaster only?
        width: 620,           // initial width (doesn't work?)
    });
    
    game.settings.register('questworlds', 'runeFontSettings', {
        scope: 'world',     // "world" = sync to db, "client" = local storage
        config: false,      // we will use the menu above to edit this setting
        type: Object,
        default: {},        // can be used to set up the default structure
    });

}