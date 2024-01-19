const { ActionRowBuilder, TextInputBuilder, ModalBuilder, TextInputStyle, ButtonBuilder, ButtonStyle, ComponentType, EmbedBuilder } = require('discord.js');
const dayjs = require('dayjs')
const customParseFormat = require('dayjs/plugin/customParseFormat')
dayjs.extend(customParseFormat)

const interId = 'pt'

defaultValues = { activityName: "", participantsNumber: "", date: "", requirement: "", tip: "" }

function formComponents(values = defaultValues) {
    return [
        new ActionRowBuilder({ components: [new TextInputBuilder({ value: values.activityName }).setCustomId('activityName').setLabel('Название активности').setStyle(TextInputStyle.Short).setMaxLength(30).setRequired(true)] }),
        new ActionRowBuilder({ components: [new TextInputBuilder({ value: values.participantsNumber }).setCustomId('participantsNumber').setLabel('Количество участников').setStyle(TextInputStyle.Short).setMaxLength(50).setRequired(true)] }),
        new ActionRowBuilder({ components: [new TextInputBuilder({ value: values.date }).setCustomId('date').setLabel('Дата и время сбора [дд.мм.гггг чч:мм +/-ч]').setStyle(TextInputStyle.Short).setMaxLength(50).setRequired(true)] }),
        new ActionRowBuilder({ components: [new TextInputBuilder({ value: values.requirement }).setCustomId('requirement').setLabel('Требования').setStyle(TextInputStyle.Short).setMaxLength(50).setRequired(false)] }),
        new ActionRowBuilder({ components: [new TextInputBuilder({ value: values.tip }).setCustomId('tip').setLabel('Примечание').setStyle(TextInputStyle.Paragraph).setMaxLength(200).setRequired(false)] })
    ]
}

module.exports = {
    id: interId,
    execute: async (interaction) => {
        const customId = interaction.customId.split(":")
        if (customId[0] !== interId) { return }
        console.log(customId)
        switch (customId[1]) {
            case "start":
                interaction.showModal(new ModalBuilder({
                    title: "Поиск компании", custom_id: `${interId}:modal`, components: formComponents()
                }))
                return
            case "modal":
                const values = {}
                interaction.fields.fields.map((field) => { Object.assign(values, { [field.customId]: field.value }) })
                function value(id) {
                    return interaction.fields.getField(id).value
                }
                const restartRow = new ActionRowBuilder({ components: [new ButtonBuilder({ custom_id: `${interId}:restart`, label: "Попробовать снова", style: ButtonStyle.Secondary })] })
                const inputDate = value('date').split(" ")
                const collectorFilter = (i) => { return ((i.user.id === interaction.user.id) && (i.customId.split(":")[0] === interId)) }
                let date

                try {
                    if (inputDate.length < 2 || inputDate.length > 3) {
                        throw "Что-то пропущено/лишнее в дате сбора. Попробуйте снова."
                    }
                    let offset = inputDate.length < 3 ? 0 : parseInt(inputDate[2])
                    if (isNaN(offset)) {
                        throw "Разница с МСК указана неправильно. Попробуйте снова."
                    }
                    if (offset > 9 || offset < -15) {
                        throw "Вы указали несуществующий часовой пояс. Попробуйте снова."
                    }
                    date = dayjs(`${inputDate[0]} ${inputDate[1]}`, 'DD-MM-YYYY HH:mm')
                    offset = -offset - 3
                    date = date.add(offset, 'hours')
                    if (!(date.isValid())) {
                        throw "Дата сбора указана неверно."
                    }
                    if (date.isBefore(new Date())) {
                        throw "Вы что, из прошлого? Укажите дату сбора правильно."
                    }
                } catch (e) {
                    const retryResponse = await interaction.reply({ content: typeof e === 'string' ? e : "Что-то пошло не так :/", ephemeral: true, components: [restartRow], fetchReply: true })
                    await retryResponse.awaitMessageComponent({ collectorFilter, time: 300_000 }).then((confirmation) => {
                        const customId = confirmation.customId.split(":")
                        if (customId[1] === 'restart') {

                            confirmation.showModal(new ModalBuilder({
                                title: "Поиск компании", custom_id: `${interId}:modal`, components: formComponents(values)
                            }))
                        }
                    }).catch(async (e) => {
                        await interaction.editReply({ content: typeof e === 'string' ? e : "Что-то пошло не так :/", ephemeral: true, components: [] })
                    })
                    return
                }
                const checkInfoResponse = await interaction.reply({
                    content: "Проверьте ввёденые данные", ephemeral: true, embeds: [new EmbedBuilder({
                        fields: [{ name: "Название активности", value: value("activityName") },
                        { name: "Количество участников", value: value('participantsNumber') },
                        { name: "Дата и время сбора", value: `<t:${date.unix()}>` },
                        { name: "Требования", value: value('requirement').length < 1 ? '_не указано_' : value('requirement') },
                        { name: "Примечание", value: value('tip').length < 1 ? '_не указано_' : value('tip') }]
                    })], components: [
                        new ActionRowBuilder({
                            components: [new ButtonBuilder({ label: "Подтвердить", custom_id: `${interId}:accept`, style: ButtonStyle.Success }),
                            new ButtonBuilder({ label: "Попробовать снова", custom_id: `${interId}:retry`, style: ButtonStyle.Secondary }),
                            new ButtonBuilder({ label: "Отменить", custom_id: `${interId}:cancel`, style: ButtonStyle.Danger })]
                        })
                    ], fetchReply: true
                })
                await checkInfoResponse.awaitMessageComponent({ collectorFilter, time: 120_000 }).then((confirmation) => {
                    const customId = confirmation.customId.split(":")
                    switch (customId[1]) {
                        case 'accept':
                            confirmation.update({ content: 'TODO', components: [], embeds: [] });
                            break
                        case 'retry':
                            confirmation.showModal(new ModalBuilder({
                                title: "Поиск компании", custom_id: `${interId}:modal`, components: formComponents(values)
                            }))
                            interaction.deleteReply()
                            break
                        case 'cancel':
                            confirmation.update({ content: 'И на этом всё.', components: [], embeds: [] });
                            break
                    }

                }).catch(async (e) => {
                    await interaction.editReply({ content: 'Вы настолько долго проверяли, что бот пошел спать.', components: [], embeds: [] });
                })
                return
        }
    }
}