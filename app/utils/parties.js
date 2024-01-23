module.exports = {
    checkMany: async (client) => {
        const { GuildSchema } = process.mongo;
        const guildData = await GuildSchema.find({ PartiesThread: { $exists: true } })

        guildData.forEach(async (guildData) => {
            client.guilds.fetch(guildData.Guild).then(
                async (guild) => {
                    if (!(guild.channels.cache.find(channel => channel.id === guildData.PartiesThread))) {
                        await GuildSchema.updateOne({ Guild: guild.id }, {
                            $unset: {
                                "PartiesThread": "",
                                "Settings.PartiesChannel": ""
                            }
                        })
                    }
                }
            )
        })
    },
    checkOne: async (filter) => {
        const { GuildSchema } = process.mongo;
        const guildData = await GuildSchema.findOne(filter)
        if (guildData) {
            await GuildSchema.updateOne(filter, {
                $unset: {
                    "PartiesThread": "",
                    "Settings.PartiesChannel": ""
                }
            })
        }
    },
    checkOneParty: async (threadId) => {
        const { PartySchema } = process.mongo
        const partyData = await PartySchema.findOne({ ThreadId: threadId })
        if (partyData) {
            await PartySchema.deleteOne({ ThreadId: threadId })
        }
    },
    checkAllParties: async (client) => {
        const { PartySchema } = process.mongo
        const partiesData = await PartySchema.find({ ThreadId: { $exists: true } })
        partiesData.forEach(async (partyData) => {
            client.channels.fetch(partyData.ThreadId).catch(async () => {
                await PartySchema.deleteOne({ ThreadId: partyData.ThreadId })
            })
        })
    }
}
