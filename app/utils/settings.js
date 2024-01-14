const { ButtonBuilder, ButtonStyle, ActionRowBuilder, EmbedBuilder } = require('discord.js');

function settingsComponents(guildSettings, guild, guildId = "") {
    const guildName = guild.name
    const guildIconURL = guild.iconURL()

    const embed = new EmbedBuilder()
        .setTitle("Настройки")
        .setAuthor({ name: guildName, iconURL: guildIconURL })
        .addFields({
            name: "Форум для поиска компаний",
            value: `${typeof guildSettings.PartiesChannel === 'undefined' ? "не указан" : `<#${guildSettings.PartiesChannel}>`}`,
            inline: true
        });

    const partiesChannelbtn = new ButtonBuilder()
        .setCustomId('setting_0' + (guildId.length !== 0 ? `:${guildId}` : ""))
        .setLabel('Указать форум для поиска компаний')
        .setStyle(ButtonStyle.Secondary)

    const deleteSettings = new ButtonBuilder()
        .setCustomId('void' + (guildId.length !== 0 ? `:${guildId}` : ""))
        .setLabel('Удалить параметр')
        .setStyle(ButtonStyle.Danger)


    const firstRow = new ActionRowBuilder()
        .addComponents(partiesChannelbtn);

    const secondRow = new ActionRowBuilder()
        .addComponents(deleteSettings)

    return { embed, firstRow, secondRow }
}



module.exports = { settingsComponents }