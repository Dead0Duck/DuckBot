const { SlashCommandBuilder, PermissionsBitField } = require('discord.js');

const humanCounter = new Map()

humanCounter.set(1, 'первое')
humanCounter.set(2, 'второе')
humanCounter.set(3, 'третье')

module.exports = {
    data: new SlashCommandBuilder()
        .setName('warn')
        .setDescription('Даёт предупреждение указанному пользователю.')
        .setDefaultMemberPermissions(PermissionsBitField.Flags.BanMembers)
        .setDMPermission(false)
        .addUserOption(option =>
            option
                .setName("user")
                .setNameLocalization('ru', 'пользователь')
                .setDescription("Пользователь, которого нужно наказать.")
                .setRequired(true)
        )
        .addStringOption(option =>
            option
                .setName("reason")
                .setNameLocalization('ru', 'причина')
                .setDescription("Причина варна.")
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
        if (member.id === interaction.applicationId) {
            return await interaction.reply({ content: "https://tenor.com/view/jotaro-kujo-jojo-bizarre-adventure-no-no-no-no-nope-gif-14295799", ephemeral: true })
        }
        if (member.user.bot) {
            return await interaction.reply({ content: `Вы действительно хотите наказать бота?`, ephemeral: true })
        }
        if (!member.moderatable) {
            return await interaction.reply({ content: `У бота нет прав на варн этого пользователя.`, ephemeral: true })
        }
        try {
            let counter = 1
            warnData = await GuildSchema.findOne({ Guild: interaction.guild.id, Warnings: { $elemMatch: { user: member.id } } }, { "Warnings.$": 1 })
            if (!warnData) {
                await GuildSchema.updateOne({ Guild: interaction.guild.id }, { $push: { Warnings: { user: member.id, counter: 1 } } })
            } else {
                // TODO: выдача бана, если counter 3 и удаление объекта
                counter = warnData.Warnings[0].counter + 1
                await GuildSchema.updateOne({ Guild: interaction.guild.id, Warnings: { $elemMatch: { user: member.id } } }, { $set: { "Warnings.$[]": { user: member.id, counter: counter } } })
            }
            await interaction.reply({ content: `Пользователю <@${member.id}> было выдано ${humanCounter.get(counter)} предупреждение.`, ephemeral: true })
            await member.send(`Вам было выдано предупреждение.\n\nКем: <@${interaction.user.id}>\nПричина: ${options.getString('reason')}`)
        } catch (e) {
            console.error(e)
        }
    },
};