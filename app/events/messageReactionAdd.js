const { Events } = require('discord.js')
const { Poll } = require('../utils')

module.exports = {
    name: Events.MessageReactionAdd,
    execute: async (messageReaction, user) => {
        Poll.checkVote(messageReaction, user, 1)
    }
}