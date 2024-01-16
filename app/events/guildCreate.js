const { Events } = require('discord.js')
const { GuildInitialize } = require('../utils')

module.exports = {
    name: Events.GuildCreate,
    execute: async (guild) => {
        const { GuildSchema } = process.mongo;

        try {
            await GuildInitialize.All(guild)
            console.log(`Joined new server ${guild.id}.`);
        } catch (e) {
            console.error(e)
        }
    }
}