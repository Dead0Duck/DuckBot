const dayjs = require('dayjs');
const { SlashCommandBuilder, PermissionsBitField } = require('discord.js');
const { Moderation } = require('../../utils')

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ban')
        .setDescription('Даёт бан указанному пользователю.')
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
                .setName("duration")
                .setNameLocalization('ru', 'длительность')
                .setDescription("Продолжительность бана в формате [число][первая буква единицы времени] либо 'перм'")
                .setRequired(true)
        )
        .addStringOption(option =>
            option
                .setName("reason")
                .setNameLocalization('ru', 'причина')
                .setDescription("Причина бана.")
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
            return await interaction.reply({ content: `Не удалось получить информацию о пользователе. Возможно он уже забанен либо вышел.`, ephemeral: true })
        }
        const ms = Moderation.parseMSeconds(options.getString('duration'))
        const { GuildSchema } = process.mongo
        if (member.id === interaction.applicationId) {
            return await interaction.reply({ content: "https://tenor.com/view/nope-team-fortress2-tf2-engineer-engineer-tf2-gif-24716491", ephemeral: true })
        }
        if (member.user.bot) {
            return await interaction.reply({ content: `Вы действительно хотите наказать бота?`, ephemeral: true })
        }
        if (!member.moderatable) {
            return await interaction.reply({ content: `У бота нет прав на блокировку этого пользователя.`, ephemeral: true })
        }
        if (!ms) {
            return await interaction.reply({ content: "Ошибка в аргументе продолжительности.", ephemeral: true })
        }
        if (ms < 60_000) {
            return await interaction.reply({ content: "Продолжительность бана не может быть менее минуты.", ephemeral: true })
        }
        try {
            const unbanDate = dayjs().add(ms, 'ms')
            await member.send(`Вас забанили на сервере "${interaction.guild.name}"\n\nКем: <@${interaction.user.id}>\nПричина: ${options.getString('reason')}\nРазбан <t:${unbanDate.unix()}:R>`).catch(() => { })
            member.ban({ reason: options.getString('reason') })
            const banData = await GuildSchema.findOne({ Guild: interaction.guild.id, Bans: { $elemMatch: { user: member.id } } }, { "Bans.$": 1 })
            if (!banData) {
                await GuildSchema.updateOne({ Guild: interaction.guild.id }, { $push: { Bans: { user: member.id, unban: unbanDate.toDate() } } })
            } else {
                await GuildSchema.updateOne({ Guild: interaction.guild.id, Bans: { $elemMatch: { user: member.id } } }, { $set: { "Bans.$[]": { user: member.id, unban: unbanDate.toDate() } } })
            }
            await interaction.reply({ content: `Пользователь <@${member.id}> был забанен. Разбан <t:${unbanDate.unix()}:R>.[⠀](https://media1.tenor.com/m/inFUO9hugS8AAAAd/danganronpa-monokuma.gif)`, ephemeral: true })
        } catch (e) {
            console.error(e)
        }
    },
};