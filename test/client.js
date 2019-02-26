'use strict'

const { strictEqual } = require('assert')
const crypto = require('crypto')
const querystring = require('querystring')
const url = require('url')
const Client = require('../client')
const opts = {
    id: 1,
    key: 'test',
    host: 'fscanner.com'
}

describe(`Client tests`, () => {
    it(`should throw exception because of invalid credentials`, () => {

        let error
        try {new Client()}
        catch (e) {error = e}

        strictEqual(true, error instanceof Error)
        strictEqual(error.message, 'Arguments opts must be an object!')

        Object.keys(opts).forEach((key) => {
            const options = { ...opts }
            delete options[key]

            let error
            try {new Client(options)}
            catch (e) {error = e}

            strictEqual(true, error instanceof Error)
        })
    })

    it(`should create new Client instance`, () => {
        const client = new Client(opts)
        strictEqual(true, client instanceof Client)
    })

    it(`should return valid pixels`, () => {
        const client = new Client(opts)
        const data = createData()
        const queryHash = client.encryptData(data)
        const ii = identifier()

        const impUrl = 'http:' + client.getImpressionPixelUrl(1, ii, queryHash)
        strictEqual('string', typeof impUrl)

        const parsedImpUrl = url.parse(impUrl)
        strictEqual('fscanner.com', parsedImpUrl.hostname)
        strictEqual('/scan', parsedImpUrl.pathname)

        const parsedImpQuery = querystring.parse(parsedImpUrl.query)
        strictEqual(ii, parsedImpQuery.ii)
        strictEqual('1', parsedImpQuery.img)
        strictEqual(client.id + '-' + queryHash, parsedImpQuery.e)

        const clickUrl = 'http:' + client.getClickPixelUrl(data, ii)
        strictEqual('string', typeof clickUrl)

        const parsedClickUrl = url.parse(clickUrl)
        strictEqual('fscanner.com', parsedClickUrl.hostname)
        strictEqual('/click', parsedClickUrl.pathname)

        const parsedClickQuery = querystring.parse(parsedImpUrl.query)
        strictEqual(ii, parsedClickQuery.ii)
        strictEqual('1', parsedClickQuery.img)
        strictEqual(client.id + '-' + queryHash, parsedClickQuery.e)
    })

    it('should successful replace macro', () => {
        const client = new Client(opts)
        const data = createData()

        const scriptTagObject = client.getImpressionScriptTag(data)
        const imageTagObject = client.getImpressionImageTag(data)

        for (const exp of [/{ii}/, /{query}/, /{tmp}/]) {
            strictEqual(false, exp.test(scriptTagObject.tag))
            strictEqual(false, exp.test(imageTagObject.tag))
        }
    })

    it('should append a valid noscript>img tag', () => {
        const client = new Client(opts)
        const data = createData()

        const { tag } = client.getImpressionScriptTag(data)
        const imageTagObject = client.getImpressionImageTag(data)
        const part = tag.substring(tag.indexOf('<noscript>') + 10, tag.length - 11)

        strictEqual(slicer(part), slicer(imageTagObject.tag))

        function slicer (str) {
            const idx = str.indexOf('ii=')
            return str.substring(0, idx) + str.substring(idx + 24)
        }
    })
})

function createData () {
    return {
        ifa: 'some ifa',
        app: 1,
        pub_id: 555,
        inv: 'some.application.bundle',
        inv_id: 'ad37geiq3egqwe',
        pt: 'banner',
        src: 'bought thrue ssp1',
        ip: '192.168.1.100',
        ssp_id: '0',
        dsp_id: '12443',
        bought: 2.33,
        sold: 2.89,
        ua: 'some ua string',
        country: 'usa',
        js: 1,
        event: 1,
        ac: 0
    }
}

function identifier () {
    return crypto.randomBytes(10).toString('hex')
}
