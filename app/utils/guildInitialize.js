const { ChannelType, PermissionFlagsBits } = require("discord.js");

async function VoiceChannel(guild)
{
	const client = process.disClient
	const { GuildSchema } = process.mongo

	try	{
		let voiceCat = await guild.channels.create({ name: 'DuckBot: Личные комнаты', type: ChannelType.GuildCategory, position: 1, deny: [{
			id: guild.id,
			allow: [PermissionFlagsBits.ViewChannel],
		}]})
		let voiceTexCat = await guild.channels.create({ name: 'DuckBot: Меню личных комнат', type: ChannelType.GuildCategory, position: 2, deny: [{
			id: guild.id,
			allow: [PermissionFlagsBits.ViewChannel],
		}]})
		let voiceCreateChn = await guild.channels.create({ name: 'Создать комнату', parent: voiceCat, type: ChannelType.GuildVoice, position: 1 })
		let voiceCreateCloseChn = await guild.channels.create({ name: 'Создать скрытую комнату', parent: voiceCat, type: ChannelType.GuildVoice, position: 2 })
	
		GuildSchema.create({
			Guild: guild.id,
			DataVersion: 1,
			VoiceCategory: voiceCat.id,
			VoiceTextCategory: voiceTexCat.id,
			VoiceCreate: voiceCreateChn.id,
			VoiceCreateClosed: voiceCreateCloseChn.id,
		})
	
		// let owner = await guild.fetchOwner()
		// owner.send(`Приветствую, я DuckBot. Я создал для вас категорию с личными каналами. Она сейчас скрыта от посторонних глаз, дабы вы могли настроить всё.`)
	} catch(e) {
		console.error(e)
	}

	return true
}

module.exports = {
	VoiceChannel,
	All: async (guild) => {
		return await VoiceChannel(guild)
	},
}