const { Events } = require('discord.js')
const { Poll } = require('../utils')

module.exports = {
    name: Events.MessageReactionRemove,
    execute: async (messageReaction, user) => {
        Poll.checkVote(messageReaction, user, -1)
    }
}