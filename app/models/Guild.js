const mongo = require('mongoose');

const Schema = new mongo.Schema({
	Guild: String,
	DataVersion: Number,
	
	VoiceCategory: String,
	VoiceTextCategory: String,
	VoiceCreate: String,
	VoiceCreateClosed: String,
});
module.exports = mongo.model('guilds', Schema);
