const { Events } = require('discord.js');

async function sendMessage(text, interaction)
{
	if (interaction.replied || interaction.deferred) {
		await interaction.followUp({ content: text, ephemeral: true });
	} else {
		await interaction.reply({ content: text, ephemeral: true });
	}
}

module.exports = {
	name: Events.InteractionCreate,
	execute: async (interaction) => {

		let command
		if (interaction.isChatInputCommand()) {
			command = interaction.client.commands.get(interaction.commandName);
			if (!command) {
				console.error(`No command matching ${interaction.commandName} was found.`);
				await sendMessage(`Команда \`${interaction.commandName}\` не найдена!`, interaction)
				return;
			}
		}
		else
		{
			let id = interaction.customId.split(":")
			command = interaction.client.interactions.get(id[0]);
			if (!command) {
				console.error(`No interaction matching ${interaction.customId} was found.`);
				await sendMessage(`Действие \`${interaction.customId}\` не найдено!`, interaction)
				return;
			}
		}

		if (command.exclusive && command.exclusive != interaction.guildId) {
			return false;
		}

		try {
			await command.execute(interaction);
		} catch (error) {
			console.error(error);
			await sendMessage("Ошибка при выполнении этого взаимодействия!", interaction)
		}
	}
}
