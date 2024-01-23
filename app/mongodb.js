const mongoose = require('mongoose');
const { MONGO_INITDB_ROOT_USERNAME, MONGO_INITDB_ROOT_PASSWORD } = process.env
mongoose.connect(`mongodb://mongo_db:27017/?authMechanism=DEFAULT&retryWrites=true&w=majority`, { user: MONGO_INITDB_ROOT_USERNAME, pass: MONGO_INITDB_ROOT_PASSWORD }).then(console.log('Connected to Mongodb.'));

module.exports = {
	GuildSchema: require('./models/Guild'),
	UserSchema: require('./models/User'),
	PartySchema: require('./models/Party')
}