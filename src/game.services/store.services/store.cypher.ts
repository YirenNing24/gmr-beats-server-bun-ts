

export const buyCardCypher: string = `MATCH (u:User {username: $username})
OPTIONAL MATCH (u)-[:BAGGED]->(c:Card)
WITH u, COUNT(c) as sizeBaggedCards
RETURN u, sizeBaggedCards`