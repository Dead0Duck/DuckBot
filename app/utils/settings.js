const { ButtonBuilder, ButtonStyle, ActionRowBuilder, EmbedBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, TextInputBuilder, ModalBuilder, TextInputStyle, ChannelType } = require('discord.js');

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
    components(index, guildId) {
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
 * @extends BaseSetting
 */
class SelectStringSetting extends BaseSetting {
    /**
     * @param {string} label - Название параметра.
     * @param {string} field - Название параметра в базе данных
     * @param {string} description - Описание параметра.
     * @param {function (interaction, guildId): StringSelectMenuBuilder} component - Функция, возвращающая `StringSelectMenuBuilder`
     * @param {function (guildSettings): string} value - Функция, возвращающая string для отображения в embed.
     * @param {function (interaction, guildId)} onSuccess - Функция, которая выполняется при успешном апдейте параметра.
     * @param {function (interaction, guildId)} onDelete - Функция, которая выполняется при успешном удалении параметра.
     */
    constructor(label, field, description, component, value, onSuccess = () => { }, onDelete = () => { }) {
        super(label, field, description, onSuccess, onDelete)
        this.component = component
        this.value = value
        this.type = 'selectString'
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
     * @param {function (interaction, guildId)} modal - Функция, возвращающая `ModalBuilder`
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
    new SelectStringSetting("Форум для поиска компаний", "PartiesChannel", "Выбор форума для поиска совместных активностей",
        (interaction, guildId) => {
            const channelSelect = new StringSelectMenuBuilder()
                .setMaxValues(1)
            interaction.client.guilds.resolve(guildId).channels.cache.filter(x => x.isThreadOnly()).map((channel) => {
                channelSelect.addOptions(
                    new StringSelectMenuOptionBuilder()
                        .setLabel(channel.name)
                        .setValue(channel.id)
                        .setDescription(channel.parent == null ? "Не в категории" : `В категории "${channel.parent.name}"`)
                )
            })
            return channelSelect
        },
        (guildSettings) => {
            return `${typeof guildSettings.PartiesChannel === 'undefined' ? "не указан" : `<#${guildSettings.PartiesChannel}>`} `
        }
    ),

    new SelectStringSetting("Канал для логов личных комнат", "VoiceLogs", "Выбор канала для логов действий в личных комнат",
        (interaction, guildId) => {
            const channelSelect = new StringSelectMenuBuilder()
                .setMaxValues(1)
            interaction.client.guilds.resolve(guildId).channels.cache.filter(x => x.type == ChannelType.GuildText).map((channel) => {
                channelSelect.addOptions(
                    new StringSelectMenuOptionBuilder()
                        .setLabel(channel.name)
                        .setValue(channel.id)
                        .setDescription(channel.parent == null ? "Не в категории" : `В категории "${channel.parent.name}"`)
                )
            })
            return channelSelect
        },
        (guildSettings) => {
            return `${typeof guildSettings.VoiceLogs === 'undefined' ? "не указан" : `<#${guildSettings.VoiceLogs}>`} `
        }
    )
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