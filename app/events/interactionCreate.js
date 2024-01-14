const { ActionRowBuilder, Events, ButtonBuilder, ButtonStyle, ChannelSelectMenuBuilder, ChannelType, StringSelectMenuBuilder, StringSelectMenuOptionBuilder } = require('discord.js');

module.exports = {
	name: Events.InteractionCreate,
	execute: async (interaction) => {

		if (!interaction.isChatInputCommand()) {
			const { GuildSchema } = process.mongo;
			const customId = interaction.customId.split(":")
			const guildId = (customId.length > 1 ? customId[1] : interaction.guild.id)

			if (interaction.customId.includes("setting")) {
				switch (customId[0]) {
					case "setting_0":
						const channelSelect = (customId.length < 2 ? new ChannelSelectMenuBuilder() : new StringSelectMenuBuilder())
						if (customId.length < 2) {
							channelSelect
								.setCustomId("apply_0")
								.setChannelTypes(ChannelType.GuildForum)
								.setMaxValues(1)
						} else {
							channelSelect
								.setCustomId("apply_0:" + guildId)
								.setMaxValues(1)
							interaction.client.guilds.resolve(guildId).channels.cache.filter(x => x.isThreadOnly()).map((channel) => {
								channelSelect.addOptions(
									new StringSelectMenuOptionBuilder()
										.setLabel(channel.name)
										.setValue(channel.id)
								)
								console.log(channel.name, channel.id)
							})
							console.log(channelSelect)
						}
						const firstRow = new ActionRowBuilder().addComponents(channelSelect)
						await interaction.update({ content: "Укажите форум для поиска компаний.", components: [firstRow], ephemeral: true, embeds: [] })
						return
				}
			}

			if (interaction.customId.includes("apply")) {

				switch (customId[0]) {
					case "apply_0":
						await GuildSchema.updateOne({ Guild: guildId }, { $set: { "Settings.PartiesChannel": interaction.values[0] } })
						await interaction.update({ content: "Параметр установлен.", ephemeral: true, components: [] })
						return
				}
			}

			if (interaction.customId.includes("delete")) {

				switch (customId[0]) {
					case "delete_0":
						await GuildSchema.updateOne({ Guild: guildId }, { $unset: { "Settings.PartiesChannel": "" } })
						await interaction.update({ content: "Параметр удален.", ephemeral: true, embeds: [], components: [] })
						return
				}
			}
		};
		const command = interaction.client.commands.get(interaction.commandName);

		if (!command) {
			console.error(`No command matching ${interaction.commandName} was found.`);
			return;
		}

		if (!process.env.GUILD_ID && command.exclusive && command.exclusive != interaction.guildId) {
			return false;
		}

		try {
			await command.execute(interaction);
		} catch (error) {
			console.error(error);
			if (interaction.replied || interaction.deferred) {
				await interaction.followUp({ content: 'There was an error while executing this command!', ephemeral: true });
			} else {
				await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
			}
		}



	}
}
