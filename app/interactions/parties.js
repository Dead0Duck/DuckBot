const { ActionRowBuilder, TextInputBuilder, ModalBuilder, TextInputStyle } = require('discord.js');

const interId = 'pt'

module.exports = {
    id: interId,
    execute: async (interaction) => {
        const customId = interaction.customId.split(":")
        if (customId[0] !== 'pt') { return }
        switch (customId[1]) {
            case "start":
                interaction.showModal(new ModalBuilder({
                    title: "Поиск компании", custom_id: "pt:modal", components: [
                        new ActionRowBuilder({ components: [new TextInputBuilder().setCustomId('activityName').setLabel('Название активности').setStyle(TextInputStyle.Short).setMaxLength(30).setRequired(true)] }),
                        new ActionRowBuilder({ components: [new TextInputBuilder().setCustomId('participantsNumber').setLabel('Количество участников').setStyle(TextInputStyle.Short).setMaxLength(50).setRequired(true)] }),
                        new ActionRowBuilder({ components: [new TextInputBuilder().setCustomId('date').setLabel('Дата и время сбора [дд.мм.гггг чч:мм МСК+/-ч]').setStyle(TextInputStyle.Short).setMaxLength(50).setRequired(true)] }),
                        new ActionRowBuilder({ components: [new TextInputBuilder().setCustomId('requirement').setLabel('Требования').setStyle(TextInputStyle.Short).setMaxLength(50).setRequired(false)] }),
                        new ActionRowBuilder({ components: [new TextInputBuilder().setCustomId('tip').setLabel('Примечание').setStyle(TextInputStyle.Paragraph).setMaxLength(200).setRequired(false)] })
                    ]
                }))
                return
            case "modal":
                console.log(interaction.fields)
                interaction.reply({ content: "TODO", ephemeral: true })
        }
    }
}