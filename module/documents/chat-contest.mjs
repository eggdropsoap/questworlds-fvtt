import { RatingHelper } from "../helpers/rating-helpers.mjs";

/* implements contest setup and rolling via dynamic chat cards */

export const OUTCOMES = {
    COMPLETE_DEFEAT: -4,
    MAJOR_DEFEAT: -3,
    MINOR_DEFEAT: -2,
    MARGINAL_DEFEAT: -1,
    TIE: 0,
    MARGINAL_VICTORY: 1,
    MINOR_VICTORY: 2,
    MAJOR_VICTORY: 3,
    COMPLETE_VICTORY: 4,
}

export const OUTCOME_CLASSIC_TEXT = {
    '-4': 'QUESTWORLDS.chatcontest.outcomes.CompleteDefeat',
    '-3': 'QUESTWORLDS.chatcontest.outcomes.MajorDefeat',
    '-2': 'QUESTWORLDS.chatcontest.outcomes.MinorDefeat',
    '-1': 'QUESTWORLDS.chatcontest.outcomes.MarginalDefeat',
    '0': 'QUESTWORLDS.chatcontest.outcomes.Tie',
    '1': 'QUESTWORLDS.chatcontest.outcomes.MarginalVictory',
    '2': 'QUESTWORLDS.chatcontest.outcomes.MinorVictory',
    '3': 'QUESTWORLDS.chatcontest.outcomes.MajorVictory',
    '4': 'QUESTWORLDS.chatcontest.outcomes.CompleteVictory',
}

export class ChatContest {

    /* * * * * * * * * */
    /* Hook Listeners  */
    /* * * * * * * * * */

    static HookListeners = {

        async renderChatLog(app, html, data) {
            // console.log('ChatContest.renderChatLogHook()');
        },  // listener for renderChatLog hook
    
        /* make sure the game is ready before trying to get flags &c */
        async renderChatMessage(chatMessage, html, data) {
            if (game.ready) {
                this._renderChatMessage(chatMessage,html,data);
            } else {
                // try again later
                setTimeout(() => {
                    this.renderChatMessage(chatMessage,html,data);    
                }, 50);
            }
        },

        async _renderChatMessage(chatMessage, html, data) {
            // console.log('ChatContest._renderChatMessageHook()');

            const context = await chatMessage.getFlag('questworlds','formData');
            // console.log('context for chatMessage ID',chatMessage.id, context);

            if (!(context)) return; // not a contest chat card
            // if (context?.closed) return;    // do nothing; the template took care of disabling the form
            // ^^^ temporarily commented out for debugging rolls with free rerolling

            const user = game.user;
            const messageOwner = chatMessage.data.user;

            const HTML_waitingForPlayer = '<i>'+ game.i18n.localize('QUESTWORLDS.chatcontest.WaitingForPlayer') +'</i>';
            const HTML_waitingForGM = '<i>'+ game.i18n.localize('QUESTWORLDS.chatcontest.WaitingForGM') +'</i>';
            const HTML_rollApproved = '<i>'+ game.i18n.localize('QUESTWORLDS.chatcontest.RollApproved') +'</i>';

            const overButton = html.find('button[name="over"]');
            const approveButton = html.find('button[name="approve"]');
            const rollButton = html.find('button[name="roll"]');
            const waitingForPlayer = context?.waitingForPlayer;
            const readyToRoll = context?.readyToRoll;
            
            overButton.on('click',e => ChatContest.Handlers.clickOverButton(e,chatMessage));
            approveButton.on('click',e => ChatContest.Handlers.clickApproveButton(e,chatMessage));
            rollButton.on('click',e => ChatContest.Handlers.clickRollButton(e,chatMessage,html));
            // html.on('blur','input, select',e => ChatContest.Handlers.blurField(e,chatMessage,html));
            html.on('blur','input[type="text"], input[type="number"]',e => ChatContest.Handlers.blurField(e,chatMessage,html));
            html.on('change','select',e => ChatContest.Handlers.blurField(e,chatMessage,html));
            html.on('click','input[type="checkbox"]',e => ChatContest.Handlers.clickTag(e,chatMessage,html));

            // set up form state from datastore
            if (user.isGM) {
                rollButton.hide();  // never for GM

                if (waitingForPlayer) {
                    _disableAllControls(html);
                    overButton.html(HTML_waitingForPlayer);
                }
                if (readyToRoll) {
                    _disableAllControls(html);
                    overButton.hide();
                    approveButton.html(HTML_rollApproved);
                } 
            }
            else if (user.id == messageOwner) {
                approveButton.hide();   // never for players

                if (!waitingForPlayer) { 
                    // waiting for the GM
                    _disableAllControls(html);
                    overButton.html(HTML_waitingForGM);
                } 
                if (readyToRoll) {
                    overButton.hide();
                    _disableAllControls(html);
                    _enableControl(rollButton);
                } else {
                    rollButton.hide();
                } 
            } else { // we're a different player
                // console.log("You're not the right player!");
                // TODO: replace this with initial private-to-GM chat type + a make-public after roll
                _disableAllControls(html);
                _hideAllControls(html);
            }

        },  // listener for renderChatMessage hook
    
        async updateChatMessage(chatMessage, chatData, diff, speaker) {
            ui.chat.scrollBottom();
        },  // listener for updateChatMessage hook

    }   // HookListeners

    /* * * * * * * * * */
    /* Event Handlers  */
    /* * * * * * * * * */

    static Handlers = {

        async clickOverButton(event,chatMessage) {
            event.preventDefault();
            const flagDiff = {
                waitingForPlayer: game.user.isGM
            }
            chatMessage.setFlag('questworlds','formData',flagDiff);
        },  // clickOverButton

        async clickApproveButton(event,chatMessage) {
            event.preventDefault();
            const flagDiff = {
                readyToRoll: true,
            }
            chatMessage.setFlag('questworlds','formData',flagDiff);
        },  // clickApproveButton

        /**
         * 
         * @param event 
         * @param chatMessage 
         * @param html 
         */
        async clickTag(event,chatMessage,html) {
            event.preventDefault();
            let formData = _getNewFormData(chatMessage,html);
            _updateChatMessage(chatMessage,formData);
        },

        /**
         * blurField() is where most form data is processed, similarly to an
         * actor sheet's _onUpdate override. Except, this is also where the
         * stored data is force-updated and the chat message content replaced
         * with a fresh render.
         * @param event 
         * @param chatMessage 
         * @param html 
         */
        async blurField(event,chatMessage,html) {
            event.preventDefault();

            const newFocus = event.relatedTarget;   // whatever got focus after the blurring input
            const chatMessageId = chatMessage.id;   // to find form after the re-render replaces it

            // get merged stored data + new form data
            let formData = _getNewFormData(chatMessage,html);
            
            // update datastore then re-render
            _updateChatMessage(chatMessage,formData);

            // finally, if the blur was from a button click, click it manually after the rerender
            if (newFocus instanceof HTMLButtonElement) {
                const form = $(document).find(`#chat-log li.chat-message[data-message-id="${chatMessageId}"] form`);
                const elem = form.find(`button[name="${newFocus.name}"]`);
                $(elem).trigger('click');
            } else  // or if blur was from tabbing or clicking a control: restore focus on new control
            if (newFocus && ['INPUT','SELECT'].includes(newFocus.tagName) ) {
                // restore focus element's focus
                // (code based on inspecting Foundry's own method of restoring focus)
                if (newFocus.name) {
                    const form = $(document).find(`#chat-log li.chat-message[data-message-id="${chatMessageId}"] form`);
                    const elem = form.find(`[name="${newFocus.name}"]`);
                    if (elem && (elem.focus instanceof Function)) elem.focus();
                }
            }

        },  // blurField()

        async clickRollButton(event,chatMessage,html) {
            event.preventDefault();

            // console.log("Beginning click. chatMessage:", chatMessage);
            const formData = await _getContext(chatMessage);

            
            const pcTN = formData.total.rating;
            const pcMasteries = formData.total.masteries;
            const resTN = formData.resistance.rating;
            const resMasteries = formData.resistance.masteries;

            // make two new rolls: the character and the resistance
            const pcRoll = new Roll('1d20').roll({async:false});
            const pcSuccesses = countSuccesses(pcTN,pcRoll.total,pcMasteries);
            const resRoll = new Roll('1d20').roll({async:false});
            const resSuccesses = countSuccesses(resTN,resRoll.total,resMasteries);

            // Dice So Nice integration
            if (game.dice3d) {
                // player roll
                game.dice3d.showForRoll(pcRoll, game.user, true);
                // GM / resistance roll after a short delay
                const firstGM = game.users.find(user => {return user.isGM});                
                setTimeout(() => {
                    game.dice3d.showForRoll(resRoll, firstGM, true);    
                }, 500);
                
            }

            // calculate outcome
            const degrees = pcSuccesses - resSuccesses;
            let outcome, victory=false, tie=false, defeat=false, outcomeText, srdText, cssClass;
            if (degrees == 0) {         // tie or marginal outcome
                if (pcRoll.total == resRoll.total) {
                    outcome = OUTCOMES.TIE;
                    tie = true;
                }
                else if (pcRoll.total > resRoll.total) {
                    outcome = OUTCOMES.MARGINAL_VICTORY;
                    victory = true;
                }
                else {
                    outcome = OUTCOMES.MARGINAL_DEFEAT;
                    defeat = true;
                }
            } else if (degrees > 0) {   // clear success
                victory = true;
                outcome = degrees + 1;
            } else {                    // clear defeat
                defeat = true;
                outcome = degrees - 1;
            }

            // outcome-dependent variables
            if (victory) {
                cssClass = 'victory';
                srdText = srdText || game.i18n.localize('QUESTWORLDS.chatcontest.outcomes.DegreesOfVictory') + `: ${degrees}`;
            }                    
            if (tie) {
                cssClass = 'tie';
                srdText = srdText || game.i18n.localize('QUESTWORLDS.chatcontest.outcomes.Tie');    
            }                    
            if (defeat) {
                cssClass = 'defeat';
                srdText = srdText || game.i18n.localize('QUESTWORLDS.chatcontest.outcomes.DegreesOfDefeat') + `: ${Math.abs(degrees)}`;
            }                    

            const useClassicOutcomes = game.settings.get('questworlds','useClassicOutcomes');
            if (useClassicOutcomes) {
                outcomeText = game.i18n.localize(OUTCOME_CLASSIC_TEXT[outcome]);    
            } else {
                outcomeText = srdText;
            }

            // update the data store with the roll results
            await chatMessage.setFlag('questworlds','formData',{
                pcResult: pcRoll.total,
                pcSuccesses: pcSuccesses,
                resResult: resRoll.total,
                resSuccesses: resSuccesses,
                outcome: {
                    victory: victory,
                    defeat: defeat,
                    tie: tie,
                    degrees: Math.abs(degrees),
                    kind: outcome,
                    text: outcomeText,
                    cssClass: cssClass,
                    degreesText: srdText,
                },
                settings: {
                    useClassicOutcomes: useClassicOutcomes,
                },
                closed: true,       // close the card
            });
            ChatContest.refreshChatMessage(chatMessage);

        },  // clickRollButton()

    }   // Handlers


    /* * * * * * * * * * * */
    /*  Utility functions  */
    /* * * * * * * * * * * */


    static async refreshChatMessage(chatMessage) {
        const formData = await chatMessage.getFlag('questworlds','formData');
        const content = await renderTemplate("systems/questworlds/templates/chat/chat-contest.html",formData);
        await chatMessage.update({'content': content});
    }
}

/* * * * * * * * * * * * * * */
/* private utility functions */
/* * * * * * * * * * * * * * */

/**
 * 
 * @param formData 
 * @returns {Object}    The formdata with added derived data
 */
function _processFormData(formData) {
    /* calculate modified tactic rating */

    // get the starting rating of the tactic
    const tactic = {
        rating: formData.tactic.rating || 0,
        masteries: formData.tactic.masteries || 0,
    };
    
    // add the situational modifiers
    const sitMods = {
        rating: formData.situationalModifiers || 0,
        masteries: 0,
    }
    let runningTotal = RatingHelper.add(
        {rating: tactic.rating, masteries: tactic.masteries},
        {rating: sitMods.rating, masteries: sitMods.masteries});

    // TODO: add selected benefits / consequences to the runningTotal
    let beneMods = {rating: 0, masteries: 0};
    let benefitsRisked = 0;
    for (let key of Object.keys(formData.benefits)) {
        const bene = formData.benefits[key];
        if (bene.checked) {
            beneMods = RatingHelper.add(beneMods,bene.data);
            benefitsRisked += (bene.variant == 'benefit') ? 1 : 0;
        }
    }
    runningTotal = RatingHelper.add(runningTotal,beneMods);
    
    /* calculate modified resistance rating */
    const resistance = RatingHelper.getDifficulty(formData.difficultyLevel);

    formData = mergeObject(formData,{
        total: runningTotal,
        tactic: tactic,
        resistance: resistance,
        benefitsRisked: benefitsRisked,
    })

    return formData;
};

function _updateChatMessage(chatMessage,formData) {
    if (formData) {
        // process derived data from form options
        formData = _processFormData(formData);
        if (formData) {
            chatMessage.setFlag('questworlds','formData',formData).then( () => {
                ChatContest.refreshChatMessage(chatMessage)
            });
            // await chatMessage.setFlag('questworlds','formData',formData);
            // await ChatContest.refreshChatMessage(chatMessage);    
        }
    }
}

function _enableControl(ctrl) { ctrl.removeAttr('disabled'); }

function _disableControl(ctrl) { ctrl.attr('disabled',true); }

function _disableAllControls(html) {
    const allControls = html.find('button, input, select');
    _disableControl(allControls);
}

function _disableAllFields(html) {
    const allFields = html.find('input, select');
    _disableControl(allFields);
}

function _enableAllControls(html) {
    const allControls = html.find('button, input, select');
    _enableControl(allControls);
}


function _hideAllControls(html) {
    const allControls = html.find('button, input, select');
    allControls.hide();
}


function _getContext(chatMessage) {
    return chatMessage.getFlag('questworlds','formData');
}

function _getCurrentFormData(html) {
    const form = $(html).find('form')[0];
    const theForm = new FormDataExtended(form);
    const formContents = theForm.toObject();

    return formContents;
}

function _getNewFormData(chatMessage,html) {
    let oldFormData = chatMessage.getFlag('questworlds','formData');
    if (!(oldFormData)) return null;

    const addedData = _getCurrentFormData(html);

    const mergedData = mergeObject(oldFormData,addedData);
    return mergedData;
}

function countSuccesses(tn,rollTotal,masteries) {
    let count = masteries;
    count += rollTotal <= tn ? 1 : 0;
    count += rollTotal == tn ? 1 : 0;
    return count;
}

// TODO: link benefits to their source ability, and mark them lost regardless of checked state
// TODO: style GM's view of benefits as "disabled" somehow
// TODO: spending hero points / story points on rolls