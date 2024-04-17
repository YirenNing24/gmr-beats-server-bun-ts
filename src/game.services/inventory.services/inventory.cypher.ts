    /**
     * Cypher query string for opening a user's card inventory.
     * This query matches a user who owns cards and returns the URI, card object, and relationship type for each card.
     * @param {string} userName - The username of the user whose card inventory is being opened.
     * @returns {string} - Cypher query string
     */
    export const inventoryOpenCardCypher = `
      MATCH (u:User{username: $userName})-[:OWNED]->(c:Card)
      OPTIONAL MATCH (u)-[r]->(c)
      RETURN c.uri as uri, c as card, TYPE(r) as relationshipType`;
    
/**
 * Cypher query string for updating a user's card inventory.
 * This query removes the BAGGED relationship and adds an EQUIPPED relationship for a card owned by the user with the specified URI.
 * @param {string} userName - The username of the user whose inventory is being updated.
 * @param {string} uri - The URI of the card to be updated.
 * @returns {string} - Cypher query string
 */
export const itemEquipCypher =`
  MATCH (u:User {username: $userName})-[:OWNED|BAGGED]->(c:Card {uri: $uri})
  WHERE EXISTS((u)-[:OWNED]->(c)) AND EXISTS((u)-[:BAGGED]->(c))
  DELETE (u)-[:BAGGED]->(c)
  CREATE (u)-[:EQUIPPED]->(c)
  RETURN c`;







    
