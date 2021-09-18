import { defaultRunes } from "../helpers/default-runes.mjs";

/**
 * For more information about FormApplications, see:
 * https://foundryvtt.wiki/en/development/guides/understanding-form-applications
 */
export class RuneFontsSettingsMenuClass extends FormApplication {
    constructor(object, options = {}) {
        super(object, options);
    }

    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            classes: ['form'],
            popOut: true,
            template: `systems/questworlds/templates/forms/rune-fonts-settings-menu.html`,
            id: 'rune-fonts-settings-menu',
            title: 'Rune Fonts Settings',
            closeOnSubmit: false,
            submitOnClose: true,
            submitOnChange: true,
            resizable: true,
        });
    }

    getData() {
        const settingData = game.settings.get('questworlds', 'runeFontSettings');
        // const settingData = {};   // DEBUG: Clear settings. If paired with .set(), wipes stored settings too!
        
        /* set defaults in case of no settings data, or new defaults */

        if (!settingData.hasOwnProperty('customrunes')) settingData.customrunes = {};

        if (!settingData.hasOwnProperty('runes')) settingData.runes = {};
        // let settingsRunesCount = settingData.runes ? Object.keys(settingData.runes).length : 0;
        let settingsRunesCount = Object.keys(settingData.runes).length;
        let defaultRunesCount = defaultRunes.length;
        if (settingsRunesCount < defaultRunesCount) {
            console.log(`defaultRunes contains ${defaultRunesCount - settingsRunesCount} new Runes. Merging…`);
            // console.log(defaultRunes);
            // construct the settings object, merging from the default runes set
            for (let value of defaultRunes ) {
                settingData.runes[value] = {
                // let temp = {
                    ...{
                        name: 'QUESTWORLDS.runes.' + value,
                        token: value,
                        fonts: {}
                    },
                    ...settingData.runes[value]
                }
                // console.log(settingData.runes[value]);
            }
        }

        if (!settingData.hasOwnProperty('fonts')) settingData.fonts = [];
        // vvv stub for development testing! remove! vvv
        // settingData.fonts = [];
        settingData.fonts = [ { name: "Hello", file: "" } ];
        // settingData.fonts = [ { name: "Hello", file: "" }, { name: "Goodbye", file: "" } ];

        /* once we have settings data or default data or both merged, normalize data for the form */

        // iterate over settingData.runes to pad out the individual runes' .fonts arrays to
        // match the number of fonts known in settingData.fonts
        const masterFontCount = settingData.fonts.length || 0; // behave well even if .fonts undefined
        if (masterFontCount > 0) {
            for (var runeProp in settingData.runes) {
                let rune = settingData.runes[runeProp];
                let localFontCount = Object.keys(rune.fonts).length;
                // check length of per-rune fonts data and pad out to length of master list of fonts
                if (localFontCount < masterFontCount) {
                    for (let i = localFontCount; i < masterFontCount; i++) {
                        rune.fonts[`${i}`] = '';    // construct as dictionary since form uses @key
                    }
                }
                // console.log(rune);
            }
        }
        
        // add convenience data to the context
        settingData.fontCount = masterFontCount;

        console.log(settingData);   // DEBUG: for inspecting data structure sent to form
        return settingData;
    }

    _updateObject(event, formData) {
        // console.log("_updateObject() fired")
        const data = expandObject(formData);
        // console.log(data);
        
        // iterate the built-in runes to add convenience properties for font & char
        for (var runeKey in data.runes) {
            let rune = data.runes[runeKey];
            // console.log(rune.token);
            let fontname;
            let charvalue;
            for (var fontKey in rune.fonts) {
                let char = rune.fonts[fontKey];
                if (char) {
                    fontname = `rune-font${fontKey}`;
                    charvalue = char;
                    break;  // we only want the first hit
                }
            }
            rune.render = {
                class: fontname,
                text: charvalue,
            }
            // console.log(rune);
        }
        // console.log(data);

        // game.settings.set('questworlds', 'runeFontSettings', data).then(() => {this.render(true)});

    }

    // /** @override */
    // async _onSubmit(event, updateData, preventClose, preventRender) {
    //     console.log('_onSumbit() fired');
    //     console.log(this);
    //     return super._onSubmit(event, updateData, preventClose, false);
    // }

}