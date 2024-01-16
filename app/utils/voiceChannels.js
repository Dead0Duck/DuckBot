const { EmbedBuilder, PermissionFlagsBits, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');

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

// TODO: Сделать меню рабочим
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
			.setStyle(ButtonStyle.Success);
		buttons.push(button)
	}

	if (!isClosed)
	{
		const button = new ButtonBuilder()
			.setCustomId('voice:lock')
			.setLabel('Закрыть')
			.setStyle(ButtonStyle.Danger);
		buttons.push(button)
	}

	if (!isHidden)
	{
		const button = new ButtonBuilder()
			.setCustomId('voice:hide')
			.setLabel('Спрятать')
			.setStyle(ButtonStyle.Secondary);
		buttons.push(button)
	}

	const button = new ButtonBuilder()
		.setCustomId('voice:owner')
		.setLabel('Сменить владельца')
		.setStyle(ButtonStyle.Primary);
	buttons.push(button)
	// BUTTONS END

	const newEmbed = EmbedBuilder.from(embed)
		.setDescription(`Комната: <#${channel.topic}>\nВладелец: <@${ownerId}>\nСоздатель: <@${creatorId[1]}>\n\n${channelStatus}`)

	const row = new ActionRowBuilder().addComponents(buttons);
	menu.edit({ embeds: [newEmbed], components: [row] })
}

async function SetVoiceState(voiceChannel, newState)
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
	return true
}

module.exports = {
	IsVoiceChannel,
	GetOwner,
	GetTextChannel,
	GetVoiceChannel,
	UpdateMenu,

	Commands: {
		SetVoiceState
	}
}