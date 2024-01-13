const { SlashCommandBuilder } = require('discord.js');
const { settingsComponents } = require('../../utils/settings')

module.exports = {
    data: new SlashCommandBuilder()
        .setName('settings')
        .setDescription('Настройки сервера.')
        .setDefaultMemberPermissions(0),
    async execute(interaction) {
        const { GuildSchema } = process.mongo;

        const guildId = interaction.guild.id
        const guildData = await GuildSchema.findOne({ Guild: guildId })

        const { embed, firstRow, secondRow } = settingsComponents(guildData.Settings, interaction.guild)

        await interaction.reply({ embeds: [embed], components: [firstRow, secondRow], ephemeral: true })
    },
};