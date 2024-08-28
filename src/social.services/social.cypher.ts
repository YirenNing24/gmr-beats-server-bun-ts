export const followCypher: string = `
    MATCH (u:User {username: $userName}) 
    MATCH (p:User {username: $userToFollow})
    MERGE (u)-[r:FOLLOW]->(p)
    ON CREATE SET u.createdAt = timestamp()
    RETURN p 
    {.*, 
    followed: true} 
    AS follow
    `