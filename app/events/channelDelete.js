const { Events } = require('discord.js')
const { Parties } = require('../utils')

module.exports = {
    name: Events.ChannelDelete,
    execute: async (channel) => {
        await Parties.checkOne({ "Settings.PartiesChannel": channel.id })
    }
}