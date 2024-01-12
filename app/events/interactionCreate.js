const { ActionRowBuilder, Events, ButtonBuilder, ButtonStyle, ChannelSelectMenuBuilder, ChannelType } = require('discord.js');

module.exports = {
	name: Events.InteractionCreate,
	execute: async (interaction) => {

		if (!interaction.isChatInputCommand()) {
			const { GuildSchema } = process.mongo;

			if (interaction.customId.includes("setting")) {
				switch (interaction.customId) {
					case "setting_0":
						const channelSelect = new ChannelSelectMenuBuilder()
							.setCustomId("apply_0")
							.setChannelTypes(ChannelType.GuildForum)
							.setMaxValues(1)
						const firstRow = new ActionRowBuilder().addComponents(channelSelect)
						await interaction.update({ content: "Укажите форум для поиска компаний.", components: [firstRow], ephemeral: true, embeds: [] })
						return
				}
			}

			if (interaction.customId.includes("apply")) {

				switch (interaction.customId) {
					case "apply_0":
						await GuildSchema.updateOne({ Guild: interaction.guild.id }, { $set: { "Settings.PartiesChannel": interaction.values[0] } })
						await interaction.update({ content: "Параметр установлен.", ephemeral: true, components: [] })
						return
				}
			}

			if (interaction.customId.includes("delete")) {

				switch (interaction.customId) {
					case "delete_0":
						await GuildSchema.updateOne({ Guild: interaction.guild.id }, { $unset: { "Settings.PartiesChannel": "" } })
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
