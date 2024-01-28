const { SlashCommandBuilder, PermissionsBitField } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('getwarns')
        .setDescription('Узнать количество варнов у пользователя.')
        .setDMPermission(false)
        .addUserOption(option =>
            option
                .setName("user")
                .setDescription("Пользователь, у которого вы хотите узнать количество варнов.")
                .setRequired(true)
        ),
    async execute(interaction) {
        const options = interaction.options
        const member = options.getMember('user')
        const { GuildSchema } = process.mongo
        if (member.user.bot) {
            return await interaction.reply({ content: `У ботов не могут быть никаких варнов.`, ephemeral: true })
        }
        try {
            warnData = await GuildSchema.findOne({ Guild: interaction.guild.id, Warnings: { $elemMatch: { user: member.id } } }, { "Warnings.$": 1 })
            if (!warnData) {
                await interaction.reply({ content: `У пользователя <@${member.id}> нету никаких варнов.`, ephemeral: true })
            } else {
                await interaction.reply({ content: `У пользователя <@${member.id}> такое количество варнов: ${warnData.Warnings[0].counter}`, ephemeral: true })
            }
        } catch (e) {
            console.error(e)
        }
    },
};