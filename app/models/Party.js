const mongo = require('mongoose');

const Schema = new mongo.Schema({
    ThreadId: String,
    CreatorId: String,
    StartDate: Date,
    InputValues: Object,
    UserMentionsId: [String],
    RoleMentionsId: [String],
});
module.exports = mongo.model('parties', Schema);
