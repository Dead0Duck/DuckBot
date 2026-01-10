const mongoose = require('mongoose');
const Agenda = require("agenda");
const { MONGO_INITDB_ROOT_USERNAME, MONGO_INITDB_ROOT_PASSWORD } = process.env
const connectionString = `mongodb://${MONGO_INITDB_ROOT_USERNAME}:${MONGO_INITDB_ROOT_PASSWORD}@mongo_db:27017/?authMechanism=DEFAULT&retryWrites=true&w=majority`
mongoose.connect(connectionString).then(console.log('Connected to Mongodb.'));
const agenda = new Agenda({ db: { address: connectionString } });

module.exports = {
	GuildSchema: require('./models/Guild'),
	UserSchema: require('./models/User'),
	PartySchema: require('./models/Party'),
	AgendaScheduler: agenda
}