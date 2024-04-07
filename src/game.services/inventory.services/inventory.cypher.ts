/**
 * Cypher query string for opening a user's card inventory.
 * This query matches a user who owns cards and returns the URI and card object for each card.
 * @param {string} userName - The username of the user whose card inventory is being opened.
 * @returns {string} - Cypher query string
 */
export const inventoryOpenCardCypher = `
  MATCH (u:User{username: $userName})-[:OWNS]->(c:Card)
  RETURN c.uri as uri, c as card`;

/**
 * Cypher query string for updating a user's card inventory.
 * This query sets the 'equipped' property of a card owned by the user with the specified URI.
 * @param {string} userName - The username of the user whose inventory is being updated.
 * @param {string} uri - The URI of the card to be updated.
 * @param {boolean} equipped - The new value for the 'equipped' property.
 * @returns {string} - Cypher query string
 */
export const updateInventoryCypher =`
  MATCH (u:User {username: $userName})-[:OWNS]->(c:Card {uri: $uri})
    SET c.equipped = $equipped
    RETURN c`;