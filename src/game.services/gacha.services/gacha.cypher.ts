
export const redeemBundle: string = `
    MATCH (u:User {username: $userName}) 
    RETURN u.localWallet as localWallet, u.localWalletKey as localWalletKey`;


export const openCardpackCypher: string = `
    MATCH (u:User {username: $userName})-[:OWNED]->(p:Pack {$name})
    WHERE p.quantity > 0
    RETURN p as pack`;


    