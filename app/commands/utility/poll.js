const { SlashCommandBuilder, EmbedBuilder, DiscordjsErrorCodes } = require('discord.js');
const { Poll } = require('../../utils');
const { reactions, renderFields, pollBuild } = Poll

const data = new SlashCommandBuilder()
    .setName('poll')
    .setDescription('Создать опрос.')
    .setDMPermission(false)
    .addStringOption(option => option.setName('title')
        .setNameLocalization('ru', 'заголовок')
        .setDescription('Заголовок для опроса.')
        .setRequired(true)
        .setMaxLength(70)
    )

for (let i = 1; i < 11; i++) {
    data.addStringOption(option => option.setName(`option${i}`)
        .setNameLocalization('ru', `вариант${i}`)
        .setDescription('Вариант ответа, за который можно будет проголосовать.')
        .setRequired(i < 3 ? true : false)
        .setMaxLength(50)
    )
}

data.addRoleOption(option => option.setName('role')
    .setNameLocalization('ru', 'роль')
    .setDescription('Роль, которую нужно пингануть.')
    .setRequired(false)
)
    .addStringOption(option => option.setName('color')
        .setNameLocalization('ru', 'цвет')
        .setDescription('Цвет в виде шестнадцатеричного кода (HEX). Пример: #123ABC')
        .setRequired(false)
        .setMaxLength(6)
    )
    // TODO: Реализовать дедлайны для пулов
    .addStringOption(option => option.setName('date')
        .setNameLocalization('ru', 'срок_окончания')
        .setDescription('Дата и время завершения опроса в след. формате: дата[пробел]время[пробел]разница с МСК')
        .setRequired(false)
        .setMaxLength(20)
    )

module.exports = {
    data: data,
    async execute(interaction) {
        const { PollSchema } = process.mongo
        await interaction.deferReply()
        const options = interaction.options
        const variants = options.data.filter(variant => variant.name.startsWith('option')).map((variant, i) => {
            return {
                id: i,
                value: variant.value,
            }
        })
        const { fields, optCounter } = renderFields(variants)
        try {
            const embed = pollBuild({ title: options.getString('title'), color: options.getString('color') }, fields)
            const roleToPing = options.getRole('role')
            const message = await interaction.followUp({ content: roleToPing ? `<@&${roleToPing.id}>` : null, embeds: [embed], fetchReply: true })
            await PollSchema.create({
                GuildId: interaction.guild.id,
                ChannelId: message.channelId,
                MessageId: message.id,
                Variants: variants
            })
            for (let i = 0; i <= (optCounter - 1); i++) {
                await message.react(reactions[i])
            }
        } catch (e) {
            if (e.code === DiscordjsErrorCodes.ColorConvert)
                return interaction.editReply({ content: 'Ошибка конвертирования цвета.', embeds: [] })
            console.error(e)
            return interaction.editReply({ content: 'Произошла ошибка.', embeds: [] })
        }
    },
};