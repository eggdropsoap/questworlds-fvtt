
export class StoryPointHooks {

    static async onRenderPlayerList(list,html, options) {

        const usePool = !(game.settings.get('questworlds','useIndividualStoryPoints'));

        if (usePool) {
            const context = {
                pool: true,
                pointsPool: game.settings.get('questworlds','sharedStoryPointsPool'),
                title: 'QUESTWORLDS.StoryPointsPool',
            }
            const sharedPointsHTML = $(await renderTemplate('/systems/questworlds/templates/playerlist/points-header.html',context));

            sharedPointsHTML.on('click',StoryPointHooks.onClickPlayerListStoryPoints.bind(list));
            $(html).find('h3').append(sharedPointsHTML);
        } else {
            const context = {
                title: 'QUESTWORLDS.StoryPoints',
                userCssClass: game.user.isGM ? 'gm' : '',
            }
            const storyPointsHeader = $(await renderTemplate('/systems/questworlds/templates/playerlist/points-header.html',context));
            if (game.user.isGM) storyPointsHeader.on('click',StoryPointHooks.onClickPlayerListStoryPoints.bind(list));
            $(html).find('h3').append(storyPointsHeader);
            for (const user of Object.values(options.users)) {
                if (user.character) {
                    const actor = user.character;
                    // const userId = user.id;
                    const sp = actor.data.data.points.hero;
                    const context = {
                        storypoints: sp,
                        userCssClass: game.user === user ? 'me' : game.user.isGM ? 'gm' : '',
                        playerId: user.id,
                    }

                    const userPointsHTML = $(await renderTemplate('/systems/questworlds/templates/playerlist/user-points.html',context));
                    if (game.user === user || game.user.isGM) {
                        userPointsHTML.on('click',StoryPointHooks.onClickPlayerListStoryPoints.bind(list));
                    }
                    $(html).find(`.player[data-user-id="${user.id}"]`).append(userPointsHTML);
                }
            }

            let donothing;
        }

        let donothing;
    }
    static async onClickPlayerListStoryPoints(event) {
        event.stopPropagation();
        // event.preventDefault();
        const e = event.currentTarget;
        const dataset = e.dataset;
        const usePool = !(game.settings.get('questworlds','useIndividualStoryPoints'));

        if (game.user.isGM && usePool) {
            // TODO: confirm refresh with dialog
            ui.notifications.info('Refresh story point pool');

            const countPlayers = game.users.filter(user => { return !user.isGM }).length;
            const currentPool = game.settings.get('questworlds','sharedStoryPointsPool');
            if (currentPool != countPlayers) {
                game.settings.set('questworlds','sharedStoryPointsPool',countPlayers);
                ui.notifications.info('Pool refreshed');
            }
        } else {
            if (game.user.isGM) {
                const playerId = dataset.playerId;
                if (playerId) {
                    const player = game.users.get(playerId);
                    // TODO: insert confirmation dialog
                    ui.notifications.info('Award a personal story point');
                    player.character?.addStoryPoint();
                } else {
                    // refresh all players' characters' personal story points
                    ui.notifications.info('Refresh all personal story points');
                    const players = game.users.filter(user => { return !user.isGM });
                    for (player of Object.values(players)) {
                        character = player.character;
                        if (character) character.refreshIndividualStoryPoints();
                    }
                }
            } else {
                // TODO: insert confirmation dialog
                ui.notifications.info('Spend a story point');
                game.user.character?.spendStoryPoint();
            }
        }
    }
}