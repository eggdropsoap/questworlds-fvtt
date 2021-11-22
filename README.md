# QuestWorlds FVTT (Unofficial)

QuestWorlds-FVTT is an *unofficial* system module for Foundry VTT to support playing [_QuestWorlds_][qwsrd], the narrative RPG system from [Chaosium][chaosium].

## QuestWorlds FVTT is not affiliated with Chaosium

This Foundry system module uses trademarks and/or copyrights owned by Chaosium Inc/Moon Design Publications LLC, which are used under Chaosium Inc’s Fan Material Policy. We are expressly prohibited from charging you to use or access this content. This Foundry system module is not published, endorsed, or specifically approved by Chaosium Inc. For more information about Chaosium Inc’s products, please visit [www.chaosium.com][chaosium].

## Installation

Installation is easy: search for `questworlds` in Foundry.

You can also use this manifest URL to install manually:

[`https://github.com/eggdropsoap/questworlds-fvtt/releases/latest/download/system.json`](https://github.com/eggdropsoap/questworlds-fvtt/releases/latest/download/system.json)

## Features

Since the QuestWorlds SRD itself is still in a state of flux, this implementation of a Foundry system module for QuestWorlds offers only the necessary features to play QuestWorlds in Foundry. The goals of the first release are:

- characters sheets that cover all necessary information for a PC
- simple contests with basic support for modifiers and variable resistance
- optional rune support for playing QuestWorlds in Glorantha, via GM-supplied font file(s)

While I would love to automate a lot of the paperwork and logic of QuestWorlds, accomplishing the first two core goals is enough to support the majority of in-session activities for the majority of QuestWorlds groups. GMs and players can handle sequences manually, using the support for contests plus journal notes for APs, scores, or whatnot from their sequence style of choice.

As an unexpected side effect, this simplicity also makes QuestWorlds-FVTT somewhat useful for playing earlier editions that use slightly different logic, modifier scales, and contest rules. Some easy optional support for ealier editions is provided.

Note that **no font files are included in QuestWorlds-FVTT.** Rune *support* is included, but requires the GM to install their desired font files during world setup in the system settings panel provided. This is for simple copyright reasons: I do not have permission to distribute anyone's font files with QuestWorlds-FVTT. As a bonus, this means you can use your preferred fonts for runes. [Chaosium provides a very nice rune font][runefont] that you might enjoy.

### 1. Contests

Simple contests are supported. A player clicking an ability will prompt to start a new contest with that ability as the Tactic. Contests are handled as chat cards that are visible only to the player and the GM until the final rolls are made. The limited visibility of contests before their final outcome is determined means less clutter in the chat for players when the GM is running group simple contests.

A contest chat card lists:

- possible benefits and consequences the PC has, and allows them to be selected
- an input for an arbitrary modifer covering all situatoinal modifiers
- a drop-down for setting the difficulty level of the Resistance

The player and GM can both set options for the contest, with the player having first. The contest details can be turned over to the GM for approval or further modifications. The contest card lets the player and GM pass control back and forth until both are satisfied—it's assumed that the GM and player will also be discussing the contest's details, but negotiations can be managed by simply setting options and turning it back over to the other person for approval.

Once the GM is satisfied with the contest details, they can click to approve the roll, giving control back to the player to finally roll the contest. Both the player roll and the Resistance/GM's rolls are automatically made and the contest card details are replaced with the result of the rolls and the outcome of the contest. The player's roll is shown on the left and the opposition/world/GM's roll is shown on the right. The outcome of comparing the rolls is listed underneath the dice results. The contest chat card is made public as soon as it is rolled.

Once a contest has been rolled, the player can spend one Story Point by right-clicking the chat card and choosing that option from the pop-out menu. The Story Point will appear as a badge on the character's roll result, and the Outcome of the contest will be recalculated with the added Success from the Story Point.

### 2. Character sheets

The character sheet is structured but freeform, in the spirit of QuestWorlds. The header contains the name, Concept, and portrait. Abilities, Benefits and Consequences, and Flaws have their own sections in the main centre section of the sheet's default tab. The footer of the default tab contains trackers for Ability Slots, Improvement Points, XP, and Story Points. The Biography tab has two text areas, one for a description and one for a biography; groups using the Prose method can use the description for their 100 words, and the other for their own more detailed background. The Art tab provides room for a gallery of images for the PC. The Notes tab provides room for a player's campaign notes.

To create abilities, benefits/consequences, or flaws, click the plus ("+") in the section's header.

- **Keywords and Abilities:** Items can be Abilities, Keywords, Sidekicks, or Magic Groups. Each has its own right-click menu that allows adding nested items appropriate to its type. The type of an ability-item can be changed by editing it and changing its type in the item sheet's header.
- **Benefits and Consequences:** Set a positive rating to make a Benefit and a negative rating to create a Consequence.
- **Flaws:** Flaws always have positive ratings. Flaws may have a zero rating, which can be useful for unrated Flaw notes like "Various spirit taboos", as sometimes seen on example character sheets.

In the footer, a manual number field tracks Ability Slots for character creation (and during play for the As You Go method). Players can update the number to help keep track of how many unused Ability Slots they have left.

Improvement Points work the same: players can use the three fields to keep track of the general-purpose Improvement Points during or left over from character creation, and separately the Ability-only and Keyword-only Improvement Points gained from advances.

Experience Points are tracked with the XP bar. An "add" button appears under the bar for the GM only, allowing granting XP. When players have enough XP to earn an advance, available advances are shown beside the bar. The available-advance indictator can be clicked to choose the two advancement options for that advance, which will be recorded in the character's advancement history. Choosing Improvement Points for an advance adds them to the appropriate trackers—all other options are left to the player to manually update on the sheet. Clicking the indicator when no advances are available shows the advancement history—useful for remembering which options you just picked, or for auditing advacement.

Story Points in the Story Point Pool are listed on the sheet, as well as in Foundry's Player List. Clicking on Story Points allows spending them as a player, or refreshing them as a GM. Dialog prompts check for confirmation, to avoid mis-clicks spending points accidentally. When using the Individual Story Points house rule option, the GM's controls are slightly different: click a player's individual points to awared a new Story Point, and click the Story Points header in the Player List to refresh everyone's Story Points.

## Bugs?

QuestWorlds-FVTT is currently in a beta state. There may be bugs. There will probably be bugs! You can report bugs at the [issues page](https://github.com/eggdropsoap/questworlds-fvtt/issues) or by using the [Bug Reporter](https://github.com/League-of-Foundry-Developers/bug-reporter) module (which you can install from Foundry's list of modules).

## New Features?

Feature requests are very welcome! QuestWorlds-FVTT is a work in progress. Feel free to submit feature requests to the [issue tracker][issues] or by getting my attention on the Foundry discord. Using the Bug Reporter module for feature requests is A-OK too, especially if you don't have or want to make a Github or Discord account just to ask for an improvement.

There seem to be as many ways to play QuestWorlds as there are groups who play it, and my hope is to provide a flexible Foundry system that can handle how you run your games. QuestWorlds-FVTT takes the QWSRD as core, and provides a few settings and features to accommodate variations from the QWSRD "rules as written". I hope to expand "a few" to "many", and telling me how QW-FVTT could work differently for your group is how to expand that beyond the current options. If there is a feature or option or change that would better support how your group plays QuestWorlds, including house rules or rules held over from previous editions, please do submit a feature request.

## Future plans

Opportunities for feature enhancements remain. Things I would like to see later include, in no particular order:

- guided character creation
- guided advancements
- more automation of sources of bonuses and penalties in contests
- more automation for gaining and spending Story Points and Experience Points
- built-in support for a table's choice of Sequences
- better support for groups using QuestWorlds with variant rules kept from earlier editions

This list is also a guide to what QuestWorlds-FVTT doesn't yet do, or does only partially or manually.

## A note on IP, credit due, and what QuestWorlds-FVTT isn't

“QuestWorlds” is a trademark of Chaosium, Inc. and is used here according to the principle of nominative use, which permits the use in publishing of an otherwise-trademarked term for naming and identifying a game for the purpose of indicating compatibility. No challenge to the trademark is intended nor inherent in this project. Specifically, the name QuestWorlds used within QuestWorlds-FVTT is of nominative use only, and no claim to ownership is made or implied. The title of this project has been chosen for the Foundry community to identify what roleplaying game the system module supports when listed among other system modules.

The QuestWorlds-FVTT system module is based on the rules described in the [QuestWorlds SRD][qwsrd] but copies no text from the SRD. QuestWorlds-FVTT therefore does not—and cannot—use the QuestWorlds Open Game License. QuestWorlds-FVTT is supplied under its own MIT license, which is as generous as possible so that the community can benefit as much as possible from its support for playing Chaosium's game online.

Although QuestWorlds-FVTT provides technical support for playing QuestWorlds online in Foundry VTT, it does not teach how to play. Users of the system module must consult the QuestWorlds SRD or one of Chaosium's many fine, earlier games based on the same system design, in order to make meaningful use of this system module.

Finally, a profound and heartfelt thanks to Ian Cooper and everyone backing the QuestWorlds SRD project at Chaosium, and its many community contributors. Although QuestWorlds-FVTT could still exist without the SRD, the generosity of Chaosium publishing their acclaimed narrative game under an open license is what excited my imagination again enough to embark on the daunting project of developing a system module for Foundry VTT. You are heroes. If the QuestWorlds SRD is a call to gather the clans, this is my raising the banner to heed the call.


  [qwsrd]: https://questworlds.chaosium.com
  [chaosium]: https://www.chaosium.com
  [runefont]: https://wellofdaliath.chaosium.com/home/gloranthan-documents/glorantha-2/glorantha-core-rune-font/
  [issues]: https://github.com/eggdropsoap/questworlds-fvtt/issues
