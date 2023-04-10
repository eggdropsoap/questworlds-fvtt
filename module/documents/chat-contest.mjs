import { RatingHelper } from "../helpers/rating-helpers.mjs";
import { StoryPoints } from "../helpers/story-points.mjs";

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
            const context = await chatMessage.getFlag('questworlds','formData');
            if (!(context)) return; // not a contest chat card
            if (context?.closed) return; // do nothing; the template took care of disabling the form
            const user = game.user;
            const actorName = data.alias; //could also use chatMessage.speaker.alias
            const messageOwners = chatMessage.whisper;

            const HTML_waitingForName = '<i>'+ game.i18n.localize('QUESTWORLDS.chatcontest.WaitingFor') + actorName + '...' + '</i>';
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
                    overButton.html(HTML_waitingForName);
                }
                if (readyToRoll) {
                    _disableAllControls(html);
                    overButton.hide();
                    approveButton.html(HTML_rollApproved);
                } 
            }
            else if (messageOwners.indexOf(user.id) > -1) { 
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
            const socket = CONFIG.QUESTWORLDS.socket;
            const messageID = chatMessage.id;
            const flagDiff = {
                waitingForPlayer: game.user.isGM
            }

            await socket.executeAsGM("sktSetChatFlag", messageID, flagDiff)
                .catch(e => {
                    ui.notifications.error(`${e.name}: ${e.message}`);
                });
                ui.chat.scrollBottom();
        },  // clickOverButton
        
        async clickApproveButton(event,chatMessage) {
            event.preventDefault();
            const flagDiff = {
                readyToRoll: true,
            }
            await chatMessage.setFlag('questworlds','formData',flagDiff);

            // if assured contest, resolve immediately on approval
            const formData = await _getContext(chatMessage);
            if (formData.assured)
                _resolveRoll(chatMessage);

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
            _resolveRoll(chatMessage);
        },  // clickRollButton()
    }   // Handlers


    /* * * * * * * * * * * */
    /*  Utility functions  */
    /* * * * * * * * * * * */


    static async refreshChatMessage(chatMessage) {
        const formData = await chatMessage.getFlag('questworlds','formData');
        const content = await renderTemplate("systems/questworlds/templates/chat/chat-contest.html",formData);
        const messages = Array.from(game.messages);
        const lastMessage = messages[messages.length - 1];
        const socket = CONFIG.QUESTWORLDS.socket;        
        
        if (messages.length === 0) return; // no messages in log, nothing to refresh
        if ((chatMessage.id == lastMessage.id)) { // Update the message if it is the most recent.
            await socket.executeAsGM("sktUpdateChatMessage", chatMessage.id, {'timestamp': Date.now()});
            await socket.executeAsGM("sktUpdateChatMessage", chatMessage.id, {'content': content});
        } else { // Otherwise, repost and delete it.
            // Initialize chat data.
            const speaker = chatMessage.speaker;
            const flavor = chatMessage.flavor;

            //create the message
            const msg = await ChatMessage.create({
                speaker: speaker,
                whisper: chatMessage.whisper,    
                flavor: flavor,
            });
            await socket.executeAsGM("sktSetChatFlag", msg.id, formData);
            await socket.executeAsGM("sktUpdateChatMessage", msg.id, {'content': content});
            await socket.executeAsGM("sktDeleteChatMessage", chatMessage.id);
        }
        ui.chat.scrollBottom();
    }

    static resolve(chatMessage) {
        _resolveRoll(chatMessage);
    }

    static addStoryPoint(chatMessage) {
        const data = _getContext(chatMessage);
        if (!(data?.storypoint)) {
            data.storypoint = true;
            chatMessage.setFlag('questworlds','formData',data);    
        }
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

    // add selected benefits / consequences to the runningTotal
    let beneMods = {rating: 0, masteries: 0};
    let benefitsRisked = 0;

    for (let key of Object.keys(formData.benefits)) {
        const bene = formData.benefits[key];
        if (bene.checked) {
            beneMods = RatingHelper.add(beneMods,bene.system);
            benefitsRisked += (bene.variant == 'benefit') ? 1 : 0;
        }
    }
    runningTotal = RatingHelper.add(runningTotal,beneMods);
    
    /* calculate modified resistance rating */
    // get the starting rating of the resistance or '0' if manual entry is selected
    const manualEntryCheck = formData.difficultyLevel == 'manual_entry';
    const resistance = (manualEntryCheck) ? {rating: 0, masteries: 0} : RatingHelper.getDifficulty(formData.difficultyLevel);

    // add the difficulty modifiers
    const diffMods = {
        rating: formData.difficultyModifiers || 0,
        masteries: 0,
    }
    let difficultyTotal = RatingHelper.add(
        {rating: resistance.rating, masteries: resistance.masteries},
        {rating: diffMods.rating, masteries: diffMods.masteries});

    // grab custom difficulty or set to 0
    const diffCustom = {
        rating: formData.manualDifficulty || 0,
        masteries: 0,
    }
    
    // only add custom difficulty if manual entry is selected and custom difficulty is not set to 0
    if (manualEntryCheck && diffCustom != {rating: 0, masteries: 0}) {
        difficultyTotal = RatingHelper.add(
            {rating: difficultyTotal.rating, masteries: difficultyTotal.masteries},
            {rating: diffCustom.rating, masteries: diffCustom.masteries});
    }

    /* check for assured contests */
    const assuredVictory = RatingHelper.merge(difficultyTotal) <= 0;
    const assuredDefeat = RatingHelper.merge(runningTotal) <= 0;

    /* merge and return */
    formData = mergeObject(formData,{
        total: runningTotal,
        tactic: tactic,
        resistance: difficultyTotal,
        benefitsRisked: benefitsRisked,
        assured: assuredDefeat || assuredVictory,
        assuredVictory: assuredVictory,
        assuredDefeat: assuredDefeat,
    })

    return formData;
};

async function _resolveRoll(chatMessage) {
    const formData = await _getContext(chatMessage);
    const socket = CONFIG.QUESTWORLDS.socket;

    if (!formData.assured) {
        const pcTN = formData.total.rating;
        const pcMasteries = formData.total.masteries;
        const resTN = formData.resistance.rating;
        const resMasteries = formData.resistance.masteries;
        const storypoint = formData?.storypoint;
        const storypointImage = StoryPoints.pointImage({solid: true, color: true});
        const storypointTitle = game.i18n.format('QUESTWORLDS.chatcontest.StoryPointTitle',{storypoint: StoryPoints.name()});

        let pcResult,resResult;
        if (formData.outcome) {     // already rolled
            ({pcResult,resResult} = formData);
        } else {        // no roll yet

            // make two new rolls: the character and the resistance
            const pcRoll = new Roll('1d20').roll({async:false});
            const resRoll = new Roll('1d20').roll({async:false});
            pcResult = pcRoll.total;
            resResult = resRoll.total;

            // Dice So Nice integration
            if (game.dice3d) {
                // player roll
                game.dice3d.showForRoll(pcRoll, game.user, true);
                // GM roll, then resistance roll after a short delay
                const firstGM = game.users.find(user => {return user.isGM});
                setTimeout(() => {
                    game.dice3d.showForRoll(resRoll, firstGM, true);
                }, 500);
            }
        }

        const pcSuccesses = countSuccesses(pcTN,pcResult,pcMasteries,storypoint);
        const resSuccesses = countSuccesses(resTN,resResult,resMasteries);

        // calculate outcome
        const degrees = pcSuccesses - resSuccesses;
        let outcome, victory=false, tie=false, defeat=false, outcomeText, srdText, cssClass;
        if (degrees == 0) {         // tie or marginal outcome
            if (pcResult == resResult) {
                outcome = OUTCOMES.TIE;
                tie = true;
            }
            else if (pcResult > resResult) {
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
            outcome = outcome <= 4 ? outcome : 4;   // clamp to maximum of 4
        } else {                    // clear defeat
            defeat = true;
            outcome = degrees - 1;
            outcome = outcome >= -4 ? outcome : -4;   // clamp to minimum of -4
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

        const flagDiff = {
            pcResult: pcResult,
            pcSuccesses: pcSuccesses,
            resResult: resResult,
            resSuccesses: resSuccesses,
            storypoint: storypoint,
            storypointImg: storypointImage,
            storypointTitle: storypointTitle,
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
        }
        // update the data store with the roll results
        await socket.executeAsGM("sktSetChatFlag", chatMessage.id, flagDiff)
            .catch(e => {
                ui.notifications.error(`${e.name}: ${e.message}`);
            }); 
    }   // if !assured
    else {  // it's an assured contest
        let victory,defeat,cssClass,outcomeText;
        if (formData.assuredDefeat) {
            outcomeText = game.i18n.localize('QUESTWORLDS.chatcontest.outcomes.AssuredDefeat');
            defeat = true;
            cssClass = 'defeat';
        }               
        else {
            outcomeText = game.i18n.localize('QUESTWORLDS.chatcontest.outcomes.AssuredVictory');
            victory = true;
            cssClass = 'victory';
        }

        // minimal update of the data store
        const flagDiff = {
            outcome: {
                victory: victory,
                defeat: defeat,
                text: outcomeText,
                cssClass: cssClass,
            },
            closed: true,       // close the card
        }

        await socket.executeAsGM("sktSetChatFlag", chatMessage.id, flagDiff)
            .catch(e => {
                ui.notifications.error(`${e.name}: ${e.message}`);
            });

    }

    ChatContest.refreshChatMessage(chatMessage); 
    await socket.executeAsGM("sktUpdateChatMessage", chatMessage.id, {whisper: [], blind: false})
        .catch(e => {
            ui.notifications.error(`${e.name}: ${e.message}`);
        }); //reveal to everyone
}   // _resolveRoll()

function _updateChatMessage(chatMessage,formData) {
    if (formData) {
        // process derived data from form options
        formData = _processFormData(formData);

        if (formData) {
            const socket = CONFIG.QUESTWORLDS.socket;
            const messageID = chatMessage.id;
            socket.executeAsGM("sktSetChatFlag", messageID, formData)
                .then( () => {
                ChatContest.refreshChatMessage(chatMessage)
            });   
        }
    }
}

function _enableControl(ctrl) {
    ctrl.removeAttr('disabled'); }

function _disableControl(ctrl) { 
    ctrl.attr('disabled',true); }

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
    const formContents = theForm.object;

    return formContents;
}

function _getNewFormData(chatMessage,html) {
    let oldFormData = chatMessage.getFlag('questworlds','formData');
    if (!(oldFormData)) return null;

    const addedData = _getCurrentFormData(html);

    const mergedData = mergeObject(oldFormData,addedData);
    return mergedData;
}

function countSuccesses(tn,rollTotal,masteries,storypoint=false) {
    let count = masteries;
    count += rollTotal <= tn ? 1 : 0;
    count += rollTotal == tn ? 1 : 0;
    count += storypoint ? 1 : 0;
    return count;
}
