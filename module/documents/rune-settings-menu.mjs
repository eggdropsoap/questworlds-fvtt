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

        /* handle fonts inputs */

        // if no font data from form, make sure .fonts exists
        if (!data.hasOwnProperty('fonts')) data.fonts = [];

        // if font data from form, it'll be an object, so reserialize as array
        // console.log("It's an Object. Converting to array");
        data.fonts = Object.values(data.fonts);
        // console.log(Object.values(data.fonts));

        // iterate the built-in runes to
        // - convert dictionary to array
        // - remove entries for fonts that have also be removed
        // then
        // - add calculated rendering properties for font & char
        for (var runeKey in data.runes) {
            let rune = data.runes[runeKey];
            // console.log(`--------${rune.token}--------`);
            // console.log(data.fonts);
            // convert obj to array
            
            // if no font data in the rune (maybe was wiped), create the property
            if (!rune.hasOwnProperty('fonts')) rune.fonts = [];

            rune.fonts = Object.values(rune.fonts);
            // remove entries for removed fonts
            rune.fonts = rune.fonts.filter((e, i) => { return data.fonts[i].url } );

            // console.log(rune.fonts);

            // create the render properties
            let fontclass;
            let charvalue;
            for (let fontIdx = 0; fontIdx < rune.fonts.length; fontIdx++) {
                let char = rune.fonts[fontIdx];
                if (char) {
                    // console.log(char);
                    // console.log(fontIdx);
                    fontclass = `rune-font${fontIdx}`;
                    charvalue = char;
                    break;  // we only want the first hit
                }
            }
            // add the properties (or defaults) to each 'runeFontSettings'.runes[entry]
            rune.render = {
                class: fontclass || "rune-token",
                text: charvalue || `[[${rune.token}]]`,
            }
            // console.log(rune.token);
            // console.log(rune.render);
            // break; // debug: only Air
        }

        // remove any deleted entries from the font list
        data.fonts = data.fonts.filter( (e) => { return e.url } );
        // console.log(data.fonts);


        // if a new font file was uploaded or selected, process and push into .fonts array
        if (data.newfont.url) {
            console.log("New font detected");
            // console.log(data.newfont);
            let newFont = data.newfont;

            // ignore new font if already in the list
            if (! data.fonts.map( (e) => {return e.url} ).includes(newFont.url) ) {
                newFont.name = fontUrlToName(newFont.url);
                // newFont.name = newFont.url.split('/').pop().split('.').slice(0,-1).join('.');
                // console.log(typeof newFont.name);
                // console.log(newFont.name);
                // // then remove underscores
                // newFont.name = newFont.name.replaceAll('_','');
                // console.log(newFont.name);
                data.fonts.push(newFont);
            };
        }
        // don't store formdata from the new font button
        delete data.newfont;

        console.log(data);

        game.settings.set('questworlds', 'runeFontSettings', data).then(() => {this.render(true)});
    }

    /** @override */
    activateListeners(html) {
        super.activateListeners(html)

        // the add font button opens a filepicker
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
            };
        }

        // TODO: add listener to buttons that remove fonts
        // delete font controls, leveraging empty URL input logic in _updateObject()
        html.find('.font-controls').on('click','a.font-control[data-action="delete"]', (event) => {
            let target = event.currentTarget.dataset.target;
            html.find(`input[name="${target}"]`).val('');
            this.submit();
            // TODO: gate behind an "are you sure?" dialog
        });
    }

}


/* FilePicker with support for font file extensions */
class FontFilePicker extends FilePicker {
    constructor(options={}) {
        super(options);
        const FONT_FILE_EXTENSIONS = [
            "ttf",
            "otf",
        ]
        this.extensions = FONT_FILE_EXTENSIONS.reduce((arr, t) => {
            arr.push(`.${t}`);
            arr.push(`.${t.toUpperCase()}`);
            return arr;
        }, []);
    }
}

function fontUrlToName(str) {
    // name = cut off directories
    let result = str.split('/').pop();

    //  remove extension of filename, respecting dots on rest of name
    result = result.split('.').slice(0,-1).join('.');

    // then remove underscores
    result = result.replaceAll('_','');

    // convert camelCase or CamelCase to Camel Case
    result = result.replace(/([a-z])([A-Z0-9])/g, "$1 $2");

    return result;
}