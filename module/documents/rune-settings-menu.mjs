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
    });
}

getData() {
    const settingData = game.settings.get('questworlds', 'runeFontSettings');
    
    if (!settingData.hasOwnProperty('runes')) {
        console.log("No default runes set up");
        // console.log(defaultRunes);
        // construct the settings object from the default runes set
        settingData.runes = {};
        for (let value of defaultRunes.sort() ) {
            settingData.runes[value] = {
                name: 'QUESTWORLDS.runes.' + value,
                token: value,
                fonts: [
                    'g',
                    's',
                ]           }
        }
    }

    if (!settingData.hasOwnProperty('fonts')) settingData.fonts = [ { name: "Hello", file: "" }, { name: "Goodbye", file: "" } ];
    if (!settingData.hasOwnProperty('customrunes')) settingData.customrunes = {};
    
    
    // console.log(settingData);
    return settingData;
}

_updateObject(event, formData) {
    const data = expandObject(formData);
    console.log(data);
    // game.settings.set('questworlds', 'runeFontSettings', data);
    game.settings.set('questworlds', 'runeFontSettings', {});
}
}