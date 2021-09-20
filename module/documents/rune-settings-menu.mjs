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
        console.log("getData() fired");

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
        // settingData.fonts = [ { name: "Hello", file: "" } ];
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


        // console.log(this.filepickers);
        console.log(settingData);   // DEBUG: for inspecting data structure sent to form
        return settingData;
    }

    _updateObject(event, formData) {
        console.log("_updateObject() fired")
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
            // add the properties to each 'runeFontSettings'.runes[entry]
            rune.render = {
                class: fontname,
                text: charvalue,
            }
            // console.log(rune);
        }

        /* handle fonts inputs */

        // if no font data from form, make sure .fonts exists
        if (!data.hasOwnProperty('fonts')) data.fonts = [];

        // if font data from form, it'll be an object, so reserialize as array
        console.log("It's an Object. Converting to array");
        data.fonts = Object.values(data.fonts);
        // console.log(Object.values(data.fonts));

        // if a new font file was uploaded or selected, process and push into .fonts array
        if (data.newfont.url) {
            console.log("New font detected");
            console.log(data.newfont);
            let newFont = data.newfont;
            newFont.name = newFont.url;

            data.fonts.push(newFont);
            delete data.newfont;
        }

        console.log(data);

        game.settings.set('questworlds', 'runeFontSettings', data).then(() => {this.render(true)});

    }

    /** @override */
    activateListeners(html) {
        super.activateListeners(html)

        for ( let fpbutton of html.find('button.font-file-picker') ) {
            fpbutton.onclick = event => {
                event.preventDefault();

                const options = this._getFilePickerOptions(event);
                // console.log("FP options");
                options.callback = () => {this.submit();}
                // console.log(options);
                const fp = new FontFilePicker(options);
                this.filepickers.push(fp);

                fp.browse();
                // console.log(fp);
                // console.log(this);
                // TODO: start saving data and confirm newfont.url is targeted right

            };
        }
    }

}


/* support font file extensions */
class FontFilePicker extends FilePicker {
    constructor(options={}) {
        super(options);
        const FONT_FILE_EXTENSIONS = [
            "ttf",
            "otf",
        ]
        // TODO: Actually use the font file extensions constant
        this.extensions = [".ttf"];
    }

}