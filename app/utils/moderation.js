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
    }
}