const { ButtonBuilder, ButtonStyle, ActionRowBuilder, EmbedBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, TextInputBuilder, ModalBuilder, TextInputStyle } = require('discord.js');

class BaseSetting {
    /**
     * @param {string} label - Название параметра.
     * @param {string} field - Название параметра в БД.
     * @param {string} description - Описание параметра.
     */
    constructor(label, field, description) {
        this.label = label
        this.field = field
        this.description = description
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
     */
    constructor(label, field, description, trueLabel, falseLabel) {
        super(label, field, description)
        this.trueLabel = trueLabel
        this.falseLabel = falseLabel
        this.type = 'bool'
    }
    components(index, guildId) {
        return [new ButtonBuilder().setLabel(this.trueLabel).setStyle(ButtonStyle.Success).setCustomId(`apply:${index}:true:${guildId}`),
        new ButtonBuilder().setLabel(this.falseLabel).setStyle(ButtonStyle.Danger).setCustomId(`apply:${index}:false:${guildId}`)]
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
     * @param {function (interaction, guildId)} component - Функция, возвращающая `StringSelectMenuBuilder`
     * @param {function (guildSettings)} value - Функция, возвращающая string для отображения в embed.
     */
    constructor(label, field, description, component, value) {
        super(label, field, description)
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
     */
    constructor(label, field, modal, value, validate = () => { return 0 }) {
        super(label, field)
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
                        .setDescription(typeof channel.parent === 'undefined' ? "Не в категории" : `В категории "${channel.parent.name}"`)
                )
            })
            return channelSelect
        },
        (guildSettings) => {
            return `${typeof guildSettings.PartiesChannel === 'undefined' ? "не указан" : `<#${guildSettings.PartiesChannel}>`} `
        }
    ),

    new BooleanSetting("Хот-дог", "TestBoolean", "Вы хотите хот-дог?", "Да, очень хочу", "Нет, спасибо, я веган"),
    new TextInputSetting("Любимая еда", "FavFood", () => {
        return new ModalBuilder({
            title: "Любимая еда", components: [
                new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('test').setLabel('Test').setStyle(TextInputStyle.Short).setMaxLength(50))
            ]
        })
    }, (guildSettings) => {
        return `${typeof guildSettings.FavFood === 'undefined' ? "не указан" : guildSettings.FavFood} `
    })
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
            .setCustomId(`setting:${index}:${guildId}`)
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
        .setCustomId("void:" + guildId)
        .setLabel('Удалить параметр')
        .setStyle(ButtonStyle.Danger)
    const deleteRow = new ActionRowBuilder()
        .addComponents(deleteSettings)


    return {
        embed: embed,
        rows: [...actionRows, deleteRow]
    }
}

async function Interactions(interaction) {
    const { GuildSchema } = process.mongo;


    const customId = interaction.customId.split(":")
    if (customId.length < 2) { return }
    const guildId = customId[customId.length - 1]
    const firstRow = new ActionRowBuilder()
    const setting = Settings[parseInt(customId[1])]
    const guildData = await GuildSchema.findOne({ Guild: guildId })

    switch (customId[0]) {
        case "setting":
            let component
            switch (setting.type) {
                case "bool":
                    component = setting.components(customId[1], guildId)
                    firstRow.addComponents(component)
                    await interaction.reply({ content: setting.description, components: [firstRow], ephemeral: true })
                    return
                case "selectString":
                    component = setting.component(interaction, guildId).setCustomId(`apply:${customId[1]}:${guildId}`)
                    firstRow.addComponents(component)
                    await interaction.reply({ content: setting.description, components: [firstRow], ephemeral: true })
                    return
                case "textInput":
                    const modal = setting.modal(interaction, guildId).setCustomId(`apply:${customId[1]}:${guildId}`)
                    await interaction.showModal(modal)
                    return
            }

        case "apply":
            switch (setting.type) {
                case "textInput":
                    let content = ""
                    const validate = setting.validate(interaction)
                    if (validate !== 0) {
                        content = `Произошла ошибка:\n\`\`\`${validate}\`\`\``
                    } else {
                        await GuildSchema.updateOne({ Guild: guildId }, { $set: { [`Settings.${setting.field}`]: interaction.fields.fields.size > 1 ? interaction.fields.fields.map((x) => { x.value }) : interaction.fields.fields.first().value } })
                        content = `Параметр установлен.`
                    }
                    await interaction.reply({ content: content, ephemeral: true, components: [] })
                    return
                case "selectString":
                    await GuildSchema.updateOne({ Guild: guildId }, { $set: { [`Settings.${setting.field}`]: interaction.values.length > 1 ? interaction.values : interaction.values[0] } })
                    await interaction.update({ content: "Параметр установлен", ephemeral: true, components: [] })
                    return
                case "bool":
                    await GuildSchema.updateOne({ Guild: guildId }, { $set: { [`Settings.${setting.field}`]: customId[2] === 'true' ? true : false } })
                    await interaction.update({ content: "Параметр установлен", ephemeral: true, components: [] })
                    return
            }

        case "delete":
            const prop = "Settings." + interaction.values[0]
            await GuildSchema.updateOne({ Guild: guildId }, { $unset: { [prop]: "" } })
            await interaction.update({ content: "Параметр удален.", ephemeral: true, embeds: [], components: [] })
            return

        case "void":
            const options = new StringSelectMenuBuilder()
                .setCustomId(`delete:${guildId}`)
                .setMaxValues(1)

            Settings.forEach((setting) => {
                options.addOptions(new StringSelectMenuOptionBuilder()
                    .setLabel(setting.label)
                    .setValue(setting.field))
            })
            firstRow.addComponents(options)
            await interaction.reply({ content: "Укажите параметр для удаления", components: [firstRow], embeds: [], ephemeral: true })
            return
    }
}



module.exports = { Components, Interactions }