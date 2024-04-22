/**
 * Cypher query to retrieve user and the count of bagged cards for a given username.
 * @param $username The username of the user whose bagged cards are to be retrieved.
 */
export const buyCardCypher: string = `MATCH (u:User {username: $username})
OPTIONAL MATCH (u)-[:BAGGED]->(c:Card)
WITH u, COUNT(c) as sizeBaggedCards
RETURN u, sizeBaggedCards`;

/**
 * Cypher query to retrieve valid cards that are not packed and have a valid lister.
 */
/**
 * Cypher query to retrieve valid cards that are listed in the CardStore.
 */
export const getValidCards: string = `
    MATCH (c:Card)-[:LISTED]->(:CardStore)
    RETURN c`;

