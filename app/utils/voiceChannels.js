const { EmbedBuilder, PermissionFlagsBits, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');

function GetOwner(channel)
{
    let perms = channel.permissionOverwrites.cache
    let owner = perms.find(p => p.allow.has(PermissionFlagsBits.ManageChannels))
    owner = owner?.id

    return owner
}

async function GetTextChannel(channel, guildData)
{
	let channels = await channel.guild.channels.fetch()
	return channels.find(chn => chn.parentId == guildData.VoiceTextCategory && chn.topic == channel.id) || false
}

async function GetVoiceChannelFromText(channel)
{
	console.log(channel.topic)
	return await channel.guild.channels.fetch(channel.topic)
}

async function UpdateMenu(channel, voiceChannel)
{
	voiceChannel = voiceChannel || await GetVoiceChannelFromText(channel)
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
			.setCustomId('voice_unlock')
			.setLabel('Открыть')
			.setStyle(ButtonStyle.Success);
		buttons.push(button)
	}

	if (!isClosed)
	{
		const button = new ButtonBuilder()
			.setCustomId('voice_lock')
			.setLabel('Закрыть')
			.setStyle(ButtonStyle.Danger);
		buttons.push(button)
	}

	if (!isHidden)
	{
		const button = new ButtonBuilder()
			.setCustomId('voice_hide')
			.setLabel('Спрятать')
			.setStyle(ButtonStyle.Secondary);
		buttons.push(button)
	}
	// BUTTONS END

	const newEmbed = EmbedBuilder.from(embed)
		.setDescription(`Комната: <#${channel.topic}>\nВладелец: <@${ownerId}>\nСоздатель: <@${creatorId[1]}>\n\n${channelStatus}`)

	const row = new ActionRowBuilder().addComponents(buttons);
	menu.edit({ embeds: [newEmbed], components: [row] })
}

module.exports = {
	GetOwner,
	GetTextChannel,
	UpdateMenu,
}