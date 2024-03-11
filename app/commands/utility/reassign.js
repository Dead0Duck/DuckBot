const { SlashCommandBuilder } = require('discord.js');
const { RoleDividers } = require('../../utils')

const cooldowns = new Map()

module.exports = {
    data: new SlashCommandBuilder()
        .setName('reassign')
        .setDescription('Обновить роли-разделители у всех участников сервера.')
        .setDefaultMemberPermissions(0)
        .setDMPermission(false),
    async execute(interaction) {
        if (cooldowns.get(interaction.guild.id))
            return await interaction.reply({ content: "Команду можно использовать лишь раз в минуту.", ephemeral: true })
        RoleDividers.massiveReassign(interaction.guild)
        cooldowns.set(interaction.guild.id, setTimeout(() => { cooldowns.delete(interaction.guild.id) }, 60_000))
        await interaction.reply({ content: "Обновлено.", ephemeral: true })
    },
};