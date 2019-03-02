'use strict'

const crypto = require('crypto')
const Cryptographer = require('./cryptographer')
const allowedFields = [
    'ifa', 'app', 'pub_id', 'inv', 'inv_id', 'pt', 'src', 'ip', 'ssp_id',
    'dsp_id', 'bought', 'sold', 'ua', 'country', 'js', 'event', 'ac'
]
const imageTag = '<img src="{tmp}" width="1" height="1" style="display:none"/>'

const RE_IMPRESSION_ID = /{ii}/
const RE_QUERY_HASH = /{query}/
const RE_TEMPLATE = /{tmp}/

class Client {

    /**
     * @param {object} opts
     * @param {number} opts.id
     * @param {string} opts.key
     * @param {string} opts.host
     * */

    constructor (opts) {
        if (!(opts instanceof Object)) {
            throw new Error('Arguments opts must be an object!')
        }

        if (typeof opts.id !== 'number') {
            throw new Error('Invalid id option!')
        }

        if (typeof opts.key !== 'string') {
            throw new Error('Invalid key option!')
        }

        if (typeof opts.host !== 'string') {
            throw new Error('Invalid host option!')
        }

        this.id = opts.id
        this.key = opts.key
        this.impUrl = `//${ opts.host }/scan?`
        this.clickUrl = `//${ opts.host }/click?ii={ii}&e=${ opts.id }-{query}`
        this.tmpl = collectorTemplate(this.impUrl, this.id)
    }

    /**
     * @method getImpressionPixelUrl
     * @description get pixel to track impression
     * @param {number} img - image pixel flag
     * @param {string} ii - impression identifier
     * @param {string} queryHash - query hash
     * @returns {string} -
     * */

    getImpressionPixelUrl (img, ii, queryHash) {
        return `${ this.impUrl }img=${ img }&ii=${ ii }&e=${ this.id }-${ queryHash }`
    }

    /**
     * @method encryptData
     * @description transform object to encrypted query string
     * @param {object} data - object, which has to be transformed to the string
     * @returns {string} - query hash
     * */

    encryptData (data) {
        return Cryptographer.encrypt(stringifyParams(data), this.key)
    }

    /**
     * @method getImpressionImageTag
     * @description get img tag to append it to the adm to track impression
     * @param {object} data - object, which has to be transformed to the string
     * @returns {object} - impression img tag
     * */

    getImpressionImageTag (data) {
        const queryHash = this.encryptData(data)
        const ii = identifier()
        return {
            ii,
            clickId: data.click_id,
            queryHash,
            tag: imageTag.replace(RE_TEMPLATE, this.getImpressionPixelUrl(+(+data.js === 1), ii, queryHash))
        }
    }

    /**
     * @method getImpressionScriptTag
     * @description get script tag to append it to the adm to track impression
     * @param {object} data - object, which has to be transformed to the string
     * @returns {object} - impression script tag
     * */

    getImpressionScriptTag (data) {
        const { ii, queryHash, tag } = this.getImpressionImageTag(data)
        return {
            ii,
            clickId: data.click_id,
            queryHash,
            tag: this.tmpl
                .replace(RE_IMPRESSION_ID, ii)
                .replace(RE_QUERY_HASH, queryHash) + `<noscript>${ tag }</noscript>`
        }

    }

    /**
     * @method getClickPixelUrl
     * @description get pixel to track click
     * @param {string} ii - impression identifier
     * @param {string} clickId - click identifier
     * @returns {string} - click url string
     * */

    getClickPixelUrl (ii, clickId) {
        const query = `v=${ Math.trunc(Date.now() / 1000) + 86400 }&click_id=${ clickId }`
        return this.clickUrl
            .replace(RE_IMPRESSION_ID, ii)
            .replace(RE_QUERY_HASH, Cryptographer.encrypt(query, this.key))
    }
}

module.exports = Client

/**
 * @function stringifyParams
 * @description almost the same as querystring.stringify
 * @param {object} data                 - object, which has to be transformed to the string
 * @param {string} [data.ifa]           - identifier for publishers. 128-bit hexadecimal identifier (UUID)
 * @param {string|number} data.app      - inventory type = 1 - application, 0 - site
 * @param {string|number} data.adv_id   - advertiser id (max length = 32 chars)
 * @param {string|number} data.pub_id   - publisher id (max length = 32 chars)
 * @param {string} data.inv             - app name or site address (max length = 255 chars)
 * @param {string|number} data.inv_id   - inventory id (max length = 32 chars)
 * @param {string} data.pt              - placement type. Supported (banner, native, video, popup, popunder, other)
 * @param {string} data.src             - any third party identifier (max length = 32 chars)
 * @param {string} data.ip              - IPv4 address
 * @param {string|number} data.ssp_id   - ssp id (max length = 32 chars, 0 - if product is ssp)
 * @param {string|number} data.dsp_id   - dsp id (max length = 32 chars, 0 - if product is dsp)
 * @param {number} [data.bought]        - ad purchase price
 * @param {number} [data.sold]          - ad sale price
 * @param {string} [data.ua]            - user-agent string (max length = 512 chars)
 * @param {string} [data.country]       - country iso-3 (constant length = 3 chars)
 * @param {string|number} data.js       - shows inventory supports javascript (1 - true, 0 - false)
 * @param {string|number} data.event    - tracked event type (1 - impression, 2 - click)
 * @param {string|number} data.ac       - await for the click (1 - true, 0 - false)
 * @param {string} data.click_id - internal
 * @returns {string} - query string
 * */

function stringifyParams (data) {
    const pairs = [`v=${ Math.trunc(Date.now() / 1000) + 600 }`]

    if (data.ac === 1) {
        data.click_id = identifier()
    }
    for (const field of allowedFields) {
        if (data[field] !== void 0) {
            pairs.push(`${ field }=${ data[field] }`)
        }
    }

    return pairs.join('&')
}

/**
 * @function identifier
 * @returns {string} - random string
 * */

function identifier () {
    return crypto.randomBytes(10).toString('hex')
}

/**
 * @function collectorTemplate
 * @param {string} impUrl - impression url
 * @param {number} id - client id
 * @returns {string}
 * */

function collectorTemplate (impUrl, id) {
    return `<script>function f(){const t=Function("return this")();return t.top&&t.top!==t?t.top:t}!function(t,e){var n=t.document,c=t.screen;function i(){this.p="${ impUrl }ii={ii}&",this.c=["loc="+encodeURIComponent(t.location.href),"ce="+ +navigator.cookieEnabled,"w="+c.width,"h="+c.height],this.called=!1,setTimeout(()=>{this.execute()},0)}i.prototype.push=function(){for(var t=0;t<arguments.length;t++)arguments[t]&&"string"==typeof arguments[t]&&this.c.push(arguments[t])},i.prototype.execute=function(){var t=n.createElement("script");switch(!0){case arguments.length&&this.called:t.src=this.p+Array.from(arguments).join("&")+"&late=1";break;case!arguments.length&&!this.called:t.src=this.p+this.c.join("&"),this.called=!0}n.getElementsByTagName("body")[0].appendChild(t)},t.__FSC=t.__FSC||i;var o=setTimeout(function(){s(e)},500);function s(){if(t.__fsc=t.__fsc||new t.__FSC,!t.__fsc.called)return t.__fsc.push.apply(t.__fsc,arguments);t.__fsc.execute.apply(t.__fsc,arguments)}t.addEventListener("DOMContentLoaded",function(){clearTimeout(o),s(e,"d=1")})}(f(),"e=${ id }-{query}");</script>`
}

