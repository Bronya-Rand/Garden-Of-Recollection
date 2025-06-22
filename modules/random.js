import { getContext } from "../../../../extensions.js";
import { delay } from "../../../../utils.js";
import {
	resetSelectedGroup,
	openGroupById,
	openGroupChat,
} from "../../../../group-chats.js";
import { extension_settings } from "../../../../extensions.js";
import {
	doNewChat,
	setCharacterId,
	setActiveCharacter,
	setActiveGroup,
	openCharacterChat,
	selectCharacterById,
} from "../../../../../script.js";
import { extensionName } from "../constants.js";

function weightRandom(items) {
	if (!items || items.length === 0) {
		return null;
	}
	if (items.length === 1) {
		return items[0];
	}

	// calculate weights based on recency
	const weights = calculateWeights(items);

	// Weighted random selection
	const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
	let randomValue = Math.random() * totalWeight;

	for (let i = 0; i < items.length; i++) {
		randomValue -= weights[i];
		if (randomValue <= 0) {
			return items[i];
		}
	}

	// Fallback in case of rounding errors (should not happen)
	return items[0];
}

function calculateWeights(items) {
	const weights = [];
	const currentTime = Date.now();
	const randomness = extension_settings[extensionName].randomness || 0.5;

	// get the oldest chat time from the items
	let oldestChatTime = currentTime;
	for (const item of items) {
		const lastChatTime = item.date_last_chat || 0;
		if (lastChatTime > 0 && lastChatTime < oldestChatTime) {
			oldestChatTime = lastChatTime;
		}
	}

	// Max time difference to consider for weighting
	const maxTimeDifference =
		oldestChatTime > 0
			? currentTime - oldestChatTime
			: 365 * 24 * 60 * 60 * 1000; // 1 year in milliseconds

	for (const item of items) {
		// For characters/group chats with no chats, default to 0 (very old chat)
		const lastChatTime = item.date_last_chat || 0;

		let recency = 0;
		if (lastChatTime > 0) {
			const timeDiff = currentTime - lastChatTime;
			// Normalize against the spread of time differences
			recency = 1 - Math.min(1, timeDiff / maxTimeDifference);
		}

		// Invert recency to get base weight (lower recency, higher weight)
		let weight = 1 - recency;

		// Apply logarithmic scaling for older chats
		if (weight > 0.5) {
			weight = 0.5 + Math.log(1 + (weight - 0.5) * 2) / 2;
		}

		// Apply randomness factor
		weight = weight * (1 - randomness) + randomness;

		weights.push(weight);
	}

	return weights;
}

// Gets a random chat that already exists.
export async function reminisceOld() {
	if (extension_settings[extensionName].recollectionMode === 0) {
		toastr.error(
			"Enable the Garden of Recollection to reminisce.",
			"Garden of Recollection Not Enabled",
		);
		return;
	}

	const context = getContext();

	let randomChat = null;

	switch (extension_settings[extensionName].recollectionMode) {
		case 1: {
			// character only
			if (!context.characters || context.characters.length === 0) {
				toastr.error(
					"Add a character to SillyTavern in order to reminisce.",
					"No Characters Found",
				);
				return;
			}

			// filter characters that have no chats (typically `chat_size` is 0)
			// and remove the current chat from the list
			const charactersWithChats = context.characters
				.filter((character) => character.chat_size > 0)
				.filter((character) => character.chat !== context.chatId);

			if (charactersWithChats.length === 0) {
				toastr.error(
					"Begin a chat with more than 1 character before reminiscing.",
					"No Chats Found",
				);
				return;
			}

			randomChat = weightRandom(charactersWithChats);
			break;
		}
		case 2: {
			// group only
			if (!context.groups || context.groups.length === 0) {
				toastr.error(
					"Add a group to SillyTavern in order to reminisce.",
					"No Groups Found",
				);
				return;
			}

			// filter groups that have no chats (typically `chat_size` is 0)
			// and remove the current chat from the list
			const groupsWithChats = context.groups
				.filter((group) => group.chat_size > 0)
				.filter((group) => group.id !== context.chatId);

			if (groupsWithChats.length === 0) {
				toastr.error(
					"Begin a chat with more than 1 group chat before reminiscing.",
					"No Chats Found",
				);
				return;
			}

			randomChat = weightRandom(groupsWithChats);
			break;
		}
		case 3: {
			// character and group

			// exit if no characters and groups exist
			if (
				(!context.characters || context.characters.length === 0) &&
				(!context.groups || context.groups.length === 0)
			) {
				toastr.error(
					"Add a character or create a group chat in SillyTavern in order to reminisce.",
					"No Characters and Groups Found",
				);
				return;
			}

			const chats = [];

			if (context.characters && context.characters.length > 0) {
				const charactersWithChats = context.characters
					.filter((character) => character.chat_size > 0)
					.filter((character) => character.chat !== context.chatId);
				if (charactersWithChats.length > 0) {
					chats.push(...charactersWithChats);
				}
			}

			if (context.groups && context.groups.length > 0) {
				const groupsWithChats = context.groups
					.filter((group) => group.chat_size > 0)
					.filter((group) => group.id !== context.chatId);
				if (groupsWithChats.length > 0) {
					chats.push(...groupsWithChats);
				}
			}

			if (chats.length === 0) {
				toastr.error(
					"Begin a chat with more than 1 characters and/or group chats before reminiscing.",
					"No Chats Found",
				);
				return;
			}

			randomChat = weightRandom(chats);
			break;
		}
	}

	if (!randomChat) {
		switch (extension_settings[extensionName].recollectionMode) {
			case 1:
				toastr.error(
					"Could not find a suitable character to reminisce with.",
					"No Suitable Character Found",
				);
				break;
			case 2:
				toastr.error(
					"Could not find a suitable group chat to reminisce with.",
					"No Suitable Group Chat Found",
				);
				break;
			case 3:
				toastr.error(
					"Could not find a suitable character or group chat to reminisce with.",
					"No Suitable Chat Found",
				);
				break;
		}
		return;
	}

	switch (extension_settings[extensionName].recollectionMode) {
		case 1: {
			// character only
			const characterIndex = context.characters.indexOf(randomChat);
			if (characterIndex === -1) {
				toastr.error(
					"The selected random character could not be found.",
					"Character Not Found",
				);
				return;
			}
			await selectCharacterById(characterIndex);
			await openCharacterChat(randomChat.chat);
			toastr.success(`Reminiscing with ${randomChat.name}.`, "Reminiscing");
			break;
		}
		case 2: {
			await openGroupById(randomChat.id);
			await openGroupChat(randomChat.id, randomChat.chat);

			toastr.success(
				`Reminiscing with group chat: ${randomChat.name}.`,
				"Reminiscing",
			);
			break;
		}
		case 3: {
			// character and group

			// check if chat is a group chat (has an `id` property)
			const isGroupChat = randomChat.id !== undefined;

			if (!isGroupChat) {
				// randomChat is a character
				const characterIndexForChat = context.characters.indexOf(randomChat);
				if (characterIndexForChat === -1) {
					toastr.error(
						"The selected random character could not be found.",
						"Character Not Found",
					);
					return;
				}
				await selectCharacterById(characterIndexForChat);
				await openCharacterChat(randomChat.chat);

				toastr.success(`Reminiscing with ${randomChat.name}.`, "Reminiscing");
			} else {
				// randomChat is a group
				await openGroupById(randomChat.id);
				await openGroupChat(randomChat.id, randomChat.chat);

				toastr.success(
					`Reminiscing with group chat: ${randomChat.name}.`,
					"Reminiscing",
				);
			}
			break;
		}
	}
}

// Creates a new chat with a random character.
// Contrary to reminisceOld, this does not require the character to have any chats.
export async function reminisceNew() {
	const context = getContext();
	const characters = context.characters;

	if (!characters || characters.length === 0) {
		toastr.error(
			"Add a character to SillyTavern in order to reminisce.",
			"No Characters Found",
		);
		return;
	}

	const charactersWithoutCurrentChat = characters.filter(
		(character) => character.chat !== context.chatId,
	);

	const randomCharacter = weightRandom(charactersWithoutCurrentChat);
	if (!randomCharacter) {
		toastr.error(
			"Could not find a suitable character to reminisce with.",
			"No Suitable Character Found",
		);
		return;
	}

	const index = characters.indexOf(randomCharacter);
	if (index === -1) {
		toastr.error(
			"The selected random character could not be found.",
			"Character Not Found",
		);
		return;
	}

	// Create a new chat with the random character
	resetSelectedGroup();
	setCharacterId(index);
	setActiveCharacter(characters[index].avatar);
	setActiveGroup(null);
	await delay(1);
	await doNewChat({ deleteCurrentChat: false });

	toastr.success(`Reminiscing with ${characters[index].name}.`, "Reminiscing");
}
