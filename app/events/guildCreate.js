const { Events } = require('discord.js')
const { settingsComponents } = require('../utils/settings')

module.exports = {
    name: Events.GuildCreate,
    execute: async (guild) => {
        const { GuildSchema } = process.mongo;

        const guildData = await GuildSchema.findOne({ Guild: guild.id })
        const { embed, firstRow, secondRow } = settingsComponents(guildData.Settings, guild, guild.id)

        if (typeof guildData.FirstJoin === 'undefined') {
            await GuildSchema.updateOne({ Guild: guild.id }, { $set: { "FirstJoin": new Date() } })

            guild.fetchOwner().then((owner) => {
                owner.send(
                    {
                        // TODO: написать нормальное приветствие 
                        content: "Hello!",
                        embeds: [embed],
                        components: [firstRow, secondRow]
                    }
                )
            })
        }
    }
}