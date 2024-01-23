const { EmbedBuilder, PermissionFlagsBits, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');

/* ========================================================================== */
/*                              UTILITY FUNCTIONS                             */
/* ========================================================================== */
async function IsVoiceChannel(channel)
{
	const { GuildSchema } = process.mongo;

	let guildId = channel.guild.id
	let guildData = await GuildSchema.findOne({ Guild: guildId })
	if (!guildData) return false

	return channel.parentId == guildData.VoiceCategory
}

function GetOwner(channel)
{
    let perms = channel.permissionOverwrites.cache
    let owner = perms.find(p => p.allow.has(PermissionFlagsBits.ManageChannels))
    owner = owner?.id

    return owner
}

async function GetTextChannel(channel, guildData)
{
	if (!guildData)
	{
		const { GuildSchema } = process.mongo;

		guildData = await GuildSchema.findOne({ Guild: channel.guild.id })
		if (!guildData) return false
	}

	let channels = await channel.guild.channels.fetch()
	return channels.find(chn => chn.parentId == guildData.VoiceTextCategory && chn.topic == channel.id) || false
}

async function GetVoiceChannel(channel)
{
	return await channel.guild.channels.fetch(channel.topic)
}

async function UpdateMenu(channel, voiceChannel)
{
	channel = channel || voiceChannel && await GetTextChannel(voiceChannel)
	voiceChannel = voiceChannel || channel && await GetVoiceChannel(channel)

	const guild = channel.guild
	let menu = await channel.messages.fetch({ limit: 1 })
	menu = menu.first()

	const embed = menu.embeds[0];
	const creatorId = embed.description.match(/Создатель: <@([0-9]+)*?>+/i)
	const ownerId = GetOwner(voiceChannel)

	const voicePerms = voiceChannel.permissionOverwrites.cache
	const everyonePerms = voicePerms.find(p => p.id == guild.id)

	const isHidden = everyonePerms?.deny.has(PermissionFlagsBits.ViewChannel)
	const isClosed = everyonePerms?.deny.has(PermissionFlagsBits.Connect)

	let channelStatus = 'Канал сейчас открыт. Приходят все!'
	if (isHidden)
		channelStatus = 'Канал сейчас скрыт. Только вы и администрация.'
	else if (isClosed)
		channelStatus = 'Канал сейчас закрыт. Пусть все увидят, как вы тут закрылись.'

	// BUTTONS
	let buttons = []
	if (isClosed || isHidden)
	{
		const button = new ButtonBuilder()
			.setCustomId('voice:unlock')
			.setLabel('Открыть')
			.setEmoji('🔓')
			.setStyle(ButtonStyle.Success);
		buttons.push(button)
	}

	if (!isClosed)
	{
		const button = new ButtonBuilder()
			.setCustomId('voice:lock')
			.setLabel('Закрыть')
			.setEmoji('🔒')
			.setStyle(ButtonStyle.Danger);
		buttons.push(button)
	}

	if (!isHidden)
	{
		const button = new ButtonBuilder()
			.setCustomId('voice:hide')
			.setLabel('Спрятать')
			.setEmoji('🚷')
			.setStyle(ButtonStyle.Secondary);
		buttons.push(button)
	}

	const button = new ButtonBuilder()
		.setCustomId('voice:owner')
		.setLabel('Сменить владельца')
		.setEmoji('👑')
		.setStyle(ButtonStyle.Primary);
	buttons.push(button)
	// BUTTONS END

	const newEmbed = EmbedBuilder.from(embed)
		.setDescription(`Комната: <#${channel.topic}>\nВладелец: <@${ownerId}>\nСоздатель: <@${creatorId[1]}>\n\n${channelStatus}`)

	const row = new ActionRowBuilder().addComponents(buttons);
	menu.edit({ embeds: [newEmbed], components: [row] })
}

async function RandomOwner(channel, textChannel, channelMembers, guildData)
{
	if (!guildData)
	{
		const { GuildSchema } = process.mongo;

		guildData = await GuildSchema.findOne({ Guild: channel.guild.id })
		if (!guildData) return false
	}

	try {
		textChannel = textChannel || await GetTextChannel(channel, guildData)
		channelMembers = channelMembers || channel.members

		const oldOwnerId = GetOwner(channel);
		const oldOwner = await channel.guild.members.fetch(oldOwnerId);
		const newOwner = channelMembers.random();

		await channel.permissionOverwrites.edit(newOwner.id, {
			ManageChannels: true,
			MoveMembers: true,
			ViewChannel: true,
			Connect: true
		})
		await channel.permissionOverwrites.edit(oldOwner.id, {
			ManageChannels: null,
			MoveMembers: null,
			Connect: null,
		})
		await textChannel.permissionOverwrites.edit(newOwner.id, {
			ViewChannel: true,
		})
		await textChannel.permissionOverwrites.edit(oldOwner.id, {
			ViewChannel: null,
		})

		UpdateMenu(textChannel, channel)
		channel.send({content: `<@${oldOwner.id}> покинул канал. Канал передан <@${newOwner.id}>`, allowedMentions: { users: [newOwner.id] }});
		VoiceLog(channel, 'Отключение от каналу', `Участник: <@${oldOwner.id}>\nНовый владелец: ${newOwner.id}`)
	} catch (e) {
		console.error(e)
		return false
	}

	return true
}

let logChannel
async function VoiceLog(channel, title, desc = '')
{
	const { GuildSchema } = process.mongo;
	const guildData = await GuildSchema.findOne({ Guild: channel.guild.id })
	if (!guildData || !guildData.Settings.VoiceLogs) return false
	
	if (!logChannel || logChannel?.id != guildData.Settings.VoiceLogs)
	{
		logChannel = await channel.guild.channels.fetch(guildData.Settings.VoiceLogs)
	}

	const embed = new EmbedBuilder()
		.setColor(0xFF0000)
		.setTitle(title)
		.setDescription(`Канал: ${channel.name} (<#${channel.id}>)\nID Канала: ${channel.id}\n${desc}`)
		.setTimestamp(Date.now())

	await logChannel.send({embeds: [embed], allowedMentions: { repliedUser: false }})
}

/* ========================================================================== */
/*                                  COMMANDS                                  */
/* ========================================================================== */
const stateText = {
	"hide": "скрыт",
	"lock": "закрыт",
	"unlock": "открыт"
}
async function SetVoiceState(interaction, voiceChannel, newState)
{
	let guild = voiceChannel.guild
	let newPerms = {
		ViewChannel: null,
		Connect: null,
	}

	switch(newState)
	{
		case "lock":
			newPerms.Connect = false
			break;
		case "hide":
			newPerms.ViewChannel = false
			break;
	}

	await voiceChannel.permissionOverwrites.edit(guild.id, newPerms)
	await UpdateMenu(false, voiceChannel)
	await interaction.reply({ content: `Канал теперь ${stateText[ newState ]}.`, ephemeral: true })
	VoiceLog(voiceChannel, 'Изменение канала', `Видимость канала: ${stateText[ newState ]}`)
	return true
}

async function SetVoiceOwner(interaction, voiceChannel, newOwner)
{
	if (!newOwner.voice || newOwner.voice.channelId != voiceChannel.id)
	{
		await interaction.reply({ content: `Пользователь должен находиться в этом личном канале.`, ephemeral: true })
		return true
	}

	let voiceOwner = GetOwner(voiceChannel)
	if (voiceOwner == newOwner.id)
	{
		await interaction.reply({ content: `Этот пользователь уже владелеет этим каналов.`, ephemeral: true })
		return true
	}

	await voiceChannel.permissionOverwrites.edit(newOwner.id, {
		ManageChannels: true,
		MoveMembers: true,
		ViewChannel: true,
		Connect: true
	})
	await voiceChannel.permissionOverwrites.edit(voiceOwner, {
		ManageChannels: null,
		MoveMembers: null,
		Connect: null,
	})

	try {
		await interaction.reply({ content: `Канал передан <@${newOwner.id}>.`, ephemeral: true })
	} catch(e) { }

	let textChannel = await GetTextChannel(voiceChannel)
	await textChannel.permissionOverwrites.edit(newOwner.id, {
		ViewChannel: true,
	})
	await textChannel.permissionOverwrites.edit(voiceOwner, {
		ViewChannel: null,
	})

	
	await UpdateMenu(textChannel, voiceChannel)
	await voiceChannel.send({ content: `Канал передан <@${newOwner.id}>.`, allowedMentions: { users: [newOwner.id] } })
	VoiceLog(voiceChannel, 'Передача канала', `Новый владелец: <@${newOwner.id}>`)
	return true
}

async function VoiceBan(interaction, voiceChannel, member)
{
	let voiceOwner = GetOwner(voiceChannel)
	if (voiceOwner == member.id)
	{
		await interaction.reply({ content: `Вы не можете забанить владельца.`, ephemeral: true })
		return true
	}

	let memberPerms = voiceChannel.permissionOverwrites.cache.get(member.id)
	let isBanned = memberPerms?.deny.has(PermissionFlagsBits.ViewChannel) || false
	voiceChannel.permissionOverwrites.create(member.id, {
		Connect: null,
		ViewChannel: isBanned,
	})

	if(!isBanned && voiceChannel.members.has(member.id))
		member.voice.disconnect("Забанен в этом канале.")

	await interaction.reply({ content: `<@${member.id}> был ${isBanned ? "разбанен" : "забанен"}.`, allowedMentions: { users: [member.id] }, ephemeral: true })
	VoiceLog(voiceChannel, 'Бан в канале', `<@${member.id}> был ${isBanned ? "разбанен" : "забанен"}`)
	return true
}

async function VoiceKick(interaction, voiceChannel, member)
{
	if (!member.voice || member.voice.channelId != voiceChannel.id)
	{
		await interaction.reply({ content: `Пользователь должен находиться в этом личном канале.`, ephemeral: true })
		return true
	}

	let voiceOwner = GetOwner(voiceChannel)
	if (voiceOwner == member.id)
	{
		await interaction.reply({ content: `Вы не можете выгнать владельца.`, ephemeral: true })
		return true
	}

	member.voice.disconnect("Кикнут из канала.")

	await interaction.reply({ content: `Кикаем <@${member.id}>.`, allowedMentions: { users: [member.id] }, ephemeral: true })
	VoiceLog(voiceChannel, 'Кик в канале', `Участник: <@${member.id}>`)
	return true
}

/* ========================================================================== */
/*                                   EXPORT                                   */
/* ========================================================================== */
module.exports = {
	IsVoiceChannel,
	GetOwner,
	GetTextChannel,
	GetVoiceChannel,
	RandomOwner,
	UpdateMenu,
	VoiceLog,

	Commands: {
		SetVoiceState,
		SetVoiceOwner,
		VoiceBan,
		VoiceKick,
	},
}