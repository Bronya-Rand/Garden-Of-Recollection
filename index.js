import { extension_settings, renderExtensionTemplateAsync } from "../../../extensions.js";
import {
	extensionName,
	extensionFolderPath,
	defaultSettings,
} from "./constants.js";
import { reminisceOld } from "./modules/random.js";
import { prepareSlashCommands } from "./modules/slash-command.js";
import {
	setupRecollectionJQuery,
	setupRecollectionHTML,
} from "./modules/ui.js";

async function loadSettings() {
	extension_settings[extensionName] = extension_settings[extensionName] || {};
	if (Object.keys(extension_settings[extensionName]).length === 0) {
		Object.assign(extension_settings[extensionName], defaultSettings);
	}

	setupRecollectionHTML();
}

jQuery(async () => {
	const settingsHtml = await $.get(`${extensionFolderPath}/html/settings.html`);
	$("#extensions_settings").append(settingsHtml);

	loadSettings();

	setupRecollectionJQuery();
	prepareSlashCommands();

	setupWelcomeButton();
	setupCharacterPanelButton();

	const wandButtonHtml = await renderExtensionTemplateAsync(
		`third-party/${extensionName}/html`,
		"wand_buttons",
	);
	$("#extensionsMenu").append(wandButtonHtml);
	$("#bswan-wand-reminisce").on("click", async () => {
		await reminisceOld();
	});
});

function setupWelcomeButton() {
	const reminisceButton = `
	<a id="bswan_reminisce_welcome_button" class="bswan_reminisce menu_button menu_button_icon">
		<i class="fa-solid fa-photo-film"></i>
		<span data-i18n="Reminisce">Reminisce</span>
	</a>
	`;

	// check if shortcuts button div exists
	if ($("#chat .welcomeShortcuts").length > 0) {
		if ($("#chat .welcomeShortcuts").find("#bswan_reminisce_welcome_button").length === 0) {
			$("#chat .welcomeShortcuts").prepend(reminisceButton);
			$("#bswan_reminisce_welcome_button").on("click", async () => {
				await reminisceOld();
			});
			return;
		}
	}

	const observer = new MutationObserver((_, obs) => {
		const welcomeShortcuts = $("#chat .welcomeShortcuts");
		if (welcomeShortcuts.length > 0) {
			if (welcomeShortcuts.find("#bswan_reminisce_welcome_button").length === 0) {
				welcomeShortcuts.prepend(reminisceButton);
				$("#bswan_reminisce_welcome_button").on("click", async () => {
					await reminisceOld();
				});
			}
			// obs.disconnect();
		}
	});

	observer.observe(document.querySelector("#chat"), {
		childList: true,
		subtree: true,
	});
}

function setupCharacterPanelButton() {
	const reminisceButton = `
	<a id="bswan_reminsice_character_button" class="bswan_reminisce menu_button menu_button_icon" title="Reminisce">
		<i class="fa-solid fa-photo-film"></i>
	</a>
	`;

	const charSearchInput = $("#character_search_bar");
	const charOrder = $("#character_sort_order");

	$('#form_character_search_form').append(reminisceButton, [charSearchInput, charOrder]);
	$("#bswan_reminsice_character_button").on("click", async () => {
		await reminisceOld();
	});
}
