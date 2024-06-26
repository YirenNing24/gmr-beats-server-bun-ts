//** ELYSIA AND JWT MODULE IMPORT
import Elysia from 'elysia'
import jwt from 'jsonwebtoken'


//** MEMGRAPH DRIVER AND TYPES
import { Driver } from 'neo4j-driver'
import { getDriver } from '../db/memgraph'

//** SERVICES IMPORT
import LeaderboardService from '../game.services/leaderboard.services/leaderboard.services'

//** TYPES IMPORTS
import { ClassicLeaderboardRequest } from '../game.services/leaderboard.services/leaderboard.interface'
import { authorizationBearerSchema } from './route.schema/schema.auth'


const leaderboards = (app: Elysia): void => {
  app.get('/api/leaderboard/weekly', async ({ headers }) => {
    try {
      const authorizationHeader = headers.authorization;
      if (!authorizationHeader || !authorizationHeader.startsWith('Bearer ')) {
          throw new Error('Bearer token not found in Authorization header');
      }
      const jwtToken: string = authorizationHeader.substring(7);

      //@ts-ignore
      const { gameMode, songName, period, difficulty } = context.query as ClassicLeaderboardRequest

      const driver: Driver = getDriver();
      const leaderboardService: LeaderboardService = new LeaderboardService(driver)
      const output: ClassicScoreStats[] = await leaderboardService.weeklyLeaderboard(gameMode, songName, period, difficulty, jwtToken);

      return output as ClassicScoreStats[]

    } catch (error: any) {
      throw error;
      }
    }, authorizationBearerSchema
  );

};


export default leaderboards;
