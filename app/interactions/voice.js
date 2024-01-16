const { VoiceChannels } = require('../utils');

const stateText = {
	"hide": "скрыт",
	"lock": "закрыт",
	"unlock": "открыт"
}

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
				await VoiceChannels.Commands.SetVoiceState(voiceChannel, customId[1]);
				await interaction.reply({ content: `Канал теперь ${stateText[ customId[1] ]}.`, ephemeral: true })
		}
	},
}