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

    static HookListeners = {

        async renderChatLog(app, html, data) {
            // console.log('ChatContest.renderChatLogHook()');
            // console.log(app);
            // console.log(html);
            // console.log(data);
        },
    
        async renderChatMessage(chatMessage, html, data) {
            console.log('ChatContest.renderChatMessageHook()');

            const context = await chatMessage.getFlag('questworlds','formData');

            if (!(context)) return; // not a contest chat card
            // if (context?.closed) return;    // do nothing; the template took care of disabling form

            // console.log(chatMessage);
            // console.log(html);
            // console.log(data);

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

            // console.log("Form Data (flag)",context);
            
            overButton.on('click',e => ChatContest.Handlers.clickOverButton(e,chatMessage));
            approveButton.on('click',e => ChatContest.Handlers.clickApproveButton(e,chatMessage));
            rollButton.on('click',e => ChatContest.Handlers.clickRollButton(e,chatMessage,html));
            html.on('blur','input, select',e => ChatContest.Handlers.blurField(e,chatMessage,html));


            // if (!readyToRoll) {
            //     rollButton.hide();
            // } else {
            //     _disableAllControls(html);
            //     overButton.hide();
            //     if (! user.isGM ) approveButton.hide();
            //     if (user.id == messageOwner) _enableControl(rollButton);
            //     return;
            // }

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
                _disableAllControls(html);
                _hideAllControls(html);
            }

        },
    
        async updateChatMessage(chatMessage, chatData, diff, speaker) {
            ui.chat.scrollBottom();

            // console.log('-----------------------------------')
            // console.log('ChatContest.updateChatMessageHook()');
            // console.log('chatMessage',chatMessage);
            // console.log('chatData',chatData);
            // console.log('diff',diff);
            // console.log('speaker',speaker);
            // console.log('-----------------------------------')
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

        async blurField(event,chatMessage,html) {
            event.preventDefault();

            const button = event.relatedTarget;     // in case a button click triggered the blur
            const chatMessageId = button ? chatMessage.id : null; // so we can re-access form even after a re-render
            const buttonName = button ? button.name : null; // ditto for the button!            

            // get data from form merged into stored data
            let formData = _getNewFormData(chatMessage,html);

            // update the total ratings and masteries
            // let [runningTotalR, runningTotalM] = [
            //     formData.rating || 0,
            //     formData.masteries || 0
            // ];
            
            // get the starting rating of the tactic
            const tactic = {
                rating: formData.rating || 0,
                masteries: formData.masteries || 0,
            };
            
            // add the situational modifiers
            const sitMods = {
                rating: formData.situationalModifiers || 0,
                masteries: 0,
            }

            let runningTotal = RatingHelper.add(
                {rating: tactic.rating, masteries: tactic.masteries},
                {rating: sitMods.rating, masteries: sitMods.masteries});
            
            // runningTotalR += formData.situationalModifiers || 0;


            // for each selected benefit/consequence
            // get the benefit's rating
            // add to running totals

            // rationalize the running total
            // console.log('Running totals', runningTotalR, runningTotalM);
            // [runningTotalR, runningTotalM] = RatingHelper.rationalize(runningTotalR, runningTotalM);

            // update formData
            // formData['totalRating'] = runningTotalR;
            // formData['totalMasteries'] = runningTotalM

            // console.log('Updated with running totals',formData);


            if (formData) {
                formData = mergeObject(formData,{
                    totalRating: runningTotal.rating,
                    totalMasteries: runningTotal.masteries,
                })
                await chatMessage.setFlag('questworlds','formData',formData);
                await ChatContest.refreshChatMessage(chatMessage);
            }

            // finally, if the blur was from a button click, click it manually after the rerender
            if (chatMessageId) {
                const newHtml = $(document).find(`#chat-log li.chat-message[data-message-id="${chatMessageId}"]`);
                const newButton = newHtml.find(`button[name="${buttonName}"`);
                $(newButton).trigger('click');
            }

        },

        async clickRollButton(event,chatMessage,html) {
            event.preventDefault();

            // console.log('Roll Button');
            // console.log('event',event);
            // console.log('chatMessage',chatMessage);
            // console.log('html',html);            

            // re-enable all form controls else the below doesn't work
            // _enableAllControls(html);
            // const formData = await _getCurrentFormData(html);
            const formData = await _getContext(chatMessage);
            // re-disable all form controls. bonus: includes roll button!
            // _disableAllFields(html);

            // console.log('formData',formData);
            const pcTN = formData.totalRating;
            const pcMasteries = formData.totalMasteries;
            const resTN = formData.resistanceRating;
            const resMasteries = formData.resistanceMasteries;

            // make two new rolls: the character and the resistance
            const pcRoll = new Roll('1d20').roll({async:false});
            const pcSuccesses = countSuccesses(pcTN,pcRoll.total,pcMasteries);
            const resRoll = new Roll('1d20').roll({async:false});
            const resSuccesses = countSuccesses(resTN,resRoll.total,resMasteries);

            const degrees = pcSuccesses - resSuccesses;
            let outcome, victory=false, tie=false, defeat=false, outcomeText, cssClass;
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

            const useClassicOutcomes = game.settings.get('questworlds','useClassicOutcomes');
            if (useClassicOutcomes) {
                outcomeText = game.i18n.localize(OUTCOME_CLASSIC_TEXT[outcome]);    
            }

            if (victory) {
                cssClass = 'victory';
                outcomeText = outcomeText || game.i18n.localize('QUESTWORLDS.chatcontest.outcomes.DegreesOfVictory') + `: ${degrees}`;
            }                    
            if (tie) {
                cssClass = 'tie';
                outcomeText = outcomeText || game.i18n.localize('QUESTWORLDS.chatcontest.outcomes.Tie');    
            }                    
            if (defeat) {
                cssClass = 'defeat';
                outcomeText = outcomeText || game.i18n.localize('QUESTWORLDS.chatcontest.outcomes.DegreesOfDefeat') + `: ${Math.abs(degrees)}`;
            }                    
                        
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
                },
                closed: true,
            });
            ChatContest.refreshChatMessage(chatMessage);
            // const html_resRoll = resRoll.render();
            // console.log("PC roll HTML:",HTML_pcRoll);

            const testStr = `PC rolled ${pcRoll.total} (${pcSuccesses} successes) vs Resistance rolled ${resRoll.total} (${resSuccesses} successes)`;
            // ui.notifications.info(testStr);
            // console.log(testStr);

            // close the card
        },

    }   // Handlers

    static async refreshChatMessage(chatMessage) {
        const formData = await chatMessage.getFlag('questworlds','formData');
        const content = await renderTemplate("systems/questworlds/templates/chat/chat-contest.html",formData);
        await chatMessage.update({'content': content});
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
    // const fields = $(html).find('form').find('input, select');
    // const newData = {};
    // fields.each(function() {
    //     let value = _fixedDataTypeValue(this);
    //     newData[this.name] = value;
    // });

    const form = $(html).find('form')[0];
    const theForm = new FormDataExtended(form);
    const formContents = theForm.toObject();

    // console.log("_getCurrentFormDat",formContents);
    return formContents;
}

function _getNewFormData(chatMessage,html) {
    let oldFormData = chatMessage.getFlag('questworlds','formData');
    if (!(oldFormData)) return null;

    const addedData = _getCurrentFormData(html);

    const mergedData = mergeObject(oldFormData,addedData);
    // console.log('merged data', mergedData);
    return mergedData;
    // return mergeObject(oldFormData,addedData);
}

function countSuccesses(tn,rollTotal,masteries) {
    let count = masteries;
    count += rollTotal <= tn ? 1 : 0;
    count += rollTotal == tn ? 1 : 0;
    return count;
}