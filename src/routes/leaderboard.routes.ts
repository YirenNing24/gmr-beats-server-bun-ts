//** ELYSIA AND JWT MODULE IMPORT
import Elysia from 'elysia'

//** MEMGRAPH DRIVER AND TYPES
import { Driver } from 'neo4j-driver'
import { getDriver } from '../db/memgraph'

//** SERVICES IMPORT
import LeaderboardService from '../game.services/leaderboard.services/leaderboard.services'

//** TYPES IMPORTS
import { getWeeklyLeaderboardSchema } from '../game.services/leaderboard.services/leaderboard.schema'


const leaderboards = (app: Elysia): void => {
  app.get('/api/leaderboard/weekly', async ({ headers, query }) => {
    try {
      const authorizationHeader = headers.authorization;
      if (!authorizationHeader || !authorizationHeader.startsWith('Bearer ')) {
          throw new Error('Bearer token not found in Authorization header');
      }
      const jwtToken: string = authorizationHeader.substring(7);


      const driver: Driver = getDriver();
      const leaderboardService: LeaderboardService = new LeaderboardService(driver);
      const output = await leaderboardService.weeklyLeaderboard(jwtToken, query);

      return output
    } catch (error: any) {
      throw error;
      }
    }, getWeeklyLeaderboardSchema
  );

};


export default leaderboards;
