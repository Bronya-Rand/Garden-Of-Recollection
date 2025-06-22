import { extension_settings } from "../../../extensions.js";
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
});

function setupWelcomeButton() {
	const reminisceButton = `
	<button class="bswan_reminisce menu_button menu_button_icon">
		<i class="fa-solid fa-photo-film"></i>
		<span data-i18n="Reminisce">Reminisce</span>
	</button>
	`;

	// check if shortcuts button div exists
	if ($("#chat .welcomeShortcuts").length > 0) {
		$("#chat .welcomeShortcuts").prepend(reminisceButton);
		$(".bswan_reminisce").on("click", async () => {
			await reminisceOld();
		});
		return;
	}

	const observer = new MutationObserver((_, obs) => {
		const welcomeShortcuts = $("#chat .welcomeShortcuts");
		if (welcomeShortcuts.length > 0) {
			welcomeShortcuts.prepend(reminisceButton);
			$(".bswan_reminisce").on("click", async () => {
				await reminisceOld();
			});
			obs.disconnect();
		}
	});

	observer.observe(document.querySelector("#chat"), {
		childList: true,
		subtree: true,
	});
}
