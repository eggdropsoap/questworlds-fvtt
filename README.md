QuestWorlds-FVTT is a system module for Foundry VTT to support playing [_QuestWorlds_][qwsrd], the narrative RPG system from [Chaosium][chaosium].

# Installation

This system module is still in a pre-release state. I consider this an alpha release, suitable for developers but not actual play. As such it's not yet possible to install QuestWorlds-FVTT through the Foundry UI. To alpha-test or contribute fixes to the pre-release codebase, git clone into your Data folders and proceed from there. (Only those who understood that incomplete instruction should attempt to install QW-FVTT at the moment!)

QuestWorlds-FVTT is nearing a first beta release, which will coincide with installation being possible via copying and pasting a manifest file link into Foundry. With luck, a full release and installation by searching in Foundry will follow soon after.

# Limitations of this QuestWorlds system module

While the QuestWorlds SRD is still in a state of flux, this implementation of a Foundry system module for QuestWorlds offers only the necessary features to play QuestWorlds in Foundry. The goals of the first release are:

- characters sheets that cover all necessary information for a PC
- simple contests with basic support for modifiers and variable resistance
- optional rune support for playing QuestWorlds in Glorantha, via GM-supplied font file(s)

While I would love to automate a lot of the paperwork and logic of QuestWorlds, accomplishing the first two core goals is enough to support the majority of in-session activities for the majority of QuestWorlds groups. GMs and players can handle sequences manually, using the support for contests plus journal notes for APs, scores, or whatnot from their sequence style of choice.

As an unexpected side effect, this simplicity also makes QuestWorlds-FVTT somewhat useful for playing earlier editions of HQ and HW that use slightly different logic, modifier scales, and contest rules. Some easy optional support for older games is provided.

Opportunities for automation remain. Things I would like to see later include, in no particular order:

- guided character creation
- automation of advancements
- more automation of sources of bonuses and penalties in contests
- automated gaining and spending Story Points and Experience Points
- built-in support for a table's choice of sequences
- better support for groups using QuestWorlds with variant rules kept from earlier editions

This list is also a guide to what QuestWorlds-FVTT doesn't yet do, or does only partially or manually.

# A note on IP, credit due, and what QuestWorlds-FVTT isn't

“QuestWorlds” is a trademark of Chaosium, Inc. and is used here according to the principle of nominative use, which permits the use in publishing of an otherwise-trademarked term for naming and identifying a game for the purpose of indicating compatibility. No challenge to the trademark is intended nor inherent in this project. Specifically, the name QuestWorlds used within QuestWorlds-FVTT is of nominative use only, and no claim to ownership is made or implied. The title of this project has been chosen for the Foundry community to identify what roleplaying game the system module supports when listed among other system modules.

The QuestWorlds-FVTT system module is based on the rules described in the [QuestWorlds SRD][qwsrd] but copies no text from the SRD. QuestWorlds-FVTT therefore does not—and cannot—use the QuestWorlds Open Game License. QuestWorlds-FVTT is supplied under its own MIT license, which is as generous as possible so that the community can benefit as much as possible from its support for playing Chaosium's game online.

Although QuestWorlds-FVTT provides technical support for playing QuestWorlds online in Foundry VTT, it does not teach how to play. Users of the system module must consult the QuestWorlds SRD or one of Chaosium's many fine, earlier games based on the same system design, in order to make meaningful use of this system module.

Finally, a profound and heartfelt thanks to Ian Cooper and everyone backing the QuestWorlds SRD project at Chaosium, and its many community contributors. Although QuestWorlds-FVTT could still exist without the SRD, the generosity of Chaosium publishing their acclaimed narrative game under an open license is what excited my imagination again enough to embark on the daunting project of developing a system module for Foundry VTT. You are heroes. If the QuestWorlds SRD is a call to gather the clans, this is my raising the banner to heed the call.


  [qwsrd]: https://questworlds.chaosium.com
  [chaosium]: https://www.chaosium.com
