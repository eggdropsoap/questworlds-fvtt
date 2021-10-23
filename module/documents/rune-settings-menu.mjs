import { defaultRunes } from "../helpers/default-runes.mjs";
import { moveIndex } from "../utils.mjs";

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
        // console.log("getData() fired");

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
                    ...{
                        name: 'QUESTWORLDS.runes.' + value,
                        token: value,
                        fonts: {}
                    },
                    ...settingData.runes[value]
                }
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
            }
        }
        
        // add convenience data to the context
        settingData.fontCount = masterFontCount;

        // console.log(settingData);   // DEBUG: for inspecting data structure sent to form
        return settingData;
    }

    _updateObject(event, formData) {
        // console.log("_updateObject() fired")
        const data = expandObject(formData);
        // console.log(data);

        /* handle fonts inputs */

        // if no font data from form, make sure .fonts exists
        if (!data.hasOwnProperty('fonts')) data.fonts = [];

        // if font data from form, it'll be an object, so reserialize as array
        data.fonts = Object.values(data.fonts);

        // iterate the built-in runes to
        // - convert dictionary to array
        // - remove entries for fonts that have also be removed
        // - add calculated rendering properties for font & char
        for (const rune of Object.values(data.runes)) {
            // if no font data in the rune (maybe was wiped), create the property
            if (!rune.hasOwnProperty('fonts')) rune.fonts = [];

            // convert dictionary to array
            rune.fonts = Object.values(rune.fonts);
            // remove entries for removed fonts
            rune.fonts = rune.fonts.filter((e, i) => { return data.fonts[i].url } );
            // create the render properties
            rune.render = calculateRuneRenderObj(rune);
        }

        // remove any blanked entries from the font list
        data.fonts = data.fonts.filter( (e) => { return e.url } );

        // if a new font file was uploaded or selected, process and push into .fonts array
        if (data.newfont.url) {
            let newFont = data.newfont;

            // ignore new font if already in the list
            if (! data.fonts.map( (e) => {return e.url} ).includes(newFont.url) ) {
                newFont.name = fontUrlToName(newFont.url);
                data.fonts.push(newFont);
            };
        }

        if (data.fontupdate) {
            const rules = generateRuneFontCSSRules(data.fonts);
            data.cssRules = rules;
            setRuneCSSRules(rules);
        } else {
            // if we haven't had a font update this render, cssRules will be null and blanked!
            // if useRunes, make sure cssRules is preserved; otherwise, the blanking is tidy
            if ( game.settings.get('questworlds','useRunes') ) {
                const old_data = game.settings.get('questworlds','runeFontSettings');
                data.cssRules = old_data.cssRules;
            }
        }

        // console.log(data);

        // don't store temporary state formdata
        delete data.newfont;
        delete data.fontupdate;

        game.settings.set('questworlds', 'runeFontSettings', data).then(() => {this.render(true)});
    }

    /** @override */
    activateListeners(html) {
        super.activateListeners(html)

        // make the add-font button opens a font-supporting filepicker
        for ( let fpbutton of html.find('button.font-file-picker') ) {
            fpbutton.onclick = event => {
                event.preventDefault();

                const options = this._getFilePickerOptions(event);
                options.callback = () => {this.submit();}
                const fp = new FontFilePicker(options);
                this.filepickers.push(fp);

                fp.browse();
                setFontUpdates();    // TODO: make this respect the fp's cancel button?
            };
        }

        // hook font delete controls, leveraging empty URL input logic in _updateObject()
        html.find('.font-controls').on('click','a.font-control[data-action="delete"]', (event) => {

            // gate behind an "are you sure?" dialog

            let dialogHTML =
                "<p><strong>" + 
                game.i18n.localize('AreYouSure') +
                "</strong></p>" + 
                "<p>" +
                game.i18n.localize('QUESTWORLDS.SETTINGS.RuneMenu.dialog.TrashWarning') +
                "</p>";

            Dialog.confirm({
                title: game.i18n.localize('QUESTWORLDS.SETTINGS.RuneMenu.Fonts.RemoveFont'),
                content: dialogHTML,
                yes: () => {
                    // blank the target input & trigger submit
                    let target = event.currentTarget.dataset.target;
                    html.find(`input[name="${target}"]`).val('');
                    setFontUpdates();
                    this.submit();
                },
                no: () => {},
                defaultYes: false
              });
        });

        // hook drag operations
        html.find('#built-in-runes th[draggable="true"]').each((i,header) => {
            header.addEventListener('dragstart', _onDrag, false);
            header.addEventListener('dragleave', _onDrag, {capture: true});
            header.addEventListener('dragover', _onDrag, false);
            header.addEventListener('dragenter', _onDrag, false);
            header.addEventListener('drop', _onDrag.bind(this), false);
        });

        async function _onDrag(event) {
            const mode = event.type;

            if (mode == 'dragstart') {
                // set up drag data
                event.dataTransfer.effectAllowed = "move";
                const index = event.currentTarget.dataset.fontIndex;
                event.dataTransfer.clearData();
                event.dataTransfer.setData("text/font-index",index); // custom type to check to allow drops
                event.dataTransfer.setData("text/plain",index);
            } else
            if (mode == 'dragover') {
                let target = $(event.currentTarget);
                if (!(target.is(':active'))) {
                    target.addClass('dropzone');
                    event.preventDefault();
                }
            } else
            if (mode == 'dragenter') {
                if (!($(event.currentTarget).is(':active'))) {
                    event.preventDefault();
                }
            } else
            if (mode == 'dragleave') {
                $(event.currentTarget).removeClass('dropzone');
            } else
            if (mode == 'drop') {
                const target = event.currentTarget;
                $(target).removeClass('dropzone');
            
                // check mimetype & indices good, and indices different
                const landing = target.dataset?.fontIndex;
                if (!landing) return;
                const incoming = event.dataTransfer.getData("text/font-index");
                if (!incoming) return;
                if (landing == incoming) return;

                const runeSettings = game.settings.get('questworlds','runeFontSettings');

                // insert the font into the new index for...
                // ... 1. font list
                moveIndex(runeSettings.fonts,incoming,landing);
                // ... 2. every single damn rune entry
                for (const rune of Object.values(runeSettings.runes)) {
                    moveIndex(rune.fonts,incoming,landing);     // reorder the rune's fonts
                    rune.render = calculateRuneRenderObj(rune);    // calc and set the new render props
                }

                // update and store the new CSS rules
                const rules = generateRuneFontCSSRules(runeSettings.fonts);
                runeSettings.cssRules = rules;
                // store all the changed settings
                await game.settings.set('questworlds','runeFontSettings',runeSettings);
                // change the live dynamic CSS at last minute
                setRuneCSSRules(rules);
                //  and re-render the form to enjoy all this changed data
                this.render();
            }
            // end big if-else statement on event.type

        }   // onDrag

    }

}

/** */
function calculateRuneRenderObj({fonts,token}) {
    // create the render properties
    let fontclass, charvalue;
    for (let i = 0; i < fonts.length; i++) {
        let char = fonts[i];
        if (char) {
            fontclass = `rune-font${i}`;
            charvalue = char;
            break;  // we only want the first hit
        }
    }
    // return the render properties (or defaults) for the rune
    return {
        class: fontclass || "rune-token",
        text: charvalue || `(${token.replace('_',' ')})`,
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

function generateRuneFontCSSRules(fonts) {
    let rules = [];
    for ( const [index,v] of Object.entries(fonts) ) {
        let fallback = '"Roboto", sans-serif';
        let name = v.name;
        let url = v.url;
        let ext = url.split('.').pop().toUpperCase();
        let format = {
            "TTF": "truetype",
            "OTF": "opentype",
        }[ext];
        rules.push(`@font-face { font-family: "${name}"; src: url("${url}") format("${format}"); }`);
        rules.push(`.rune-font${index} { font-family: "${name}", ${fallback}; }`);
    }
    return rules;
}

export function setRuneCSSRules(rules=[]) {
    if (!rules) return;

    // Create the style element, if necessary
    let elem = $('style#qwRunes');
    let replace = false;
    if (!elem.length) {
        elem = $('<style id="qwRunes"></style>');
        $('head').append(elem);
    } else {
        replace = true; // already exists, therefore needs emptying
    }

    // Find its CSSStyleSheet entry in document.styleSheets
    let runeSheet = null;
    for (let sheet of document.styleSheets) {
        if (sheet.ownerNode == elem[0]) {
            runeSheet = sheet;
            break;
        }
    }

    // empty if previously determined necessary
    if (replace) {
        for (let i = runeSheet.cssRules.length - 1; i >= 0; i--) {
            runeSheet.deleteRule(i);
        }
    }

    // insert the rules in order
    for (let rule of rules) {
        runeSheet.insertRule(rule, runeSheet.cssRules.length);
    }
}

/* mark the form as having font changes to handle */
function setFontUpdates() {
    $('input[name="fontupdate"]').prop('checked', true);
}

/* FilePicker with support for font file extensions */
class FontFilePicker extends FilePicker {
    constructor(options={}) {

        // Localization for custom title
        if (!game.i18n.translations.FILES.TitleFont) {
            game.i18n.translations.FILES.TitleFont = game.i18n.localize('QUESTWORLDS.FontBrowser');
        }
        options['type'] = 'font';   // induces attempt to use TitleFont key

        options['activeSource'] = 'data';

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