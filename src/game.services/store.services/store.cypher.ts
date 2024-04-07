

export const buyCardCypher: string = `MATCH (u:User {username: $username})
OPTIONAL MATCH (u)-[:BAGGED]->(c:Card)
WITH u, COUNT(c) as sizeBaggedCards
RETURN u, sizeBaggedCards`

export const getValidCards: String = ` MATCH (c:Card) 
WHERE c.packed IS NULL AND c.lister IS NOT NULL
RETURN c`
