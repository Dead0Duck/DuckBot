const { ChannelType, PermissionFlagsBits, Guild } = require("discord.js");
const Settings = require('./settings');

/**
 * @param {Guild} guild
 */
async function VoiceChannel(guild)
{
	const { GuildSchema } = process.mongo

	try {
		let voiceCat = null
		let voiceTexCat = null
		let voiceCreateChn = null
		let voiceCreateCloseChn = null

		const guildData = await GuildSchema.findOne({ Guild: guild.id })
		if (guildData)
		{
			try {
				voiceCat = await guild.channels.fetch(guildData.VoiceCategory)
			} catch(e) {
				voiceCat = null
			}

			try {
				voiceTexCat = await guild.channels.fetch(guildData.VoiceTextCategory)
			} catch(e) {
				voiceTexCat = null
			}

			try {
				voiceCreateChn = await guild.channels.fetch(guildData.VoiceCreate)

				if(!voiceCat || voiceCreateChn.parentId != voiceCat.id)
				{
					voiceCreateChn = null
					chn.delete()
				}
			} catch(e) {
				voiceCreateChn = null
			}

			try {
				voiceCreateCloseChn = await guild.channels.fetch(guildData.VoiceCreateClosed)

				if(!voiceCat || voiceCreateCloseChn.parentId != voiceCat.id)
				{
					voiceCreateCloseChn = null
					chn.delete()
				}
			} catch(e) {
				voiceCreateCloseChn = null
			}
		}

		voiceCat = voiceCat ?? await guild.channels.create({
			name: 'DuckBot: Личные комнаты', type: ChannelType.GuildCategory, position: 1, deny: [{
				id: guild.id,
				allow: [PermissionFlagsBits.ViewChannel],
			}]
		})
		voiceTexCat = voiceTexCat ?? await guild.channels.create({
			name: 'DuckBot: Меню личных комнат', type: ChannelType.GuildCategory, position: 2, deny: [{
				id: guild.id,
				allow: [PermissionFlagsBits.ViewChannel],
			}]
		})
		voiceCreateChn = voiceCreateChn ?? await guild.channels.create({ name: 'Создать комнату', parent: voiceCat, type: ChannelType.GuildVoice, position: 1 })
		voiceCreateCloseChn = voiceCreateCloseChn ?? await guild.channels.create({ name: 'Создать скрытую комнату', parent: voiceCat, type: ChannelType.GuildVoice, position: 2 })

		guildData.VoiceCategory = voiceCat.id
		guildData.VoiceTextCategory = voiceTexCat.id
		guildData.VoiceCreate = voiceCreateChn.id
		guildData.VoiceCreateClosed = voiceCreateCloseChn.id
		guildData.save()

		// let owner = await guild.fetchOwner()
		// owner.send(`Приветствую, я DuckBot. Я создал для вас категорию с личными каналами. Она сейчас скрыта от посторонних глаз, дабы вы могли настроить всё.`)
	} catch (e) {
		console.error(e)
	}

	return true
}

/**
 * @param {Guild} guild
 */
async function _settings(guild)
{
	const { GuildSchema } = process.mongo;

	try {
		const guildData = await GuildSchema.findOne({ Guild: guild.id })
		if (guildData.Settings)
			return true

		guildData.Settings = { Version: 1 }
		guildData.save()

		const { embed, rows } = Settings.Components(guildData.Settings, guild)

		let owner = await guild.fetchOwner()
		owner.send({
			// TODO: написать нормальное приветствие 
			content: "Hello!",
			embeds: [embed],
			components: rows
		})
	} catch(e) {
		console.error(e)
	}

	return true
}

module.exports = {
	VoiceChannel,
	Settings: _settings,

	/**
	 * @param {Guild} guild
	 */
	All: async (guild) => {
		const { GuildSchema } = process.mongo

		try {
			const guildData = await GuildSchema.findOne({ Guild: guild.id })
			if (!guildData)
			{
				GuildSchema.create({
					Guild: guild.id,
					DataVersion: 1,
				})
			}

			await VoiceChannel(guild)
			await _settings(guild)
			return true
		} catch (e) {
			console.error(e)
			return false
		}
	},
}