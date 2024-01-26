const { StringSelectMenuBuilder, StringSelectMenuOptionBuilder, ActionRowBuilder } = require('discord.js')
const { VoiceChannels } = require('../utils');

const interId = "voice"
module.exports = {
	id: interId,
	execute: async (interaction) => {
		const customId = interaction.customId.split(":")
		if (customId.length < 2) { return }

		let textChannel = interaction.channel
		let voiceChannel = await VoiceChannels.GetVoiceChannel(textChannel)

		switch(customId[1])
		{
			case "hide":
			case "lock":
			case "unlock":
				await VoiceChannels.Commands.SetVoiceState(interaction, voiceChannel, customId[1]);
				break;
			case "owner":
				if (customId[2] == "select")
				{
					let newOwnerId = interaction.values[0]
					let newOwner = await interaction.guild.members.fetch(newOwnerId)
					await VoiceChannels.Commands.SetVoiceOwner(interaction, voiceChannel, newOwner)

					return
				}

				const select = new StringSelectMenuBuilder()
					.setCustomId('voice:owner:select')
					.setPlaceholder('Участники...')

				let owner = VoiceChannels.GetOwner(voiceChannel)
				voiceChannel.members.each(member => {
					if (member.id == owner)
						return

					select.addOptions(
						new StringSelectMenuOptionBuilder()
							.setLabel(member.displayName)
							.setValue(member.id)
					)
				});

				if (select.options.length == 0)
				{
					await interaction.reply({
						content: 'В личном канале недостаточно человек для передачи прав.',
						ephemeral: true,
					});
					return
				}

				const row = new ActionRowBuilder()
					.addComponents(select);

				await interaction.reply({
					content: 'Выберите нового владельца',
					components: [row],
					ephemeral: true,
				});

				break;
		}
	},
}