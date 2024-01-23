const { Events } = require('discord.js');
const { GuildInitialize, Parties } = require('../utils')

module.exports = {
	name: Events.ClientReady,
	execute: async (client) => {
		console.log(`Ready! Looogged in as ${client.user.tag}`);
		require("../deploy-commands")(client.user.id)

		process.disClient = client
		process.mongo = require('../mongodb')

		await Parties.checkMany(client)
		await Parties.checkAllParties(client)

		const guilds = client.guilds.cache.map(guild => guild);
		guilds.forEach(async guild => {
			try {
				await GuildInitialize.All(guild)
			} catch (e) {
				console.error(e)
			}
		})
	}
}
