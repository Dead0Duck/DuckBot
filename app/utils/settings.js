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

    const delPartiesChannelbtn = new ButtonBuilder()
        .setCustomId('delete_0' + (guildId.length !== 0 ? `:${guildId}` : ""))
        .setLabel('Удалить форум для поиска компаний')
        .setStyle(ButtonStyle.Danger)
        .setDisabled(typeof guildSettings.PartiesChannel === 'undefined' ? true : false)


    const firstRow = new ActionRowBuilder()
        .addComponents(partiesChannelbtn);

    const secondRow = new ActionRowBuilder()
        .addComponents(delPartiesChannelbtn)

    return { embed, firstRow, secondRow }
}



module.exports = { settingsComponents }