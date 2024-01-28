const mongo = require('mongoose');

const Schema = new mongo.Schema({
	Guild: String,
	DataVersion: Number,

	VoiceCategory: String,
	VoiceTextCategory: String,
	VoiceCreate: String,
	VoiceCreateClosed: String,

	Settings: Object,

	PartiesThread: String,
	PartiesWebhookId: String,
	PartiesWebhookToken: String,

	Warnings: [{ user: String, counter: Number }]
});
module.exports = mongo.model('guilds', Schema);
