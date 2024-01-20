const { ActionRowBuilder, TextInputBuilder, ModalBuilder, TextInputStyle, ButtonBuilder, ButtonStyle, ComponentType, EmbedBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, DiscordjsErrorCodes, MentionableSelectMenuBuilder, WebhookClient } = require('discord.js');
const dayjs = require('dayjs')
const customParseFormat = require('dayjs/plugin/customParseFormat')
dayjs.extend(customParseFormat)

const interId = 'pt'

defaultValues = { activityName: "", participantsNumber: "", date: "", requirement: "", tip: "" }

function formComponents(values = defaultValues) {
    return [
        new ActionRowBuilder({ components: [new TextInputBuilder({ value: values.activityName }).setCustomId('activityName').setLabel('Название активности').setStyle(TextInputStyle.Short).setMaxLength(30).setRequired(true)] }),
        new ActionRowBuilder({ components: [new TextInputBuilder({ value: values.participantsNumber }).setCustomId('participantsNumber').setLabel('Количество участников').setStyle(TextInputStyle.Short).setMaxLength(50).setRequired(true)] }),
        new ActionRowBuilder({ components: [new TextInputBuilder({ value: values.date }).setCustomId('date').setLabel('Дата и время сбора [дд.мм.гггг чч:мм +/-ч]').setStyle(TextInputStyle.Short).setMaxLength(20).setRequired(true)] }),
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
                const restartRow = new ActionRowBuilder({ components: [new ButtonBuilder({ custom_id: `${interId}:restart`, label: "Попробовать снова", style: ButtonStyle.Secondary })] })
                const inputDate = values.date.split(" ")
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
                        throw "Вы указали несуществующий часовой пояс в поле для даты сбора. Попробуйте снова."
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
                        interaction.deleteReply()
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
                const timerMSeconds = 120_000
                const checkInfoResponse = await interaction.reply({
                    content: `Проверьте введённые данные. Диалог закроется <t:${dayjs().add(timerMSeconds, 'milliseconds').unix()}:R>.`, ephemeral: true, embeds: [new EmbedBuilder({
                        fields: [{ name: "Название активности", value: values.activityName },
                        { name: "Количество участников", value: values.participantsNumber },
                        { name: "Дата и время сбора", value: `<t:${date.unix()}>` },
                        { name: "Требования", value: values.requirement.length < 1 ? '_не указано_' : values.requirement },
                        { name: "Примечание", value: values.tip.length < 1 ? '_не указано_' : values.tip }]
                    })], components: [
                        new ActionRowBuilder({
                            components: [new ButtonBuilder({ label: "Подтвердить", custom_id: `${interId}:accept`, style: ButtonStyle.Success }),
                            new ButtonBuilder({ label: "Попробовать снова", custom_id: `${interId}:retry`, style: ButtonStyle.Secondary }),
                            new ButtonBuilder({ label: "Отменить", custom_id: `${interId}:cancel`, style: ButtonStyle.Danger })]
                        })
                    ], fetchReply: true
                })
                await checkInfoResponse.awaitMessageComponent({ collectorFilter, time: timerMSeconds }).then(async (confirmation) => {
                    const customId = confirmation.customId.split(":")
                    switch (customId[1]) {
                        case 'accept':
                            const tags = confirmation.channel.parent.availableTags
                            let tagConfirmation
                            let forumTag = null
                            if (tags.length > 0) {
                                const tagsSelect = new StringSelectMenuBuilder().setCustomId(`${interId}:tag`).setMaxValues(1)
                                tags.forEach((tag) => {
                                    console.log(tag)
                                    tagsSelect.addOptions(
                                        new StringSelectMenuOptionBuilder().setLabel(tag.name).setValue(tag.id).setEmoji(tag.emoji.id == null ? tag.emoji.name : tag.emoji.id)
                                    )
                                })
                                const tagResponse = await confirmation.update({
                                    content: `Выберите соответствующий тег для вашей активности. Диалог закроется <t:${dayjs().add(timerMSeconds, 'milliseconds').unix()}:R>.`, components: [
                                        new ActionRowBuilder({ components: [tagsSelect] })
                                    ], embeds: [], fetchReply: true
                                })
                                tagConfirmation = await tagResponse.awaitMessageComponent({ collectorFilter, time: timerMSeconds })
                                forumTag = tagConfirmation.values[0]

                            } else {
                                tagConfirmation = confirmation
                            }
                            console.log(forumTag)
                            const inviteResponse = await tagConfirmation.update({
                                content: `Выберите тех, кого вы хотели бы пригласить. Диалог закроется <t:${dayjs().add(timerMSeconds, 'milliseconds').unix()}:R>.`, components: [
                                    new ActionRowBuilder({
                                        components: [
                                            new MentionableSelectMenuBuilder({ custom_id: `${interId}:invite`, max_values: 10 })
                                        ]
                                    }),
                                    new ActionRowBuilder({
                                        components: [
                                            new ButtonBuilder({ custom_id: `${interId}:skipInvite`, label: "Пропустить", style: ButtonStyle.Secondary })
                                        ]
                                    })
                                ], embeds: []
                            })
                            const inviteConfirmation = await inviteResponse.awaitMessageComponent({ collectorFilter, time: timerMSeconds })
                            const customId = inviteConfirmation.customId.split(":")
                            let stringInvites = ""
                            if (customId[1] === 'invite') {
                                mentionableUsers = inviteConfirmation.users
                                inviteConfirmation.roles.forEach((role) => {
                                    stringInvites += `<@&${role.id}> `
                                })
                                inviteConfirmation.users.forEach((user) => {
                                    stringInvites += `<@${user.id}> `
                                })
                            }
                            const { GuildSchema } = process.mongo;
                            const guildData = await GuildSchema.findOne({ Guild: inviteConfirmation.guild.id })

                            const webhookClient = new WebhookClient({ id: guildData.PartiesWebhookId, token: guildData.PartiesWebhookToken })

                            await webhookClient.send({
                                threadName: values.activityName, username: inviteConfirmation.user.username,
                                avatarURL: inviteConfirmation.user.avatarURL(),
                                content:
                                    `* \`👥 Количество участников:\` ${values.participantsNumber}\n` +
                                    `* \`🕐 Дата и время сбора:\` <t:${date.unix()}>\n` +
                                    (values.requirement.length > 0 ? `* \`⚠️ Требования:\` ${values.requirement}\n` : '') +
                                    (stringInvites.length > 0 ? `* \`✉️ Приглашаю:\` ${stringInvites}\n` : '') +
                                    (values.tip.length > 0 ? `* \`📝 Примечание:\` ${values.tip}` : ''),
                            })
                                .then(async (thread) => {
                                    inviteConfirmation.channel.parent.threads.fetch(thread.id).then(channel => channel.setAppliedTags([forumTag]))
                                    await inviteConfirmation.update({ content: `Канал создан: <#${thread.id}>\nЖелаю хорошего совместного времяпровождения!`, components: [] })
                                }).catch(async (e) => {
                                    await inviteConfirmation.update({ content: 'Произошла ошибка во время создания канала.', components: [] })
                                    console.error(e)
                                })
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
                    if (e.code === DiscordjsErrorCodes.InteractionCollectorError)
                        await interaction.editReply({ content: 'Вы настолько долго не отвечали, что бот пошел спать.', components: [], embeds: [] });
                    else
                        console.error(e)
                })
                return
        }
    }
}