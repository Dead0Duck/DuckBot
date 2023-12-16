const { SlashCommandBuilder } = require('discord.js');

module.exports = {
	exclusive: '518352655790374913',
	data: new SlashCommandBuilder()
		.setName('ping')
		.setDescription('Replies with Pong!'),
	async execute(interaction) {
		await interaction.reply('Pong!');
	},
};
