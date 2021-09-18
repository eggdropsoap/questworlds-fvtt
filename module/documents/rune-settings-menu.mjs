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
        
        /* set defaults in case of no settings data */
        /* TODO: revise so that new entries added to defaultRunes merge in gracefully */
        if (!settingData.hasOwnProperty('runes')) {
            console.log("No default runes set up");
            // console.log(defaultRunes);
            // construct the settings object from the default runes set
            settingData.runes = {};
            for (let value of defaultRunes.sort() ) {
                settingData.runes[value] = {
                    name: 'QUESTWORLDS.runes.' + value,
                    token: value,
                    fonts: {}
                }
            }
        }

        if (!settingData.hasOwnProperty('customrunes')) settingData.customrunes = {};
        // if (!settingData.hasOwnProperty('fonts')) settingData.fonts = [];
        // vvv stub for development testing! remove! vvv
        if (!settingData.hasOwnProperty('fonts')) settingData.fonts = [ { name: "Hello", file: "" }, { name: "Goodbye", file: "" } ];

        /* once we have settings data or default data, normalize data for the form */

        // iterate over settingData.runes to pad out the .fonts array
        // to match the length of settingData.fonts
        const masterFontCount = settingData.fonts.length || 0; // behave well even if .fonts undefined
        if (masterFontCount > 0) {
            for (var runeProp in settingData.runes) {
                // check length of .fonts and pad out to length of master list of fonts
                let rune = settingData.runes[runeProp];
                let localFontCount = Object.keys(rune.fonts).length;
                console.log(rune);
                console.log(localFontCount);
                console.log(masterFontCount);
                if (localFontCount < masterFontCount) {
                    for (let i = localFontCount; i < masterFontCount; i++) {
                        rune.fonts[`${i}`] = '';    // construct dictionary, not array (for form compatibility)
                    }
                }
                // console.log(rune);
            }
        }
        
        // console.log(settingData);
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

        game.settings.set('questworlds', 'runeFontSettings', data).then(() => {this.render(true)});

    }

    // /** @override */
    // async _onSubmit(event, updateData, preventClose, preventRender) {
    //     console.log('_onSumbit() fired');
    //     console.log(this);
    //     return super._onSubmit(event, updateData, preventClose, false);
    // }

}