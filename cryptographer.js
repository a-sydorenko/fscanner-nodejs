'use strict'

const algorithm = 'aes-256-cbc'
const inputEncoding = 'hex'
const outputEncoding = 'utf-8'
const crypto = require('crypto')

class Cryptographer {

    static decrypt (string, key) {
        const decipher = crypto.createDecipher(algorithm, key)

        let r = false
        try {
            r = decipher.update(string, inputEncoding, outputEncoding) + decipher.final(outputEncoding)
        }
        catch (e) { }
        return r
    }

    static encrypt (string, key) {
        const cipher = crypto.createCipher(algorithm, key)
        return cipher.update(string, outputEncoding, inputEncoding) + cipher.final(inputEncoding)
    }

}

module.exports = Cryptographer
