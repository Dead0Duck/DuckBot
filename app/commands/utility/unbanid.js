const dayjs = require('dayjs');
const { SlashCommandBuilder, PermissionsBitField, ActionRowBuilder, ButtonBuilder, ButtonStyle, DiscordjsErrorCodes } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('unbanid')
        .setDescription('Разблокировка пользователя по ID.')
        .setDefaultMemberPermissions(PermissionsBitField.Flags.BanMembers)
        .setDMPermission(false)
        .addStringOption(option =>
            option
                .setName("ID")
                .setDescription("ID Пользователя, которого нужно разбанить.")
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
        const interId = 'md'
        const options = interaction.options
        const userId = options.getString('user')
        const collectorFilter = (i) => { return ((i.user.id === interaction.user.id) && (i.customId.split(":")[0] === interId)) }
        const { GuildSchema } = process.mongo
        banData = await GuildSchema.findOne({ Guild: interaction.guild.id, Bans: { $elemMatch: { user: userId } } }, { "Bans.$": 1 })
        if (!banData && !interaction.guild.bans.cache.find(ban => ban.user.id === userId)) {
            return await interaction.reply({ content: 'Пользователя не найдено в списке банов.', ephemeral: true });
        }
        const question = await interaction.reply({
            content: `Разбан этого пользователя произойдёт <t:${dayjs(banData.Bans[0].unban).unix()}:R>.\nВы уверены, что хотите разбанить досрочно?`, components: [
                new ActionRowBuilder({
                    components: [
                        new ButtonBuilder({ custom_id: `${interId}:confirmBan`, label: `Да`, style: ButtonStyle.Danger }),
                        new ButtonBuilder({ custom_id: `${interId}:declineBan`, label: `Нет`, style: ButtonStyle.Secondary })
                    ]
                })
            ], ephemeral: true, fetchReply: true
        })
        try {
            const response = await question.awaitMessageComponent({ filter: collectorFilter, time: 20_000 })
            const customId = response.customId.split(":")
            switch (customId[1]) {
                case "confirmBan":
                    await interaction.guild.bans.remove(userId)
                    await GuildSchema.updateOne({ Guild: interaction.guild.id }, { $pull: { Bans: { user: userId } } })
                    await response.reply({ content: `Пользователь разбанен.`, ephemeral: true })
                    return
                case "declineBan":
                    return await interaction.deleteReply()
            }
        } catch (e) {
            if (e.code === DiscordjsErrorCodes.InteractionCollectorError)
                await interaction.editReply({ content: 'Действие отменено.', components: [], embeds: [] });
            else
                console.error(e)
        }
    },
};