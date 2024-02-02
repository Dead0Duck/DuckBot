const { SlashCommandBuilder, PermissionsBitField } = require('discord.js');
const { ban } = require('./ban')
const { Moderation } = require('../../utils');
const { parseMSeconds } = require('../../utils/moderation');
const dayjs = require('dayjs')

const humanCounter = new Map()

humanCounter.set(1, 'первое')
humanCounter.set(2, 'второе')
humanCounter.set(3, 'третье')

async function sendMemberWarn(member, counter, interaction, options, banDuration = null) {
    await member.send(`Вам было выдано ${humanCounter.get(counter)} предупреждение на сервере "${interaction.guild.name}"\n\nКем: <@${interaction.user.id}>\nПричина: ${options.getString('reason')}\n${counter > 2 ? `Вы получаете${banDuration ? ` ` : ` перманентный `}бан. ${banDuration ? `Разбан <t:${dayjs().add(banDuration, 'ms').unix()}:R>` : ``}` : ``}`).catch(() => { })
}

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
            let banDuration = null
            warnData = await GuildSchema.findOne({ Guild: interaction.guild.id, Warnings: { $elemMatch: { user: member.id } } }, { "Warnings.$": 1, "Settings": 1 })
            if (!warnData) {
                await GuildSchema.updateOne({ Guild: interaction.guild.id }, { $push: { Warnings: { user: member.id, counter: 1 } } })
            } else {
                counter = warnData.Warnings[0].counter + 1
                if (counter > 2) {
                    banDuration = warnData.Settings.WarnsPunish ? parseMSeconds(warnData.Settings.WarnsPunish) : 31_556_952_000
                    await GuildSchema.updateOne({ Guild: interaction.guild.id }, { $pull: { Warnings: { user: member.id } } })
                    sendMemberWarn(member, counter, interaction, options, banDuration)
                    ban(interaction, member, options, banDuration, false)
                }
                await GuildSchema.updateOne({ Guild: interaction.guild.id, Warnings: { $elemMatch: { user: member.id } } }, { $set: { "Warnings.$[]": { user: member.id, counter: counter } } })
            }
            sendMemberWarn(member, counter, interaction, options)
            await interaction.reply({ content: `Пользователю <@${member.id}> было выдано ${humanCounter.get(counter)} предупреждение. ${counter > 2 ? `Пользователь получает${banDuration ? ` ` : ` перманентный `}бан. ${banDuration ? `Разбан <t:${dayjs().add(banDuration, 'ms').unix()}:R>` : ``}` : ``}`, ephemeral: true })
        } catch (e) {
            console.error(e)
        }
    },
};