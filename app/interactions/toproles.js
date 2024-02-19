const { EmbedBuilder } = require("discord.js")

function embedTop(roles) {
    const embed = new EmbedBuilder({ title: `Топ-${roles.size || roles.length} ролей` })
    let i = 1
    let desc = ''
    roles.sort((a, b) => b.members.size - a.members.size).map(role => {
        desc += `${i++}. <@&${role.id}>: **${role.members.size} 👤**\n`
    })
    embed.setDescription(desc)
    return embed
}

const interId = "tr"
module.exports = {
    id: interId,
    execute: async (interaction) => {
        const customId = interaction.customId.split(":")
        await interaction.guild.members.fetch({ force: true })
        if (customId[1] === 'selected') {
            interaction.reply({ ephemeral: true, embeds: [embedTop(interaction.roles)] })
        }
        if (customId[1] === 'all') {
            interaction.reply({ ephemeral: true, embeds: [embedTop(interaction.guild.roles.cache.sort((a, b) => b.members.size - a.members.size).filter(role => role.id !== interaction.guild.id).first(10))] })
        }
    }
}