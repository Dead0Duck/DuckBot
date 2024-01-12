const { SlashCommandBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('settings')
        .setDescription('Настройки сервера.')
        .setDefaultMemberPermissions(0),
    async execute(interaction) {
        const { GuildSchema } = process.mongo;

        const guildId = interaction.guild.id
        const guildData = await GuildSchema.findOne({ Guild: guildId })

        const embed = new EmbedBuilder()
            .setTitle("Настройки")
            .setAuthor({ name: interaction.guild.name, iconURL: interaction.guild.iconURL() })
            .addFields({
                name: "Форум для поиска компаний",
                value: `${typeof guildData.Settings.PartiesChannel === 'undefined' ? "не указан" : `<#${guildData.Settings.PartiesChannel}>`}`,
                inline: true
            });

        const partiesChannelbtn = new ButtonBuilder()
            .setCustomId('setting_0')
            .setLabel('Указать форум для поиска компаний')
            .setStyle(ButtonStyle.Secondary)

        const firstRow = new ActionRowBuilder()
            .addComponents(partiesChannelbtn);

        const delPartiesChannelbtn = new ButtonBuilder()
            .setCustomId('delete_0')
            .setLabel('Удалить форум для поиска компаний')
            .setStyle(ButtonStyle.Danger)
            .setDisabled(typeof guildData.Settings.PartiesChannel === 'undefined' ? true : false)

        const secondRow = new ActionRowBuilder()
            .addComponents(delPartiesChannelbtn)

        await interaction.reply({ embeds: [embed], components: [firstRow, secondRow], ephemeral: true })
    },
};