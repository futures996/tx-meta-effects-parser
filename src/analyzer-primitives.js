const {StrKey} = require('stellar-sdk')
const BigNumber = require('bignumber.js')
const effectTypes = require('./effect-types')
const {UnexpectedTxMetaChangeError} = require('./errors')

/**
 * Calculate difference between two amount
 * @param {String} before
 * @param {String} after
 * @return {String}
 */
function diff(before, after) {
    return new BigNumber(before).minus(after).toString()
}

/**
 * Returns true for AlphaNum4/12 assets adn false otherwise
 * @param {String} asset
 */
function isAsset(asset){
    return asset.includes('-') //lazy check for {code}-{issuer}-{type} format
}

/**
 * Convert stroops to human-friendly numbers format
 * @param {String} value
 * @return {String}
 * @internal
 */
function adjustPrecision(value) {
    if (value === '0')
        return value
    let negative = false
    if (value[0] === '-') {
        negative = true
        value = value.substring(1)
    }
    let integer = value.length <= 7 ? '0' : value.substring(0, value.length - 7)
    const fractional = value.substring(value.length - 7).padStart(7, '0').replace(/0+$/, '')
    if (!fractional.length)
        return negative ? '-' + integer : integer
    return (negative ? '-' + integer : integer) + '.' + fractional
}

/**
 * Trim trailing fractional zeros from a string amount representation
 * @param {String} value
 * @return {String}
 * @internal
 */
function trimZeros(value) {
    let [integer, fractional] = value.split('.')
    if (!fractional)
        return integer
    const trimmed = fractional.replace(/0+$/, '')
    if (!trimmed.length)
        return integer
    return integer + '.' + trimmed
}

/**
 * Replace multiplexed addresses with base G addresses
 * @param {String} address
 * @return {String}
 * @internal
 */
function normalizeAddress(address) {
    const prefix = address[0]
    if (prefix === 'G')
        return address //lazy check for ed25519 G address
    if (prefix !== 'M')
        throw new TypeError('Expected ED25519 or Muxed address')
    const rawBytes = StrKey.decodeMed25519PublicKey(address)
    return StrKey.encodeEd25519PublicKey(rawBytes.subarray(0, 32))
}

/**
 * @param {String} action
 * @param {String} type
 * @return {String}
 */
function encodeSponsorshipEffectName(action, type) {
    let actionKey
    switch (action) {
        case 'created':
            actionKey = 'Created'
            break
        case 'updated':
            actionKey = 'Updated'
            break
        case 'removed':
            actionKey = 'Removed'
            break
        default:
            throw new UnexpectedTxMetaChangeError({action, type})
    }
    return effectTypes[`${type}Sponsorship${actionKey}`]
}

/**
 * Check if asset issuer is a source account
 * @param {String} account
 * @param {String} asset
 * @return {Boolean}
 */
function isIssuer(account, asset) {
    return asset.includes(account)
}

module.exports = {
    adjustPrecision,
    trimZeros,
    normalizeAddress,
    encodeSponsorshipEffectName,
    isIssuer,
    isAsset,
    diff
}
