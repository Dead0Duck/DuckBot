const mongoose = require('mongoose');
const Agenda = require("agenda");
const { MONGO_INITDB_ROOT_USERNAME, MONGO_INITDB_ROOT_PASSWORD } = process.env
const connectionString = `mongodb://mongo_db:27017/?authMechanism=DEFAULT&retryWrites=true&w=majority`
mongoose.connect(connectionString, { user: MONGO_INITDB_ROOT_USERNAME, pass: MONGO_INITDB_ROOT_PASSWORD }).then(console.log('Connected to Mongodb.'));
const agenda = new Agenda({ db: { address: connectionString } });

module.exports = {
	GuildSchema: require('./models/Guild'),
	UserSchema: require('./models/User'),
	PartySchema: require('./models/Party'),
	PollSchema: require('./models/Poll'),
	AgendaScheduler: agenda
}