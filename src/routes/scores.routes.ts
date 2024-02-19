//** ELYSIA AND JWT MODULE IMPORT
import Elysia, { Context } from 'elysia'
import jwt from 'jsonwebtoken'

//** MEMGRAPH DRIVER AND TYPES
import { Driver } from 'neo4j-driver';
import { getDriver } from '../db/memgraph';

//** SERVICE
import ScoreService from '../game.services/scores.service';
import { ClassicScoreStats } from '../game.services/game.services.interfaces';


const scores = (app: Elysia): void => {
    app.post('/api/save/score/classic', async (context: Context) => {
        try {
            const authorizationHeader: string | null = context.headers.authorization;
            if (!authorizationHeader || !authorizationHeader.startsWith('Bearer ')) {
                throw new Error('Bearer token not found in Authorization header');
            }
            const jwtToken: string = authorizationHeader.substring(7);
            const decodedToken = jwt.decode(jwtToken)  
            const { userName } = decodedToken as { userName: string };
            const classicScoreStats: ClassicScoreStats = context.body as ClassicScoreStats

            const driver: Driver = getDriver();
            const scoreService:  ScoreService = new ScoreService(driver)
            const output: void = await scoreService.saveScoreClassic(userName, classicScoreStats)

          return output
        } catch (error: any) {
          throw error
        }
      }
    )

    .get('/api/open/highscore/classic', async (context) => {
        try {
            const authorizationHeader = context.headers.authorization;
            if (!authorizationHeader || !authorizationHeader.startsWith('Bearer ')) {
                throw new Error('Bearer token not found in Authorization header');
            }
            const jwtToken: string = authorizationHeader.substring(7);
            const decodedToken = jwt.decode(jwtToken)  
            const { userName } = decodedToken as { userName: string };
      
            const driver: Driver = getDriver();
            const scoreService: ScoreService = new ScoreService(driver)
            const output: ClassicScoreStats[] = await scoreService.getHighScoreClassic(userName)

          return output 
        } catch (error: any) {
          throw error
        }
    })

    

};


export default scores;
