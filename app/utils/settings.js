const { ChannelFlagsBitField, ButtonBuilder, ButtonStyle, ActionRowBuilder, EmbedBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, TextInputBuilder, ModalBuilder, TextInputStyle, ChannelType, RoleSelectMenuBuilder, UserSelectMenuBuilder, ChannelSelectMenuBuilder } = require('discord.js');
const fs = require('fs');

class BaseSetting {
    /**
     * @param {string} label - Название параметра.
     * @param {string} field - Название параметра в БД.
     * @param {string} description - Описание параметра.
     * @param {function (interaction, guildId)} onSuccess - Функция, которая выполняется при успешном апдейте параметра.
     * @param {function (interaction, guildId)} onDelete - Функция, которая выполняется при успешном удалении параметра.
     */
    constructor(label, field, description, onSuccess = () => { }, onDelete = () => { }) {
        this.label = label
        this.field = field
        this.description = description
        this.onSuccess = onSuccess
        this.onDelete = onDelete
    }
}

/**
 * Параметр, который принимает лишь значения boolean.
 */
class BooleanSetting extends BaseSetting {
    /**
     * @param {string} label - Название параметра.
     * @param {string} field - Название параметра в БД.
     * @param {string} description - Описание параметра.
     * @param {string} trueLabel - Подпись кнопки true.
     * @param {string} falseLabel - Подпись кнопки false.
     * @param {function (value, interaction, guildId)} onSuccess - Функция, которая выполняется при успешном апдейте параметра.
     * @param {function (interaction, guildId)} onDelete - Функция, которая выполняется при успешном удалении параметра.
     * @example
     * new BooleanSetting("Хот-дог", "TestBoolean", "Вы хотите хот-дог?", "Да, очень хочу", "Нет, спасибо, я веган",
        (value, interaction) => { interaction.followUp({ content: value === 'true' ? "🌭" : "Ок, мне больше достанется.", ephemeral: true }) },
        (interaction) => { interaction.followUp("Печально, что вы так с хот-догом поступаете.") })
     */
    constructor(label, field, description, trueLabel, falseLabel, onSuccess = () => { }, onDelete = () => { }) {
        super(label, field, description, onSuccess, onDelete)
        this.trueLabel = trueLabel
        this.falseLabel = falseLabel
        this.type = 'bool'
    }
    components(index, guildId, data) {
        return [new ButtonBuilder().setLabel(this.trueLabel).setStyle(ButtonStyle.Success).setCustomId(`st:apply:${index}:true:${guildId}`),
        new ButtonBuilder().setLabel(this.falseLabel).setStyle(ButtonStyle.Danger).setCustomId(`st:apply:${index}:false:${guildId}`)]
    }
    value(guildSettings) {
        return `${typeof guildSettings[this.field] === 'undefined' ? "не указан" : `${guildSettings[this.field] === true ? "Да" : "Нет"}`} `
    }
    validate() {
        return 0
    }
}

/**
 * Параметр, который принимает один или несколько string из списка.
 */
class SelectStringSetting extends BaseSetting {
    /**
     * @param {string} label - Название параметра.
     * @param {string} field - Название параметра в базе данных
     * @param {string} description - Описание параметра.
     * @param {function (interaction, guildId, data): StringSelectMenuBuilder} component - Функция, возвращающая `StringSelectMenuBuilder`
     * @param {function (guildSettings): string} value - Функция, возвращающая string для отображения в embed.
     * @param {string} emptyText - Текст для отображения, если список окажется пустым.
     * @param {function (interaction, guildId)} onSuccess - Функция, которая выполняется при успешном апдейте параметра.
     * @param {function (interaction, guildId)} onDelete - Функция, которая выполняется при успешном удалении параметра.
     */
    constructor(label, field, description, component, value, emptyText = "Ошибка: список пуст.", onSuccess = () => { }, onDelete = () => { }) {
        super(label, field, description, onSuccess, onDelete)
        this.emptyText = emptyText
        this.component = component
        this.value = value
        this.type = 'selectString'
    }
    validate() {
        return 0
    }
}

/**
 * Параметр, который принимает что-то из [предзаполненного](https://discordjs.guide/message-components/select-menus.html#auto-populating-select-menus) списка.
 */
class SelectAutoSetting extends BaseSetting {
    /**
     * @param {string} label - Название параметра.
     * @param {string} field - Название параметра в базе данных
     * @param {string} description - Описание параметра.
     * @param {function (interaction, guildId, data): UserSelectMenuBuilder | RoleSelectMenuBuilder | MentionableSelectMenuBuilder | ChannelSelectMenuBuilder} component - Функция, возвращающая `{User|Role|Mentionable|Channel}SelectMenuBuilder`
     * @param {function (guildSettings): string} value - Функция, возвращающая string для отображения в embed.
     * @param {function (interaction, guildId)} onSuccess - Функция, которая выполняется при успешном апдейте параметра.
     * @param {function (interaction, guildId)} onDelete - Функция, которая выполняется при успешном удалении параметра.
     */
    constructor(label, field, description, component, value, onSuccess = () => { }, onDelete = () => { }) {
        super(label, field, description, onSuccess, onDelete)
        this.component = component
        this.value = value
        this.type = 'selectAuto'
    }
    validate() {
        return 0
    }
}

/**
 * Параметр, который принимает string через Modal.
 */
class TextInputSetting extends BaseSetting {
    /**
     * 
     * @param {string} label - Название параметра.
     * @param {string} field - Название параметра в базе данных.
     * @param {function (interaction, guildId, data)} modal - Функция, возвращающая `ModalBuilder`
     * @param {function (guildSettings)} value - Функция, возвращающая string для отображения в embed.
     * @param {function (interaction)} validate - Функция, которая вызывается для проверки введённых данных. Если всё в порядке, то возвращает 0, а если нет, то должна вернуть string с описанием ошибки.
     * @param {function (interaction, guildId)} onSuccess - Функция, которая выполняется при успешном апдейте параметра.
     * @param {function (interaction, guildId)} onDelete - Функция, которая выполняется при успешном удалении параметра.
     * @example
     * new TextInputSetting("Любимая еда", "FavFood", () => {
        return new ModalBuilder({
            title: "Любимая еда", components: [
                new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('food').setLabel('Любимая еда').setStyle(TextInputStyle.Short).setMaxLength(50))
            ]
        })
    }, (guildSettings) => {
        return `${typeof guildSettings.FavFood === 'undefined' ? "не указана" : guildSettings.FavFood} `
    })
     */
    constructor(label, field, modal, value, validate = () => { return 0 }, onSuccess = () => { }, onDelete = () => { }) {
        super(label, field, onSuccess, onDelete)
        this.modal = modal
        this.value = value
        this.validate = validate
        this.type = 'textInput'
    }
}

const Settings = [
    new SelectAutoSetting("Форум для поиска компаний", "PartiesChannel", "Выбор форума для поиска совместных активностей",
        (interaction, guildId) => {
            const channelSelect = new ChannelSelectMenuBuilder()
                .setMaxValues(1)
                .setChannelTypes(ChannelType.GuildForum)
            return channelSelect
        },
        (guildSettings) => {
            return `${typeof guildSettings.PartiesChannel === 'undefined' ? "не указан" : `<#${guildSettings.PartiesChannel}>`} `
        },
        (interaction, guildId) => {
            const partyFAQString = fs.readFileSync('bigstrings/partyfaq.md').toString('utf-8');
            interaction.client.channels.fetch(interaction.values[0]).then((channel) => {
                channel.threads.create({
                    name: "Хочешь найти компанию? Кликни на меня!", message: {
                        content: partyFAQString, components: [
                            new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId('pt:start').setLabel('Объявить о поиске компании').setStyle(ButtonStyle.Primary))
                        ]
                    }
                }).then(async (thread) => {
                    const { GuildSchema } = process.mongo;
                    const guildData = await GuildSchema.findOne({ Guild: guildId })
                    if (typeof guildData.PartiesThread !== 'undefined') {
                        interaction.client.channels.fetch(guildData.PartiesThread).then((channel) => { channel.delete() }).catch(console.error)
                    }
                    interaction.guild.fetchWebhooks().then(async (webhooks) => {
                        const webhook = webhooks.find(item => item.id === guildData.PartiesWebhookId)
                        if (typeof webhook !== 'undefined') {
                            await webhook.edit({ channel: thread.parent.id })
                        } else {
                            thread.parent.createWebhook({ name: 'DuckBot Parties' }).then((webhook) => {
                                guildData.PartiesWebhookId = webhook.id
                                guildData.PartiesWebhookToken = webhook.token
                                guildData.save()
                                interaction.followUp({ content: '> ⚠️ Создан новый вебхук `DuckBot Parties`. Ни при каких обстоятельствах **не удаляйте и не изменяйте его**. В противном случае редактировать объявления **будет невозможно**.', ephemeral: true })

                            })
                        }
                    })
                    guildData.PartiesThread = thread.id
                    guildData.save()
                    const pinnedThread = thread.parent.threads.cache.find(thread => thread.flags.has(ChannelFlagsBitField.Flags.Pinned))
                    if (typeof pinnedThread !== 'undefined') {
                        pinnedThread.unpin()
                    }
                    thread.pin()
                }).catch(console.error)
            })
        }, async (interaction, guildId) => {
            const { GuildSchema } = process.mongo;
            const guildData = await GuildSchema.findOne({ Guild: guildId })
            interaction.client.channels.fetch(guildData.PartiesThread).then((channel) => { channel.delete() }).catch(console.error)
            interaction.guild.fetchWebhooks().then(async (webhooks) => {
                const webhook = webhooks.find(item => item.id === guildData.PartiesWebhookId)
                if (typeof webhook !== 'undefined') {
                    await webhook.delete()
                }
                guildData.PartiesWebhookId = undefined
                guildData.PartiesWebhookToken = undefined
                guildData.save()
            })
            guildData.PartiesThread = undefined
            guildData.save()
        }
    ),

    new SelectAutoSetting("Канал для логов личных комнат", "VoiceLogs", "Выбор канала для логов действий в личных комнат",
        (interaction, guildId) => {
            const channelSelect = new ChannelSelectMenuBuilder()
                .setMaxValues(1)
				.setChannelTypes(ChannelType.GuildText)
            return channelSelect
        },
        (guildSettings) => {
            return `${typeof guildSettings.VoiceLogs === 'undefined' ? "не указан" : `<#${guildSettings.VoiceLogs}>`} `
        }
    ),

    new SelectAutoSetting("Роль регистрации", "RegRole", "Выбор роли, которую бот выдаст при регистрации",
        (interaction, guildId) => {
            const roleSelect = new RoleSelectMenuBuilder()
            roleSelect.setMaxValues(1)

            return roleSelect
        },
        (guildSettings) => {
            return `${typeof guildSettings.RegRole === 'undefined' ? "не указана" : `<@&${guildSettings.RegRole}>`} `
        }
    ),

    /* new TextInputSetting("Текст для регистранта", "RegText", (interaction, guildId, data) => {
        return new ModalBuilder({
            title: "Введите текст при регистрации", components: [
                new ActionRowBuilder().addComponents(new TextInputBuilder()
                    .setCustomId('regtext')
                    .setLabel('Текст')
                    .setStyle(TextInputStyle.Paragraph)
                    .setMaxLength(1900)
                    .setValue(data || "")
                    .setPlaceholder())
            ]
        })
    }, (guildSettings) => {
        return `${typeof guildSettings.RegText === 'undefined' ? "не указан" : "указан"} `
    }) */
]

const chunk = (arr, size) =>
    Array.from({ length: Math.ceil(arr.length / size) }, (v, i) =>
        arr.slice(i * size, i * size + size)
    );

function Components(guildSettings, guild) {
    const guildName = guild.name
    const guildIconURL = guild.iconURL()
    const guildId = guild.id
    const buttons = []
    const actionRows = []

    const embed = new EmbedBuilder()
        .setTitle("Настройки")
        .setAuthor({ name: guildName, iconURL: guildIconURL })

    Settings.forEach((setting, index) => {
        buttons.push(new ButtonBuilder()
            .setCustomId(`st:prop:${index}:${guildId}`)
            .setLabel(setting.label)
            .setStyle(ButtonStyle.Secondary)
        )
        embed.addFields({
            name: setting.label,
            value: setting.value(guildSettings),
            inline: true
        })
    })

    const groupButtons = chunk(buttons, 5)
    if (groupButtons.length > 4) {
        console.log("Достигнуто максимальное количество Action Rows.")
    } else {
        groupButtons.forEach((group) => {
            actionRows.push(
                new ActionRowBuilder().addComponents(group)
            )
        })
    }

    const deleteSettings = new ButtonBuilder()
        .setCustomId("st:void:" + guildId)
        .setLabel('Удалить параметр')
        .setStyle(ButtonStyle.Danger)
    const deleteRow = new ActionRowBuilder()
        .addComponents(deleteSettings)


    return {
        embed: embed,
        rows: [...actionRows, deleteRow]
    }
}

module.exports = { Data: Settings, Components }