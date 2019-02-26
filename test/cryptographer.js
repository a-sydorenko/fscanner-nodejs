'use strict'

const { strictEqual } = require('assert')
const Cryptographer = require('../cryptographer')
const string = 'this is test string \'\\@!#$%^&*()_+|}"{:;qz'
const key = 'qwerty'

describe(`Cryptographer tests`, () => {
    it(`should encrypt-decrypt target string correctly`, () => {
        strictEqual(string, Cryptographer.decrypt(
            Cryptographer.encrypt(string, key), key
        ))
    })
})
