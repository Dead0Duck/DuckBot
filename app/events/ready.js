const { Events } = require('discord.js');
const { GuildInitialize } = require('../utils')

module.exports = {
	name: Events.ClientReady,
	execute: async (client) => {
		console.log(`Ready! Looogged in as ${client.user.tag}`);
		require("../deploy-commands")(client.user.id)

		process.disClient = client

		process.mongo = require('../mongodb')
		const { GuildSchema } = process.mongo

		const guilds = client.guilds.cache.map(guild => guild);
		guilds.forEach(async guild => {
			try {
				const data = await GuildSchema.findOne({ Guild: guild.id })
				if (data)
					return
			
				await GuildInitialize.All(guild)
				console.log(`Initializing new server ${guild.id}.`);
			} catch(e) {
				console.error(e)
			}
		})
	}
}
