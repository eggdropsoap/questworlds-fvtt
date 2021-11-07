import { RuneFontsSettingsMenuClass } from "../documents/rune-settings-menu.mjs";
import { RatingHelper } from "./rating-helpers.mjs";

export const registerSystemSettings = function() {

    /**
     * Whether to enable suport for runes
     */
    game.settings.register("questworlds", "useRunes", {
        name: "QUESTWORLDS.SETTINGS.useRunesN",
        hint: "QUESTWORLDS.SETTINGS.useRunesL",
        scope: "world",
        config: true,
        type: Boolean,
        default: false,
    });

    /**
     * What to call a "Sidekick" in the UI / sheets
     */
    game.settings.register("questworlds", "sidekickName", {
        name: "QUESTWORLDS.SETTINGS.sidekickNameN",
        hint: "QUESTWORLDS.SETTINGS.sidekickNameL",
        scope: "world",
        config: true,
        type: String,
        choices: {
            "Sidekick": "QUESTWORLDS.Sidekick",
            "Companion": "QUESTWORLDS.Companion"
        },
        default: "sidekick",
    });

    /**
     * Whether Keywords have breakouts or sub-abilities
     */
    game.settings.register("questworlds", "keywordBreakout", {
        name: "QUESTWORLDS.SETTINGS.keywordBreakoutN",
        hint: "QUESTWORLDS.SETTINGS.keywordBreakoutL",
        scope: "world",
        config: true,
        type: String,
        choices: {
            "breakout": "QUESTWORLDS.keywordUmbrellaOptionName",
            "ability": "QUESTWORLDS.keywordPackageOptionName"
        },
        default: "breakout",
    });

    /**
     * Whether to use classic outcome names ("marginal victory", "major defeat", etc.)
     * or use "Degrees of Victory: {number}" (default)
     */
    game.settings.register("questworlds", "useClassicOutcomes", {
        name: "QUESTWORLDS.SETTINGS.useClassicOutcomesN",
        hint: "QUESTWORLDS.SETTINGS.useClassicOutcomesL",
        scope: "world",
        config: true,
        type: Boolean,
        default: false,
    });

    /**
     * Whether to use a shared pool of story points (default) or individual story points
     */
    game.settings.register("questworlds", "useIndividualStoryPoints", {
        name: "QUESTWORLDS.SETTINGS.useIndividualStoryPointsN",
        hint: "QUESTWORLDS.SETTINGS.useIndividualStoryPointsH",
        scope: "world",
        config: true,
        type: Boolean,
        default: false,
        onChange: value => {
            ui.players.render();
        },
    });

    /**
     * Hidden setting: Stores the current number of story points in the shared pool
     */
    game.settings.register("questworlds", "sharedStoryPointsPool", {
        name: "QUESTWORLDS.SETTINGS.useIndividualStoryPointsN",
        hint: "QUESTWORLDS.SETTINGS.useIndividualStoryPointsH",
        scope: "world",
        config: false,
        type: Number,
        default: 0,
        onChange: value => {
            ui.players.render();
        },
    });

    /**
     * What to call Story Points in the UI / sheets
     */
    game.settings.register("questworlds", "storyPointsName", {
        name: "QUESTWORLDS.SETTINGS.storyPointsNameN",
        hint: "QUESTWORLDS.SETTINGS.storyPointsNameH",
        scope: "world",
        config: true,
        type: String,
        choices: {
            "Story": "QUESTWORLDS.StoryPoints",
            "Hero": "QUESTWORLDS.HeroPoints"
        },
        default: "Story",
    });
    
    /**
     * Current base difficulty. Starts at value set by difficultyTable.
     */
     game.settings.register("questworlds", "baseDifficulty", {
        name: "QUESTWORLDS.SETTINGS.baseDifficultyN",
        hint: "QUESTWORLDS.SETTINGS.baseDifficultyH",
        scope: "world",
        config: true,
        type: Number,
        default: 10,    // to initially match default choice of difficultyTable at world-creation
    });

    /**
     * What difficulty table to use. Also (re)sets the baseDifficulty setting!
     */
     game.settings.register("questworlds", "difficultyTable", {
        name: "QUESTWORLDS.SETTINGS.difficultyTableN",
        hint: "QUESTWORLDS.SETTINGS.difficultyTableH",
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

    /**
     * How many XP earns one Advance
     */
    game.settings.register("questworlds", "XPtoAdvance",{
        name: "QUESTWORLDS.SETTINGS.XPtoAdvanceN",
        hint: "QUESTWORLDS.SETTINGS.XPtoAdvanceH",
        scope: "world",
        config: true,
        type: Number,
        choices: {
            10: "QUESTWORLDS.SETTINGS.NormalXP",
            5: "QUESTWORLDS.SETTINGS.HalfXP"
        },
        default: 10,
    });


    /** ** ** ** ** ** ** ** ** ** ** ** **
     *   Rune fonts configuration menu    *
     ** ** ** ** ** ** ** ** ** ** ** ** **/

    game.settings.registerMenu("questworlds", "RuneFontSettingsMenu", {
        name: "QUESTWORLDS.SETTINGS.runeFontSettingsN",
        label: "QUESTWORLDS.SETTINGS.runeFontSettingsL", // The text label used in the button
        hint: "QUESTWORLDS.SETTINGS.runeFontSettingsH",
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