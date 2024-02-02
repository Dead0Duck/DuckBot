const { Events, ActivityType } = require('discord.js');
const { GuildInitialize, Parties, Moderation } = require('../utils')
const { version } = require('../package.json');

module.exports = {
	name: Events.ClientReady,
	execute: async (client) => {
		console.log(`Ready! Looogged in as ${client.user.tag}`);
		require("../deploy-commands")(client.user.id)

		process.disClient = client
		process.mongo = require('../mongodb')

		client.user.setPresence({
			activities: [{ name: `v${version}`, type: ActivityType.Custom }],
		});

		await Parties.checkMany(client)
		await Parties.checkAllParties(client)

		const { AgendaScheduler } = process.mongo

		await AgendaScheduler.start()

		Moderation.defineJobs()

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
