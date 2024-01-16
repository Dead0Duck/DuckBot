const { EmbedBuilder, Events, ChannelType, PermissionFlagsBits } = require('discord.js');
const { VoiceChannels } = require('../utils');

async function CreateVoice(oldState, newState, guildData)
{
	let member = newState.member
	let guild = newState.guild
	let newChannel = newState.channel

	if (newChannel != guildData.VoiceCreate && newChannel != guildData.VoiceCreateClosed)
		return false

	let denyPerms = [
		PermissionFlagsBits.CreateInstantInvite,
		PermissionFlagsBits.ManageChannels,
		PermissionFlagsBits.MuteMembers,
		PermissionFlagsBits.DeafenMembers,
		PermissionFlagsBits.MoveMembers,
		PermissionFlagsBits.ManageRoles,
		PermissionFlagsBits.ManageWebhooks
	]

	let isClosed = (newChannel == guildData.VoiceCreateClosed)
	if (isClosed)
		denyPerms.push(PermissionFlagsBits.ViewChannel)

	try {
		let voiceChannel = await guild.channels.create({ name: `Комната ${member.displayName || "???"}`, parent: guildData.VoiceCategory, type: ChannelType.GuildVoice, permissionOverwrites: [
			{
				id: guild.roles.everyone,
				deny: denyPerms
			},
			{
				id: member.id,
				allow: [
					PermissionFlagsBits.ManageChannels,
					PermissionFlagsBits.MoveMembers,
					PermissionFlagsBits.ViewChannel,
					PermissionFlagsBits.Connect
				],
			}
		]})

		let textChannel = await guild.channels.create({ name: 'меню комнаты', parent: guildData.VoiceTextCategory, type: ChannelType.GuildText, permissionOverwrites: [
			{
				id: guild.roles.everyone,
				deny: [
					PermissionFlagsBits.ViewChannel,
					PermissionFlagsBits.SendMessages,
				]
			},
			{
				id: member.id,
				allow: [
					PermissionFlagsBits.ViewChannel,
				],
			}
		], topic: voiceChannel.id })

		const embed = new EmbedBuilder()
			.setColor(0x0099FF)
			.setTitle('Управление личной комнатой')
			.setDescription(`Подготовка меню...\nСоздатель: <@${member.id}>`)
			.setTimestamp(Date.now())

		await textChannel.send({embeds: [embed], allowedMentions: { repliedUser: false }})
		VoiceChannels.UpdateMenu(textChannel, voiceChannel)

		member.voice.setChannel(voiceChannel)
		return true
	} catch(e) {
		console.error(e)
		return false
	}
}

async function JoinVoice(oldState, newState, guildData)
{
	let member = newState.member
	let channel = newState.channel

	if (channel?.parentId != guildData.VoiceCategory) return false
	if (channel.id == guildData.VoiceCreate || channel.id == guildData.VoiceCreateClosed) return false
	if (member.id == VoiceChannels.GetOwner(channel)) return false

	channel.send({content: `<@${member.id}> присоединился к каналу.`, allowedMentions: { repliedUser: false }})
}

async function LeaveVoice(oldState, newState, guildData)
{
	let member = newState.member
	let channel = oldState.channel

	if (channel?.parentId != guildData.VoiceCategory) return false
	if (channel.id == guildData.VoiceCreate || channel.id == guildData.VoiceCreateClosed) return false

	let textChannel = await VoiceChannels.GetTextChannel(channel, guildData)
	try {
		channel = await channel.fetch()
		let channelMembers = channel.members.filter(m => !m.user.bot)
		if (channelMembers.size <= 0)
		{
			textChannel.delete('Владелец покинул канал.');
			channel.delete('Владелец покинул канал.');
			return true
		}

		let voiceOwner = VoiceChannels.GetOwner(channel)
		let isVoiceOwner = member.id == voiceOwner

		if (isVoiceOwner)
		{
			const newOwner = channelMembers.random();
			await channel.permissionOverwrites.edit(newOwner.id, {
				ManageChannels: true,
				MoveMembers: true,
				ViewChannel: true,
				Connect: true
			})
			await channel.permissionOverwrites.edit(member.id, {
				ManageChannels: null,
				MoveMembers: null,
				Connect: null,
			})

			VoiceChannels.UpdateMenu(textChannel, channel)
			channel.send({content: `<@${member.id}> покинул канал. Канал передан <@${newOwner.id}>`, allowedMentions: { users: [newOwner.id] }});
			return true
		}

		channel.send({content: `<@${member.id}> покинул канал.`, allowedMentions: { repliedUser: false }});
		return true
	} catch(e) {
		console.error(e)
		return false
	}
}

module.exports = {
	name: Events.VoiceStateUpdate,
	execute: async (oldState, newState) => {
		const { GuildSchema } = process.mongo;

		let guildId = newState.guild.id
		let guildData = await GuildSchema.findOne({ Guild: guildId })
		if (!guildData) return

		let newChannel = newState.channel
		let oldChannel = oldState.channel

		let member = newState.member
		if (member.user.bot || newChannel?.id == oldChannel?.id)
			return

		CreateVoice(oldState, newState, guildData)
		JoinVoice(oldState, newState, guildData)
		LeaveVoice(oldState, newState, guildData)
	}
}
