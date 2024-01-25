const { ActionRowBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder } = require('discord.js');
const { Settings } = require('../utils')

const interId = "st"
module.exports = {
	id: interId,
	execute: async (interaction) => {
		const { GuildSchema } = process.mongo;

		const customId = interaction.customId.split(":")
		if (customId.length < 2) { return }
		const guildId = customId[customId.length - 1]
		const firstRow = new ActionRowBuilder()
		const setting = Settings.Data[parseInt(customId[2])]
		const guildData = await GuildSchema.findOne({ Guild: guildId })

		switch (customId[1]) {
			case "prop":
				let component
				switch (setting.type) {
					case "bool":
						component = setting.components(customId[2], guildId, guildData.Settings[setting.field])
						firstRow.addComponents(component)
						await interaction.reply({ content: setting.description, components: [firstRow], ephemeral: true })
						return
					case "selectRole":
					case "selectString":
						component = setting.component(interaction, guildId, guildData.Settings[setting.field]).setCustomId(`${interId}:apply:${customId[2]}:${guildId}`)
						if (setting.type == "selectString" && component.options.length < 1) {
							return await interaction.reply({ content: setting.emptyText, ephemeral: true })
						}
						firstRow.addComponents(component)
						await interaction.reply({ content: setting.description, components: [firstRow], ephemeral: true })
						return
					case "textInput":
						const modal = setting.modal(interaction, guildId, guildData.Settings[setting.field]).setCustomId(`${interId}:apply:${customId[2]}:${guildId}`)
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
							setting.onSuccess(interaction, guildId)
							content = `Параметр установлен.`
						}
						await interaction.reply({ content: content, ephemeral: true, components: [] })
						return
					case "selectRole":
					case "selectString":
						await GuildSchema.updateOne({ Guild: guildId }, { $set: { [`Settings.${setting.field}`]: interaction.values.length > 1 ? interaction.values : interaction.values[0] } })
						await interaction.update({ content: "Параметр установлен", ephemeral: true, components: [] })
						setting.onSuccess(interaction, guildId)
						return
					case "bool":
						await GuildSchema.updateOne({ Guild: guildId }, { $set: { [`Settings.${setting.field}`]: customId[3] === 'true' ? true : false } })
						await interaction.update({ content: "Параметр установлен", ephemeral: true, components: [] })
						setting.onSuccess(customId[3], interaction, guildId)
						return
				}

			case "delete":
				const prop = "Settings." + interaction.values[0]
				if (typeof guildData.Settings[interaction.values[0]] === 'undefined') {
					await interaction.update({ content: "Параметр уже удален.", ephemeral: true, embeds: [], components: [] })
					return
				} else {
					await GuildSchema.updateOne({ Guild: guildId }, { $unset: { [prop]: "" } })
					await interaction.update({ content: "Параметр удален.", ephemeral: true, embeds: [], components: [] })
					Settings.Data.find((setting) => {
						return setting.field === interaction.values[0]
					}).onDelete(interaction, guildId)
					return
				}

			case "void":
				const options = new StringSelectMenuBuilder()
					.setCustomId(`${interId}:delete:${guildId}`)
					.setMaxValues(1)

				Settings.Data.forEach((setting) => {
					if (typeof guildData.Settings[setting.field] !== 'undefined')
						options.addOptions(new StringSelectMenuOptionBuilder()
							.setLabel(setting.label)
							.setValue(setting.field))
				})
				if (options.options.length === 0) {
					await interaction.reply({ content: "Нечего удалять.", ephemeral: true })
					return
				} else {
					firstRow.addComponents(options)
					await interaction.reply({ content: "Укажите параметр для удаления", components: [firstRow], embeds: [], ephemeral: true })
					return
				}

		}
	},
}