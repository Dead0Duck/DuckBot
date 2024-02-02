const dayjs = require('dayjs')
const duration = require('dayjs/plugin/duration')
const relativeTime = require('dayjs/plugin/relativeTime')
require('dayjs/locale/ru')
dayjs.extend(duration)
dayjs.extend(relativeTime)

const units = new Map()

units.set(['s', 'с'], 1000)
units.set(['m', 'м'], 60_000)
units.set(['h', 'ч'], 3_600_000)
units.set(['d', 'д'], 86_400_000)
units.set(['w', 'н'], 604_800_000)
units.set(['y', 'г'], 31_556_952_000)

module.exports = {
    parseMSeconds: (string) => {
        if (isNaN(parseInt(string))) {
            return null
        }
        let parsedMSeconds = null
        units.forEach((ms, key) => {
            key.forEach((item) => {
                if (string.toLowerCase().endsWith(item)) {
                    parsedMSeconds = parseInt(string) * ms
                }
            })
        })
        return parsedMSeconds
    },
    humanize: (ms) => {
        return dayjs.duration(ms, 'ms').locale('ru').humanize()
    },
    defineJobs: async () => {
        const { AgendaScheduler, GuildSchema } = process.mongo
        AgendaScheduler.define("UnbanWave", async () => {
            client = process.disClient
            const toUnban = await GuildSchema.find({ Bans: { $elemMatch: { unban: { $lte: new Date() } } } }, { "Bans.$": 1, "Guild": 1 })
            const promises = []
            toUnban.forEach(async (data) => {
                promises.push(client.guilds.fetch(data.Guild).then(guild => {
                    for (let index = 0; index < data.Bans.length; index++) {
                        const element = data.Bans[index];
                        guild.bans.remove(element.user, 'истёк срок бана').catch((e) => {
                            if (e.code !== 10026) {
                                console.error(e)
                            }
                        })
                        return element.user
                    }
                }))
            })

            Promise.all(promises).then(async (values) => {
                const result = await GuildSchema.updateMany({ Bans: { $elemMatch: { unban: { $lte: new Date() } } } }, { $pull: { Bans: { user: { $in: values.filter(value => value !== undefined) } } } })
            })
        })
        AgendaScheduler.every("1 minute", "UnbanWave")
    }
}