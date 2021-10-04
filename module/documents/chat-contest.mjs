/* implements contest setup and rolling via dynamic chat cards */

export class ChatContest {

    static HookListeners = {

        async renderChatLog(app, html, data) {
            // console.log('ChatContest.renderChatLogHook()');
            // console.log(app);
            // console.log(html);
            // console.log(data);
        },
    
        async renderChatMessage(chatMessage, html, data) {
            console.log('ChatContest.renderChatMessageHook()');

            const formData = chatMessage.getFlag('questworlds','formData');
            
            if (formData?.closed) return;    // do nothing; the template took care of disabling form

            const user = game.user;
            const messageOwner = chatMessage.data.user;

            const HTML_waitingForPlayer = '<i>'+ game.i18n.localize('QUESTWORLDS.chatcontest.WaitingForPlayer') +'</i>';
            const HTML_waitingForGM = '<i>'+ game.i18n.localize('QUESTWORLDS.chatcontest.WaitingForGM') +'</i>';

            const overButton = html.find('button[name="over"]');
            const approveButton = html.find('button[name="approve"]');
            const rollButton = html.find('button[name="roll"]');
            const waitingForPlayer = formData?.waitingForPlayer;
            const readyToRoll = formData?.readyToRoll;

            // console.log("Form Data (flag)",formData);
            // console.log(chatMessage);
            // console.log(html);
            // console.log(data);
            
            overButton.on('click',e => ChatContest.Handlers.clickOverButton(e,chatMessage));
            approveButton.on('click',e => ChatContest.Handlers.clickApproveButton(e,chatMessage));
            rollButton.on('click',e => ChatContest.Handlers.clickRollButton(e,chatMessage));
            html.on('blur','input, select',e => ChatContest.Handlers.blurField(e,chatMessage,html));


            if (!readyToRoll) {
                rollButton.hide();
            } else {
                _disableAllControls();
                overButton.hide();
                if (! user.isGM ) approveButton.hide();
                if (user.id == messageOwner) _enableControl(rollButton);
                return;
            }

            if (user.isGM) {
                rollButton.hide();

                if (waitingForPlayer) {
                    _disableAllControls();
                    overButton.html(HTML_waitingForPlayer);
                }
            }
            else if (user.id == messageOwner) {
                approveButton.hide();

                if (waitingForPlayer) { 
                    //
                } else {    // waiting for the GM
                    _disableAllControls();
                    overButton.html(HTML_waitingForGM);
                }
            } else { // we're a different player
                // console.log("You're not the right player!");
                _disableAllControls();
                _hideAllControls();
            }

            function _enableControl(ctrl) { ctrl.removeAttr('disabled'); }
            function _disableControl(ctrl) { ctrl.attr('disabled',true); }
            function _disableAllControls() {
                const allControls = html.find('button, input, select');
                _disableControl(allControls);
            }
            function _hideAllControls() {
                const allControls = html.find('button, input, select');
                allControls.hide();
            }

        },
    
        async updateChatMessage(chatMessage, chatData, diff, speaker) {
            console.log("updateChatMessage Hook caught");
            ui.chat.scrollBottom();

            // console.log('ChatContest.updateChatMessageHook()');
            // console.log(chatMessage);
            // console.log(chatData);
            // console.log(diff);
            // console.log(speaker);
        },

    }   // HookListeners

    static Handlers = {

        async clickOverButton(event,chatMessage) {
            event.preventDefault();
            const flagDiff = {
                waitingForPlayer: game.user.isGM
            }
            // console.log('clickOverButton()',event,chatMessage);
            chatMessage.setFlag('questworlds','formData',flagDiff);
        },

        async clickApproveButton(event,chatMessage) {
            event.preventDefault();
            const flagDiff = {
                readyToRoll: true,
            }
            chatMessage.setFlag('questworlds','formData',flagDiff);
        },

        async clickRollButton(event,chatMessage) {
            event.preventDefault();
            // console.log('Roll Button',event,chatMessage);
        },

        async blurField(event,chatMessage,html) {
            event.preventDefault();

            const button = event.relatedTarget;     // in case a button click triggered the blur
            const chatMessageId = button ? chatMessage.id : null; // so we can re-access form even after a re-render
            const buttonName = button ? button.name : null; // ditto for the button!            

            let formData = chatMessage.getFlag('questworlds','formData');
            const fields = $(html).find('form').find('input, select');
            const data = {};
            fields.each(function() {
                data[this.name] = this.value;
            });
            formData = mergeObject(formData,{data: data});

            await ChatContest.refreshChatMessage(chatMessage,formData);
            await chatMessage.setFlag('questworlds','formData',{data: data});

            // finally, if the blur was from a button click, click it manually after the rerender
            if (chatMessageId) {
                const newHtml = $(document).find(`#chat-log li.chat-message[data-message-id="${chatMessageId}"]`);
                const newButton = newHtml.find(`button[name="${buttonName}"`);
                $(newButton).trigger('click');
            }
        }

    }   // Handlers

    static async refreshChatMessage(chatMessage,formData) {
        // const formData = chatMessage.getFlag('questworlds','formData');
        const content = await renderTemplate("systems/questworlds/templates/chat/chat-contest.html",formData);

        // console.log("Update message with content:", content);
        await chatMessage.update({'content': content});
    }
}