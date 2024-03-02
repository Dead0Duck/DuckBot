const mongo = require('mongoose');

const Schema = new mongo.Schema({
    GuildId: String,
    ChannelId: String,
    MessageId: String,

    Variants: [{ id: Number, value: String }],

    DeadLineDate: Date,
});
module.exports = mongo.model('poll', Schema);
