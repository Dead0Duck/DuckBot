const { EmbedBuilder, ReactionManager } = require('discord.js')

const reactions = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟']

const renderFields = (variants, votes, totalVotes = 0) => {
    const fields = []
    let optCounter = 0
    variants.forEach((option, i) => {
        fields.push({ name: `${reactions[option.id]}: ${option.value}`, value: `${Math.round((votes ? votes[i] : 0) / totalVotes * 100) || 0} % | ${votes ? votes[i] : 0} 👤` })
        optCounter++
    })
    return { fields, optCounter }
}

const pollBuild = (options = {}, fields) =>
    new EmbedBuilder()
        .setAuthor({ name: '📊 Опрос' })
        .setTitle(options.title)
        .setColor(options.color ?? '23a55a')
        .setFields(fields)

const cooldown = new Map()

const checkVote = async (messageReaction, user, operator) => {
    if (user.id === user.client.application.id) return
    const { PollSchema } = process.mongo
    const reactionEmoji = messageReaction.emoji.name

    if (reactions.includes(reactionEmoji)) {
        try {
            const cdId = user.id + messageReaction.message.id
            if (cooldown.has(cdId)) return cooldown.set(cdId, setTimeout(() => cooldown.delete(cdId), 15_000))
            cooldown.set(cdId, setTimeout(() => cooldown.delete(cdId), 1_000))

            const pollData = await PollSchema.findOne({
                MessageId: messageReaction.message.id,
                Variants: { $elemMatch: { id: reactions.findIndex(emoji => emoji === reactionEmoji) } }
            })
            if (!pollData) return

            const message = await messageReaction.message.fetch()
            let totalVotes = 0
            const votes = message.reactions.cache.map(reaction => {
                if (reactions.includes(reaction.emoji.name)) {
                    const count = reaction.count - 1
                    totalVotes += count
                    return count
                }
            })
            // TODO: Сделать проверку юзеров, которые поставили более 2 реакции
            const { fields } = renderFields(pollData.Variants, votes, totalVotes)
            const embed = pollBuild({ title: message.embeds[0].title, color: message.embeds[0].color }, fields)
            await messageReaction.message.edit({ embeds: [embed] })
        } catch (e) {
            console.error(e)
        }
        return
    }
}


module.exports = { reactions, renderFields, pollBuild, checkVote }