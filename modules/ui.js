import { extension_settings } from "../../../../extensions.js";
import { saveSettingsDebounced } from "../../../../../script.js";
import { extensionName } from "../constants.js";

// Handles the recollection mode change.
export function onRecollectionModeChange() {
	const value = Number($(this).val());
	if (Number.isNaN(value) || value < 0 || value > 3) {
		toastr.error(`Invalid recollection mode: ${value}.`);
		return;
	}
	extension_settings[extensionName].recollectionMode = value;
	saveSettingsDebounced();
}

// Handles the randomness input change.
export function onRandomnessInputChange() {
	const value = Number($(this).val());
	if (Number.isNaN(value) || value < 0 || value > 1) {
		toastr.error(
			`Invalid randomness value: ${value}.`,
		);
		return;
	}
	extension_settings[extensionName].randomness = value;
	$("#bswan-recollection-randomness").val(value);
	$("#bswan-recollection-randomness-counter").val(value);
	saveSettingsDebounced();
}

export function restoreRandomness() {
	extension_settings[extensionName].randomness = 0.5;
	$("#bswan-recollection-randomness").val(0.5);
	$("#bswan-recollection-randomness-counter").val(0.5);
	saveSettingsDebounced();
}

export function setupRecollectionHTML() {
	$("#bswan-recollection-mode")
		.val(extension_settings[extensionName].recollectionMode)
		.trigger("change");
	$("#bswan-recollection-randomness").val(
		extension_settings[extensionName].randomness,
	);
	$("#bswan-recollection-randomness-counter")
		.val(extension_settings[extensionName].randomness)
		.trigger("input");
}

export function setupRecollectionJQuery() {
	$("#bswan-recollection-mode").on("change", onRecollectionModeChange);
	$("#bswan-recollection-randomness").on("input", onRandomnessInputChange);
	$("#bswan-recollection-randomness-counter").on(
		"input",
		onRandomnessInputChange,
	);
	$("#bswan-recollection-randomness-restore").on("click", restoreRandomness);
}
