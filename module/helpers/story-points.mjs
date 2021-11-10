
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

    static Handlers = {

        async onRenderPlayerList(list,html, options) {

            const usePool = !(game.settings.get('questworlds','useIndividualStoryPoints'));

            if (usePool) {
                const context = {
                    pool: true,
                    pointsPool: game.settings.get('questworlds','sharedStoryPointsPool'),
                    title: StoryPoints.name('pool'),
                }
                const sharedPointsHTML = $(await renderTemplate('/systems/questworlds/templates/playerlist/points-header.html',context));

                sharedPointsHTML.on('click',StoryPoints.Handlers.onClickStoryPoints);
                $(html).find('h3').append(sharedPointsHTML);
            } else {
                const context = {
                    title: StoryPoints.name('plural'),
                    userCssClass: game.user.isGM ? 'gm' : '',
                }
                const storyPointsHeader = $(await renderTemplate('/systems/questworlds/templates/playerlist/points-header.html',context));
                if (game.user.isGM) storyPointsHeader.on('click',StoryPoints.Handlers.onClickStoryPoints);
                $(html).find('h3').append(storyPointsHeader);
                for (const user of Object.values(options.users)) {
                    if (user.character) {
                        const actor = user.character;
                        // const userId = user.id;
                        const sp = actor.data.data.points.hero;
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

                let donothing;
            }

            let donothing;
        },

        async onClickStoryPoints(event) {
            event.stopPropagation();
            // event.preventDefault();
            const e = event.currentTarget;
            const dataset = e.dataset;
            const usePool = !(game.settings.get('questworlds','useIndividualStoryPoints'));
            const socket = CONFIG.QUESTWORLDS.socket;

            if (game.user.isGM && usePool) {
                // TODO: confirm refresh with dialog

                const countPlayers = game.users.filter(user => { return !user.isGM }).length;
                const currentPool = game.settings.get('questworlds','sharedStoryPointsPool');
                if (currentPool != countPlayers) {
                    game.settings.set('questworlds','sharedStoryPointsPool',countPlayers);
                    _pointsChat('refresh');
                }
            } else {    // individual story points
                if (game.user.isGM) {
                    const actorId = dataset.actorId;
                    if (actorId) {     // gm clicked a player's points
                        const character = game.actors.get(actorId);
                        // TODO: insert confirmation dialog
                        character.addStoryPoint()
                            .then( () => { socket.executeForEveryone('refreshPlayerList') });
                        _pointsChat('addPoint',character.name);
                    } else {    // gm clicked the header
                        // refresh all players' characters' personal story points
                        const players = game.users.filter(user => { return !user.isGM });
                        for (const player of Object.values(players)) {
                            const character = player.character;
                            if (character) await character.refreshStoryPoints();
                        }
                        _pointsChat('refresh');
                        socket.executeForEveryone('refreshPlayerList');
                    }
                } else {    // player
                    // TODO: insert confirmation dialog
                    const character = game.user.character;

                    if (usePool) {
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
                    } else {
                        if (character && character.hasStoryPoints() ) {
                            game.user.character?.spendStoryPoint()
                                .then(() => { socket.executeForEveryone('refreshPlayerList') });
                            _pointsChat('spendPoint');
                        } else {
                            ui.notifications.warn(game.i18n.format('QUESTWORLDS.NoStoryPointsWarning',{storypoints: StoryPoints.name('plural')}));
                        }
                    }
                }
            }
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