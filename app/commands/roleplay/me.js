const { SlashCommandBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('me')
		.setDescription('РП: Действие от первого лица')
		.addStringOption(option =>
			option
				.setName('text')
				.setDescription('Действие')
				.setRequired(true)),
	async execute(interaction) {
		let text = interaction.options.getString('text')
		await interaction.reply(`<@${interaction.user.id}> ${text}`)
	},
};