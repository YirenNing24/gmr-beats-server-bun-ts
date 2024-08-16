/**
 * Cypher query string to redeem a bundle for a user and return the user's local wallet and key.
 *
 * @constant {string} redeemBundle
 * @example
 * // Usage:
 * // MATCH (u:User {username: $userName}) 
 * // RETURN u.localWallet as localWallet, u.localWalletKey as localWalletKey
 */
export const redeemBundle: string = `
    MATCH (u:User {username: $userName}) 
    RETURN u.localWallet as localWallet, u.localWalletKey as localWalletKey`;


export const openCardpackCypher: string = `
    MATCH (u:User {username: $userName})-[:OWNED]->(p:Pack {$name})
    RETURN p as pack`;