const { ActionRowBuilder, TextInputBuilder, ModalBuilder, TextInputStyle, ButtonBuilder, ButtonStyle, ComponentType, EmbedBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, DiscordjsErrorCodes, MentionableSelectMenuBuilder, WebhookClient, PermissionsBitField } = require('discord.js');
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

function validateDate(inputDate) {
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
    return date
}

function messageParty(userId, partNumber, date, requirement, stringInvites, tip) {
    return `* \`👑 Организатор:\` <@${userId}>\n` +
        `* \`👥 Количество участников:\` ${partNumber}\n` +
        `* \`🕐 Дата и время сбора:\` <t:${date.unix()}>\n` +
        (requirement.length > 0 ? `* \`⚠️ Требования:\` ${requirement}\n` : '') +
        (stringInvites.length > 0 ? `* \`✉️ Приглашаю:\` ${stringInvites}\n` : '') +
        (tip.length > 0 ? `* \`📝 Примечание:\` ${tip}` : '')
}

function mentionsGen(users, roles) {
    stringInvites = ""
    const userMentions = []
    const roleMentions = []

    if (typeof roles !== 'undefined') {
        roles.forEach((role) => {
            stringInvites += `<@&${role.id}> `
            roleMentions.push(role.id)
        })
    }

    if (typeof users !== 'undefined') {
        users.forEach((user) => {
            stringInvites += `<@${user.id}> `
            userMentions.push(user.id)
        })
    }
    return { stringInvites, userMentions, roleMentions }
}

module.exports = {
    id: interId,
    execute: async (interaction) => {
        const customId = interaction.customId.split(":")
        const collectorFilter = (i) => { return ((i.user.id === interaction.user.id) && (i.customId.split(":")[0] === interId)) }
        const { GuildSchema, PartySchema } = process.mongo;
        const guildData = await GuildSchema.findOne({ Guild: interaction.guild.id })
        const webhookClient = new WebhookClient({ id: guildData.PartiesWebhookId, token: guildData.PartiesWebhookToken })
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
                let date
                try {
                    date = validateDate(inputDate)
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

                            const { stringInvites, userMentions, roleMentions } = mentionsGen(inviteConfirmation.users, inviteConfirmation.roles)


                            await webhookClient.send({
                                threadName: values.activityName, username: inviteConfirmation.user.username,
                                avatarURL: inviteConfirmation.user.avatarURL(),
                                content: messageParty(inviteConfirmation.user.id, values.participantsNumber, date, values.requirement, stringInvites, values.tip),
                                components: [new ActionRowBuilder({
                                    components: [
                                        new ButtonBuilder({ custom_id: `${interId}:deleteParty`, label: "Удалить", style: ButtonStyle.Danger }),
                                        new ButtonBuilder({ custom_id: `${interId}:editParty`, label: "Редактировать", style: ButtonStyle.Secondary }),
                                        new ButtonBuilder({ custom_id: `${interId}:finishParty`, label: "Завершено", style: ButtonStyle.Success })
                                    ]
                                })]
                            })
                                .then(async (thread) => {
                                    inviteConfirmation.channel.parent.threads.fetch(thread.id).then(channel => channel.setAppliedTags([forumTag]))
                                    await inviteConfirmation.update({ content: `Канал создан: <#${thread.id}>\nЖелаю хорошего совместного времяпровождения!\n\n\`⚠️ После 30 минут от начала сбора канал закроется.\``, components: [] })
                                    const { PartySchema } = process.mongo;
                                    await PartySchema.create({
                                        ThreadId: thread.id,
                                        CreatorId: inviteConfirmation.user.id,
                                        ActivityName: values.activityName,
                                        ParticipantsNumber: values.participantsNumber,
                                        Date: date.toDate(),
                                        DateUserInput: values.date,
                                        Requirement: values.requirement,
                                        Tip: values.tip,
                                        UserMentions: userMentions,
                                        RoleMentions: roleMentions
                                    })

                                }).catch(async (e) => {
                                    await inviteConfirmation.update({ content: 'Произошла ошибка во время создания канала.', components: [] })
                                    console.error(e)
                                })
                            break
                        case 'retry':
                            confirmation.showModal(new ModalBuilder({
                                title: "Поиск компании", custom_id: `${interId}:modal`, components: formComponents(values)
                            }))
                        case 'cancel':
                            interaction.deleteReply()
                            break
                    }

                }).catch(async (e) => {
                    if (e.code === DiscordjsErrorCodes.InteractionCollectorError)
                        await interaction.editReply({ content: 'Вы настолько долго не отвечали, что бот пошел спать.', components: [], embeds: [] });
                    else
                        console.error(e)
                })
                return
            case "deleteParty":
                const partyDataDel = await PartySchema.findOne({ ThreadId: interaction.channel.id })
                if (partyDataDel && partyDataDel.CreatorId === interaction.user.id || interaction.memberPermissions.has(PermissionsBitField.Flags.Administrator)) {
                    const deleteResponse = await interaction.reply({
                        content: "Вы точно хотите удалить?", components: [
                            new ActionRowBuilder({
                                components: [
                                    new ButtonBuilder({ custom_id: `${interId}:deleteConfirm`, label: 'Удалить', style: ButtonStyle.Danger }),
                                    new ButtonBuilder({ custom_id: `${interId}:deleteCancel`, label: 'Отменить', style: ButtonStyle.Secondary })
                                ]
                            })
                        ], ephemeral: true, fetchReply: true
                    })
                    try {
                        const deleteConfirmation = await deleteResponse.awaitMessageComponent(collectorFilter, 30_000)
                        const customId = deleteConfirmation.customId.split(":")
                        if (customId[1] === 'deleteConfirm') {
                            deleteConfirmation.channel.delete()
                            await PartySchema.deleteOne({ ThreadId: interaction.channel.id })
                        }
                        if (customId[1] === 'deleteCancel') {
                            interaction.deleteReply()
                        }
                    } catch (e) {
                        if (e.code === DiscordjsErrorCodes.InteractionCollectorError)
                            await interaction.deleteReply()
                        else
                            console.error(e)
                    }
                } else {
                    interaction.reply({ content: "У вас нет прав для этого.", ephemeral: true })
                }
                return
            case "finishParty":
                const partyDataFin = await PartySchema.findOne({ ThreadId: interaction.channel.id })
                if (partyDataFin && partyDataFin.CreatorId === interaction.user.id || interaction.memberPermissions.has(PermissionsBitField.Flags.Administrator)) {
                    const finishResponse = await interaction.reply({
                        content: "Вы уверены? Это действие необратимо.", components: [
                            new ActionRowBuilder({
                                components: [
                                    new ButtonBuilder({ custom_id: `${interId}:finishConfirm`, label: 'Да', style: ButtonStyle.Success }),
                                    new ButtonBuilder({ custom_id: `${interId}:finishCancel`, label: 'Нет', style: ButtonStyle.Secondary })
                                ]
                            })
                        ], ephemeral: true, fetchReply: true
                    })
                    try {
                        const finishConfirmation = await finishResponse.awaitMessageComponent(collectorFilter, 30_000)
                        const customId = finishConfirmation.customId.split(":")
                        if (customId[1] === 'finishConfirm') {
                            webhookClient.editMessage(interaction.message, { content: interaction.message.content, components: [], threadId: interaction.channel.id })
                            interaction.deleteReply()
                            finishConfirmation.channel.setLocked(true)
                            await PartySchema.deleteOne({ ThreadId: interaction.channel.id })
                        }
                        if (customId[1] === 'finishCancel') {
                            interaction.deleteReply()
                        }
                    } catch (e) {
                        if (e.code === DiscordjsErrorCodes.InteractionCollectorError)
                            await interaction.deleteReply()
                        else
                            console.error(e)
                    }
                } else {
                    interaction.reply({ content: "У вас нет прав для этого.", ephemeral: true })
                }
                return
            case "editParty":
                const partyDataEdit = await PartySchema.findOne({ ThreadId: interaction.channel.id })
                if (partyDataEdit && partyDataEdit.CreatorId === interaction.user.id || interaction.memberPermissions.has(PermissionsBitField.Flags.Administrator)) {
                    interaction.showModal(new ModalBuilder({
                        title: "Редактирование", custom_id: `${interId}:editModal`, components: formComponents({
                            activityName: partyDataEdit.ActivityName,
                            participantsNumber: partyDataEdit.ParticipantsNumber,
                            date: partyDataEdit.DateUserInput,
                            requirement: partyDataEdit.Requirement,
                            tip: partyDataEdit.Tip
                        })
                    }))
                } else {
                    interaction.reply({ content: "У вас нет прав для этого.", ephemeral: true })
                }
                return
            case "editModal":
                const valuesModal = {}
                const partyDataModal = await PartySchema.findOne({ ThreadId: interaction.channel.id })
                const defaultValuesMentions = [].concat(partyDataModal.UserMentions, partyDataModal.RoleMentions)
                console.log(defaultValuesMentions)
                interaction.fields.fields.map((field) => { Object.assign(valuesModal, { [field.customId]: field.value }) })
                let dateModal
                try {
                    dateModal = validateDate(valuesModal.date.split(" "))
                } catch (e) {
                    return await interaction.reply({ content: typeof e === 'string' ? e : "Что-то пошло не так :/", ephemeral: true })
                }
                const mentionsResponse = await interaction.reply({
                    content: `Выберите тех, кого приглашаете. Диалог закроется <t:${dayjs().add(120_000, 'milliseconds').unix()}:R>.`, components: [
                        new ActionRowBuilder({
                            components: [
                                new MentionableSelectMenuBuilder({ custom_id: `${interId}:editInvite`, max_values: 10 }).addDefaultUsers(partyDataModal.UserMentions).addDefaultRoles(partyDataModal.RoleMentions)
                            ]
                        }),
                        new ActionRowBuilder({
                            components: [
                                new ButtonBuilder({ custom_id: `${interId}:skipEditInvite`, label: "Пропустить", style: ButtonStyle.Secondary }),
                                new ButtonBuilder({ custom_id: `${interId}:wipeEditInvite`, label: "Стереть", style: ButtonStyle.Danger })
                            ]
                        })
                    ], fetchReply: true, ephemeral: true
                })
                try {
                    const mentionsConfirmation = await mentionsResponse.awaitMessageComponent(collectorFilter, 120_000)
                    const customId = mentionsConfirmation.customId.split(":")
                    let mentions
                    switch (customId[1]) {
                        case 'wipeEditInvite':
                            mentions = mentionsGen(undefined, undefined)
                            break
                        case 'editInvite':
                            mentions = mentionsGen(mentionsConfirmation.users, mentionsConfirmation.roles)
                            break
                        case 'skipEditInvite':
                            mentions = mentionsGen(partyDataModal.UserMentions, partyDataModal.RoleMentions)
                            break
                    }
                    partyDataModal.ActivityName = valuesModal.activityName
                    partyDataModal.Date = dateModal.toDate()
                    partyDataModal.Requirement = valuesModal.requirement
                    partyDataModal.Tip = valuesModal.tip
                    partyDataModal.UserMentions = mentions.userMentions
                    partyDataModal.RoleMentions = mentions.roleMentions
                    partyDataModal.save()

                    webhookClient.editMessage(interaction.message, {
                        content: messageParty(partyDataModal.CreatorId,
                            valuesModal.participantsNumber,
                            dateModal,
                            valuesModal.requirement,
                            mentions.stringInvites,
                            valuesModal.tip
                        ), threadId: interaction.channel.id
                    })
                    mentionsConfirmation.update({ content: "Отредактировано.", components: [] })

                } catch (e) {
                    if (e.code === DiscordjsErrorCodes.InteractionCollectorError)
                        await interaction.editReply({ content: 'Вы настолько долго не отвечали, что бот пошел спать.', components: [], embeds: [] });
                    else
                        console.error(e)
                }
        }
    }
}