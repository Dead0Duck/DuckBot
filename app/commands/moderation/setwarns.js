const { SlashCommandBuilder, PermissionsBitField } = require('discord.js');
const { Moderation } = require('../../utils');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setwarns')
        .setDescription('Устанавливает количество варнов пользователю.')
        .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator)
        .setDMPermission(false)
        .addUserOption(option =>
            option
                .setName("user")
                .setNameLocalization('ru', 'пользователь')
                .setDescription("Пользователь, которому надо установить количество варнов.")
                .setRequired(true)
        )
        .addIntegerOption(option =>
            option
                .setName("counter")
                .setNameLocalization('ru', 'количество')
                .setDescription("Количество варнов.")
                .setRequired(true)
        )
        .addStringOption(option =>
            option
                .setName("note")
                .setNameLocalization('ru', 'заметка')
                .setDescription("Примечание или описание ситуации.")
                .setRequired(false)
        ),
    async execute(interaction) {
        const options = interaction.options
        const member = options.getMember('user')
        if (!member) {
            return await interaction.reply({ content: `Не удалось получить информацию о пользователе.`, ephemeral: true })
        }
        const { GuildSchema } = process.mongo
        const counter = options.getInteger('counter')
        if (member.id === interaction.applicationId) {
            return await interaction.reply({ content: "https://tenor.com/view/cat-no-nonono-noooo-cat-no-gif-25423213", ephemeral: true })
        }
        if (member.user.bot) {
            return await interaction.reply({ content: `У ботов не может быть варнов.`, ephemeral: true })
        }
        if (!member.moderatable) {
            return await interaction.reply({ content: `У бота нет прав на установку количества варнов этого пользователя.`, ephemeral: true })
        }
        if (counter > 2) {
            return await interaction.reply({ content: 'Установить количество варнов можно не более двух.', ephemeral: true })
        }
        if (counter < 0) {
            return await interaction.reply({ content: 'Число не может быть отрицательным.', ephemeral: true })
        }
        try {
            warnData = await GuildSchema.findOne({ Guild: interaction.guild.id, Warnings: { $elemMatch: { user: member.id } } }, { "Warnings.$": 1 })
            if (!warnData) {
                await GuildSchema.updateOne({ Guild: interaction.guild.id }, { $push: { Warnings: { user: member.id, counter: counter } } })
            } else {
                if (counter === 0) {
                    await GuildSchema.updateOne({ Guild: interaction.guild.id }, { $pull: { Warnings: { user: member.id } } })
                } else
                    await GuildSchema.updateOne({ Guild: interaction.guild.id, Warnings: { $elemMatch: { user: member.id } } }, { $set: { "Warnings.$[]": { user: member.id, counter: counter } } })
            }
            await interaction.reply({ content: `Пользователю <@${member.id}> было установлено ${[`0 варнов`, `1 варн`, `2 варна`][counter]}.`, ephemeral: true })
            Moderation.log(interaction, 'Изменение счёта предупреждений', `<@${interaction.user.id}> установил пользователю <@${member.id}> ${[`0 варнов`, `1 варн`, `2 варна`][counter]}.`, options, { id: member.id, color: 'FFB800', iconURL: 'https://i.imgur.com/NeCLhK3.png' })
        } catch (e) {
            console.error(e)
        }
    },
};