import { SlashCommand } from "../../../../slash-commands/SlashCommand.js";
import {
	ARGUMENT_TYPE,
	SlashCommandNamedArgument,
} from "../../../../slash-commands/SlashCommandArgument.js";
import { SlashCommandParser } from "../../../../slash-commands/SlashCommandParser.js";
import {
	SlashCommandEnumValue,
	enumTypes,
} from "../../../../slash-commands/SlashCommandEnumValue.js";

import { extension_settings } from "../../../../extensions.js";
import { saveSettingsDebounced } from "../../../../../script.js";
import { extensionName } from "../constants.js"; 

import { reminisceNew, reminisceOld } from "./random.js";

export function prepareSlashCommands() {
	SlashCommandParser.addCommandObject(
		SlashCommand.fromProps({
			name: "reminisce",
			callback: async () => {
                reminisceOld();
                return Promise.resolve();
            },
			helpString:
				"(The Garden of Recollection) Reminisce with a random character/group chat.",
		}),
	);

	SlashCommandParser.addCommandObject(
		SlashCommand.fromProps({
			name: "reminisce-new",
			callback: async () => {
                reminisceNew();
                return Promise.resolve();
            },
			helpString:
				"(The Garden of Recollection) Reminisce with a random character in a new chat.",
		}),
	);

	SlashCommandParser.addCommandObject(
		SlashCommand.fromProps({
			name: "set-recollection-mode",
			/** @type {(args: { mode: string | undefined }) => void} */
			callback: async (args, _) => {
				const oldRecollectionMode =
					extension_settings[extensionName].recollectionMode;

				if (args.mode === "none") {
					switchRecollectionMode(0);
				} else if (args.mode === "characters") {
					switchRecollectionMode(1);
				} else if (args.mode === "groups") {
					switchRecollectionMode(2);
				} else if (args.mode === "all") {
					switchRecollectionMode(3);
				} else {
					console.error(
						`[${extensionName}] Invalid recollection mode: ${args.mode}`,
					);
					return;
				}

				if (args.mode !== "none") {
					if (oldRecollectionMode === 0) {
						toastr.success(
							`Enabled the Garden of Recollection and set the mode to ${args.mode === "all" ? "Reminisce All" : args.mode === "characters" ? "Reminisce Characters" : "Reminisce Groups"}`,
							"Recollection Mode Enabled",
						);
					} else {
						toastr.success(
							`Recollection mode set to (${args.mode === "all" ? "Reminisce All" : args.mode === "characters" ? "Reminisce Characters" : "Reminisce Groups"})`,
							"Recollection Mode Changed",
						);
					}
				} else {
					toastr.success(
						"Disabled the Garden of Recollection",
						"Recollection Mode Disabled",
					);
				}
				return String(extension_settings[extensionName].recollectionMode);
			},
			namedArgumentList: [
				SlashCommandNamedArgument.fromProps({
					name: "mode",
					description: "The mode to switch to.",
					isRequired: true,
					typeList: [ARGUMENT_TYPE.STRING],
					enumList: [
						new SlashCommandEnumValue(
							"none",
							"Disables the Garden of Recollection.",
                            enumTypes.namedArgument,
						),
						new SlashCommandEnumValue(
							"characters",
							"Reminisce with characters only.",
                            enumTypes.namedArgument,
						),
						new SlashCommandEnumValue(
							"groups",
							"Reminisce with groups chats only.",
                            enumTypes.namedArgument,
						),
						new SlashCommandEnumValue(
							"all",
							"Reminisce with characters and group chats.",
                            enumTypes.namedArgument,
						),
					],
				}),
			],
			helpString: "(The Garden of Recollection) Set the recollection mode.",
		}),
	);
}

function switchRecollectionMode(mode) {
	extension_settings[extensionName].recollectionMode = mode;
	saveSettingsDebounced();
	$("#bswan-recollection-mode").val(mode).trigger("change");
}