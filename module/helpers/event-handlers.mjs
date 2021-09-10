
export class ContentEditableHelper {

    /**
     * Sync contenteditables with real inputs
     * @param event     Originating html event
     * @private
     */
    static async onInputEditableElement(event) {
        const a = event.target;
        const realInput = document.getElementById(event.target.dataset.realInputId);
        if (a.innerText == "") a.innerHTML = "&nbsp;";
        realInput.value = a.innerText;
    }

    /**
     * Submit form on focusout from contenteditables
     * @param event     Originating html event
     * @private
     */
    static async onBlurEditableElement(event) {
        await this.submit();
    }
}