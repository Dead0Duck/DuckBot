const { SlashCommandBuilder } = require('discord.js');
const { VoiceChannels } = require('../../utils');

const stateText = {
	"hide": "скрыт",
	"lock": "закрыт",
	"unlock": "открыт"
}

module.exports = {
	data: new SlashCommandBuilder()
		.setName('voice')
		.setDescription('Взаимодействие с личным каналом.')
		.addSubcommand(subcommand =>
			subcommand
				.setName('unlock')
				.setDescription('Открыть личный канал.'))
		.addSubcommand(subcommand =>
			subcommand
				.setName('lock')
				.setDescription('Закрыть личный канал.'))
		.addSubcommand(subcommand =>
			subcommand
				.setName('hide')
				.setDescription('Скрыть личный канал.'))
		.addSubcommand(subcommand =>
			subcommand
				.setName('ban')
				.setDescription('Забанить пользователя, что ограничит ему доступ к личному каналу.')
				.addUserOption(option => option.setName('target').setDescription('Пользователь')))
		.addSubcommand(subcommand =>
			subcommand
				.setName('kick')
				.setDescription('Выгнать пользователя из личного канала.')
				.addUserOption(option => option.setName('target').setDescription('Пользователь')))
		.addSubcommand(subcommand =>
			subcommand
				.setName('owner')
				.setDescription('Передать права владельца на личный канал.')
				.addUserOption(option => option.setName('target').setDescription('Пользователь'))),
	async execute(interaction) {
		let member = interaction.member;
		let state = member.voice;
		let channel = state && state.channel
		if (!channel)
			return await interaction.reply({ content: `Вы не находитесь в голосовых чатах.`, ephemeral: true });

		let isVoice = await VoiceChannels.IsVoiceChannel(channel)
		if (!isVoice)
			return await interaction.reply({ content: `Вы не находитесь в личном канале.`, ephemeral: true });

		let ownerId = VoiceChannels.GetOwner(channel)
		if (member.id != ownerId)
			return await interaction.reply({ content: `Вы не владелеете личным каналом.`, ephemeral: true });


		let cmd = interaction.options.getSubcommand();
		switch(cmd)
		{
			case "hide":
			case "lock":
			case "unlock":
				await VoiceChannels.Commands.SetVoiceState(channel, cmd);
				await interaction.reply({ content: `Канал теперь ${ stateText[cmd] }.`, ephemeral: true })
				return;
		}
	},
};
