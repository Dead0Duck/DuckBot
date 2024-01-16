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

		switch (customId[1]) {
			case "prop":
				let component
				switch (setting.type) {
					case "bool":
						component = setting.components(customId[2], guildId)
						firstRow.addComponents(component)
						await interaction.reply({ content: setting.description, components: [firstRow], ephemeral: true })
						return
					case "selectString":
						component = setting.component(interaction, guildId).setCustomId(`${interId}:apply:${customId[2]}:${guildId}`)
						firstRow.addComponents(component)
						await interaction.reply({ content: setting.description, components: [firstRow], ephemeral: true })
						return
					case "textInput":
						const modal = setting.modal(interaction, guildId).setCustomId(`${interId}:apply:${customId[2]}:${guildId}`)
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
						await GuildSchema.updateOne({ Guild: guildId }, { $set: { [`Settings.${setting.field}`]: customId[3] === 'true' ? true : false } })
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
					.setCustomId(`${interId}:delete:${guildId}`)
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
	},
}