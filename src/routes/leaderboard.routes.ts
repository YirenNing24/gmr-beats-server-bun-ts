//** ELYSIA AND JWT MODULE IMPORT
import Elysia from 'elysia'
import jwt from 'jsonwebtoken'
;

//** MEMGRAPH DRIVER AND TYPES
import { Driver } from 'neo4j-driver';
import { getDriver } from '../db/memgraph';

//** SERVICES
import LeaderboardService from '../game.services/leaderboard.services';

//** TYPES IMPORTS
import { ClassicLeaderboardRequest, ClassicScoreStats } from '../game.services/game.services.interfaces';


const leaderboards = (app: Elysia): void => {
  app.get('/api/leaderboard/weekly', async (context) => {
    try {
      const authorizationHeader = context.headers.authorization;
      if (!authorizationHeader || !authorizationHeader.startsWith('Bearer ')) {
          throw new Error('Bearer token not found in Authorization header');
      }
      const jwtToken: string = authorizationHeader.substring(7);
      jwt.decode(jwtToken)  
        
        //@ts-ignore
        const { gameMode, songName, period, difficulty } = context.query as ClassicLeaderboardRequest

        const driver: Driver = getDriver();
        const leaderboardService: LeaderboardService = new LeaderboardService(driver)
        const output: ClassicScoreStats[] = await leaderboardService.weeklyLeaderboard(gameMode, songName, period, difficulty);

        return output
    } catch (error: any) {
      throw error;
    }
});

};


export default leaderboards;
