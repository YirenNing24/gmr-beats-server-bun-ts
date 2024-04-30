

export const upgradeCardDataCypher: string = `
  MATCH (u:User {username: $userName})-[:OWNED]->(c:Card {uri: $uri})
  RETURN c
`;