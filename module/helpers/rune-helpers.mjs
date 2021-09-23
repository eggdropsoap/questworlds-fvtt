/* stuff for handling rune display */

export function tokenMarkupToHTML(str) {
    const regex = /\[\[(\w+)\]\]/g;
    if (str) return str.replace(regex,_tokenToHTML);
}

function _tokenToHTML(match) {
    const token = match.replace('[[','').replace(']]','');
    const runeList = game.settings.get('questworlds','runeFontSettings').runes;

    if (token in runeList)
      return `<span class="${runeList[token].render.class}" title="${game.i18n.localize(runeList[token].name)}">${runeList[token].render.text}</span>`;
      else return match;
}

