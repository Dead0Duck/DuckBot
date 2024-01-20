const mongo = require('mongoose');

const Schema = new mongo.Schema({
    ThreadId: String,
    CreatorId: String,
    ActivityName: String,
    ParticipantsNumber: String,
    Date: Date,
    DateUserInput: String,
    Requirement: String,
    Tip: String,
    UserMentions: [String],
    RoleMentions: [String],
});
module.exports = mongo.model('parties', Schema);
