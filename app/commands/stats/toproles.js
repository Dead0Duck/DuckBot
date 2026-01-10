const { SlashCommandBuilder, ActionRowBuilder, RoleSelectMenuBuilder, ComponentType, ButtonBuilder, ButtonStyle } = require('discord.js');
const { InteractionContextType } = require('discord.js');
const topRoles = require('../../interactions/toproles')

module.exports = {
    data: new SlashCommandBuilder()
        .setName('toproles')
        .setDescription('Статистика ролей на сервере.')
        .setContexts([InteractionContextType.Guild]),
    async execute(interaction) {
        await interaction.reply({
            content: 'Выберите интересующие Вас роли:', ephemeral: true, components: [
                new ActionRowBuilder({
                    components: [
                        new RoleSelectMenuBuilder({ custom_id: `${topRoles.id}:selected`, max_values: 10 }),
                    ]
                }),
                new ActionRowBuilder({
                    components: [
                        new ButtonBuilder({ custom_id: `${topRoles.id}:all`, label: 'Топ-10 из всех ролей', emoji: '📊', style: ButtonStyle.Secondary })
                    ]
                })
            ]
        })
    },
};