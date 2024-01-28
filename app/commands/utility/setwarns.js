const { SlashCommandBuilder, PermissionsBitField } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setwarns')
        .setDescription('Устанавливает количество варнов пользователю.')
        .setDefaultMemberPermissions(PermissionsBitField.Flags.BanMembers)
        .setDMPermission(false)
        .addUserOption(option =>
            option
                .setName("user")
                .setDescription("Пользователь, которому надо установить количество варнов.")
                .setRequired(true)
        )
        .addIntegerOption(option =>
            option
                .setName("counter")
                .setDescription("Количество варнов.")
                .setRequired(true)
        )
        .addStringOption(option =>
            option
                .setName("tip")
                .setDescription("Примечание или описание ситуации.")
                .setRequired(false)
        ),
    async execute(interaction) {
        const options = interaction.options
        const member = options.getMember('user')
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
        if (counter > 3) {
            return await interaction.reply({ content: 'Количество варнов не может быть более трёх.', ephemeral: true })
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
            await interaction.reply({ content: `Пользователю <@${member.id}> было установлено такое количество варнов: ${counter}`, ephemeral: true })
        } catch (e) {
            console.error(e)
        }
    },
};