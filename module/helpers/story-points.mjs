import { ChatContest } from "../documents/chat-contest.mjs";

export class StoryPoints {

    static POOL_SPEND_RESULT = {
        SUCCESS: 1,
        EMPTY: 2,
        NOT_GM_CONTEXT: 3,
    }

    static name(variant) {
        const name = game.settings.get('questworlds','storyPointsName');
        switch (variant) {
            case 'pool':
                return game.i18n.localize(`QUESTWORLDS.${name}PointsPool`);
            case 'plural':
                return game.i18n.localize(`QUESTWORLDS.${name}Points`);
            default:
                return game.i18n.localize(`QUESTWORLDS.${name}Point`);
        }
    }

    static usePool() {
        return !(game.settings.get('questworlds','useIndividualStoryPoints'));
    }

    static pointImage({solid=false,color=false,black=false}={}) {
        const name = game.settings.get('questworlds','storyPointsName');
        const variant = name == 'Hero' ? 'w' : 'm';
        const thecolor = color ? 'color' : black ? 'black' : 'white';
        if (solid) return `systems/questworlds/assets/story-point-${variant}-solid-${thecolor}.svg`;
        return `systems/questworlds/assets/story-point-${variant}-regular-${thecolor}.svg`;
    }

    static reducePool() {
        if (game.user.isGM) {
            const pool =  game.settings.get('questworlds','sharedStoryPointsPool');
            if (pool < 1) return StoryPoints.POOL_SPEND_RESULT.EMPTY;
            game.settings.set('questworlds','sharedStoryPointsPool',pool-1);
            return StoryPoints.POOL_SPEND_RESULT.SUCCESS;
        } else {
            ui.notifications.error(game.i18n.format('QUESTWORLDS.GMOnlySocketError',{functionName: 'reducePool()'}));
            return StoryPoints.POOL_SPEND_RESULT.NOT_GM_CONTEXT;
        }  
    }

    static refreshPool() {
        const countPlayers = game.users.filter(user => { return !user.isGM }).length;
        const currentPool = game.settings.get('questworlds','sharedStoryPointsPool');
        if (currentPool != countPlayers) {
            game.settings.set('questworlds','sharedStoryPointsPool',countPlayers);
            _pointsChat('refresh');
        }
    }

    static addPointToCharacter(character) {
        const socket = CONFIG.QUESTWORLDS.socket;
        character.addStoryPoint()
            .then( () => { socket.executeForEveryone('refreshPlayerList') });
        _pointsChat('addPoint',character.name);    
    }

    static async refreshAllCharacterPoints() {
        const socket = CONFIG.QUESTWORLDS.socket;
        const players = game.users.filter(user => { return !user.isGM });
        // refresh each player-assigned character points
        for (const player of Object.values(players)) {
            const character = player.character;
            if (character) await character.refreshStoryPoints();
        }
        // announce overall refresh...
        _pointsChat('refresh');                             // ... in chat
        socket.executeForEveryone('refreshPlayerList');     // ... in playerlist app
    }

    static async spendPointFromPool() {
        const socket = CONFIG.QUESTWORLDS.socket;
        const result = await socket.executeAsGM("reducePool")
            .catch(e => {
                ui.notifications.error(`${e.name}: ${e.message}`);
            });
        if (result) {
            switch (result) {
                case StoryPoints.POOL_SPEND_RESULT.SUCCESS:
                    _pointsChat('spendPool');
                    break;
                case StoryPoints.POOL_SPEND_RESULT.EMPTY:
                    ui.notifications.warn(game.i18n.format('QUESTWORLDS.EmptyPoolWarning',{storypoints: StoryPoints.name()}));
                    break;
            }
        }
    }

    static spendPointFromCharacter(character) {
        const socket = CONFIG.QUESTWORLDS.socket;
        if (character && character.hasStoryPoints()) {
            character.spendStoryPoint()
                .then(() => { socket.executeForEveryone('refreshPlayerList') });
            _pointsChat('spendPoint');
        } else {
            ui.notifications.warn(game.i18n.format('QUESTWORLDS.NoStoryPointsWarning',{storypoints: StoryPoints.name('plural')}));
        }

    }

    static Handlers = {

        async onRenderPlayerList(list, html, options) {

            const usePool = !(game.settings.get('questworlds','useIndividualStoryPoints'));

            if (usePool) {
                const context = {
                    pool: true,
                    pointsPool: game.settings.get('questworlds','sharedStoryPointsPool'),
                    title: StoryPoints.name('pool'),
                    storypointImg: StoryPoints.pointImage(),
                }
                const sharedPointsHTML = $(await renderTemplate('/systems/questworlds/templates/playerlist/points-header.html',context));

                sharedPointsHTML.on('click',StoryPoints.Handlers.onClickStoryPoints);
                $(html).find('h3').append(sharedPointsHTML);
            } else {
                const context = {
                    title: StoryPoints.name('plural'),
                    userCssClass: game.user.isGM ? 'gm' : '',
                    storypointImg: StoryPoints.pointImage(),
                }
                const storyPointsHeader = $(await renderTemplate('/systems/questworlds/templates/playerlist/points-header.html',context));
                if (game.user.isGM) storyPointsHeader.on('click',StoryPoints.Handlers.onClickStoryPoints);
                $(html).find('h3').append(storyPointsHeader);
                for (const user of Object.values(options.users)) {
                    if (user.character) {
                        const actor = user.character;
                        // const userId = user.id;
                        const sp = actor.system.points.hero;
                        const context = {
                            storypoints: sp,
                            userCssClass: game.user === user ? 'me' : game.user.isGM ? 'gm' : '',
                            actorId: actor.id,
                        }

                        const userPointsHTML = $(await renderTemplate('/systems/questworlds/templates/playerlist/user-points.html',context));
                        if (game.user === user || game.user.isGM) {
                            userPointsHTML.on('click',StoryPoints.Handlers.onClickStoryPoints);
                        }
                        $(html).find(`.player[data-user-id="${user.id}"]`).append(userPointsHTML);
                    }
                }
            }
        },

        async onClickStoryPoints(event) {
            event.stopPropagation();
            // event.preventDefault();
            const e = event.currentTarget;
            const dataset = e.dataset;
            const usePool = !(game.settings.get('questworlds','useIndividualStoryPoints'));
            const socket = CONFIG.QUESTWORLDS.socket;

            if (game.user.isGM && usePool) {
                Dialog.confirm({
                    title: game.i18n.format('QUESTWORLDS.dialog.RefreshPointsTitle',{storypoints:StoryPoints.name('plural')}),
                    content: "<p>" + game.i18n.format('QUESTWORLDS.dialog.RefreshPoolMessage',{pool: StoryPoints.name('pool')}) + "</p>",
                    yes: () => { StoryPoints.refreshPool() },
                    no: () => {},
                });
            } else {    
                if (game.user.isGM) { // individual story points
                    const actorId = dataset.actorId;
                    if (actorId) {     // gm clicked a player's points
                        const character = game.actors.get(actorId);
                        Dialog.confirm({
                            title: game.i18n.format('QUESTWORLDS.dialog.AwardPointTitle',{storypoint: StoryPoints.name()}),
                            content: "<p>" + game.i18n.format('QUESTWORLDS.dialog.AwardPointMessage',{
                                name: character.name,
                                storypoint: StoryPoints.name()
                            }) + "</p>",
                            yes: () => { StoryPoints.addPointToCharacter(character) },
                            no: () => {},
                        });
                    } else {    // gm clicked the header: refresh all individual story points
                        Dialog.confirm({
                            title: game.i18n.format('QUESTWORLDS.dialog.RefreshPointsTitle',{storypoints:StoryPoints.name('plural')}),
                            content: "<p>" + game.i18n.format('QUESTWORLDS.dialog.RefreshPointsMessage',{storypoints: StoryPoints.name('plural')}) + "</p>",
                            yes: () => { StoryPoints.refreshAllCharacterPoints() },
                            no: () => {},
                        });
                    }
                } else {    // player
                    if (usePool) {
                        Dialog.confirm({
                            title: game.i18n.format('QUESTWORLDS.dialog.SpendPointTitle',{storypoint: StoryPoints.name()}),
                            content: "<p>" + game.i18n.format('QUESTWORLDS.dialog.SpendPoolPointMessage',{
                                storypoint: StoryPoints.name(),
                                pool: StoryPoints.name('pool'),
                            }) + "</p>",
                            yes: () => { StoryPoints.spendPointFromPool() },
                            no: () => {},
                        });
                    } else {
                        const character = game.user.character;
                        Dialog.confirm({
                            title: game.i18n.format('QUESTWORLDS.dialog.SpendPointTitle',{storypoint: StoryPoints.name()}),
                            content: "<p>" + game.i18n.format('QUESTWORLDS.dialog.SpendPointMessage',{storypoint: StoryPoints.name()}) + "</p>",
                            yes: () => { StoryPoints.spendPointFromCharacter(character) },
                            no: () => {},
                        });
                    }
                }
            }
        },

        async onChatEntryContext(html, options) {
            
            options.unshift({
                name: 'QUESTWORLDS.chatcontest.ImproveTactic',
                icon: '<i class="fas fa-plus"></i>',
                condition: checkImprove,
                callback: doImproveTactic,
            });

            const storyPointMenuName = game.i18n.format("QUESTWORLDS.chatcontest.StoryPointMenu",{ storypoint: StoryPoints.name() });
            options.unshift({
                name: storyPointMenuName,
                icon: '<i class="fas fa-plus"></i>',
                condition: checkSP,
                callback: doSpendSP,
            });

            function _context(li) {
                const messageId = li[0].dataset.messageId;
                const message = game.messages.get(messageId);
                return {
                    messageId: messageId,
                    message: message,
                    user: game.user,
                    isGM: game.user.isGM,
                    messageOwner: game.users.get(message.user),
                    isRolledContest: (message.getFlag('questworlds','formData'))?.closed,
                    storypoint: (message.getFlag('questworlds','formData'))?.storypoint,
                    hasPoints: game.user.character?.hasStoryPoints(),
                    usePool: StoryPoints.usePool(),
                    havePoolPoints: game.settings.get('questworlds','sharedStoryPointsPool') > 0,
                }
            }

            function checkSP(li) {
                let user, isGM, messageOwner, isRolledContest, storypoint, hasPoints, usePool, havePoolPoints;
                ({user, isGM, messageOwner, isRolledContest, storypoint, hasPoints, usePool, havePoolPoints} = _context(li));

                if (usePool)
                    return (messageOwner === user && !isGM && isRolledContest && !storypoint && havePoolPoints);
                else
                    return (messageOwner === user && !isGM && isRolledContest && !storypoint && hasPoints);
            }

            function doSpendSP(li) {
                const message = game.messages.get(li[0].dataset.messageId);
                const character = game.user.character;
                const usePool = StoryPoints.usePool();

                if (character) {
                    ChatContest.addStoryPoint(message);
                    ChatContest.resolve(message);
                    if (usePool) StoryPoints.spendPointFromPool();
                    else StoryPoints.spendPointFromCharacter(character);
                }
            }

            function checkImprove(li) {
                let messageId, message, user, isGM, messageOwner, isRolledContest;
                ({messageId, message, user, isGM, messageOwner, isRolledContest} = _context(li));                

                return false; // disable menu option: not implemented yet
                // return (messageOwner === user && !isGM && isRolledContest);
            }

            function doImproveTactic(li) {
                ui.notifications.warn("Not implemented yet");   // TODO: implement
            }

            let breakpoint;
        }
    }
}

function _pointsChat(type,name) {
    let message;
    name = name ? name : game.user.character?.name;

    switch (type) {
        case 'addPoint':
            if (!name) {
                ui.notifications.error(game.i18n.localize('QUESTWORLDS.UndefinedCharacterName'));
                throw new Error('name of character undefined');
            }
            message = game.i18n.format('QUESTWORLDS.NameGainsStoryPoint',{
                name: name,
                storypoint: StoryPoints.name()
            });
            // `${name} gains a Story Point`;
            break;
        case 'spendPoint':
            message = game.i18n.format('QUESTWORLDS.NameSpendsStoryPoint',{
                name: name,
                storypoint: StoryPoints.name()
            });
            // `${name} spends a Story Point`;
            break;
        case 'spendPool':
            message = game.i18n.format('QUESTWORLDS.NameSpendsStoryPoint',{
                name: name,
                storypoint: StoryPoints.name()
            });
            // `${name} spends a point from the Story Points pool`;
            break;
        case 'refresh':
            message = game.i18n.format('QUESTWORLDS.StoryPointsRefreshed',{
                storypoints: StoryPoints.name('plural')
            });
            // `Story Points refreshed`;
            break;
    }

    const content = `<div style="padding: 0 0 1em; text-align: center; font-style: italic;">${message}</div>`;

    ChatMessage.create({
        content: content
    });
}