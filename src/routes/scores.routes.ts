//** ELYSIA AND JWT MODULE IMPORT
import Elysia, { Context } from 'elysia'
import jwt from 'jsonwebtoken'

//** MEMGRAPH DRIVER AND TYPES
import { Driver } from 'neo4j-driver';
import { getDriver } from '../db/memgraph';

//** SERVICE IMPORTS
import ScoreService from '../game.services/scores.service';
import { ClassicScoreStats } from '../game.services/game.services.interfaces';

//** VALIDATION SCHEMA IMPORT
import { authorizationBearerSchema } from './route.schema/schema.auth';


const scores = (app: Elysia): void => {
    app.post('/api/save/score/classic', async ({ headers, body }): Promise<void> => {
        try {
            const authorizationHeader: string | null = headers.authorization;
            if (!authorizationHeader || !authorizationHeader.startsWith('Bearer ')) {
                throw new Error('Bearer token not found in Authorization header');
            }
            const jwtToken: string = authorizationHeader.substring(7);

            const classicScoreStats: ClassicScoreStats = body as ClassicScoreStats

            const driver: Driver = getDriver();
            const scoreService:  ScoreService = new ScoreService(driver)
            await scoreService.saveScoreClassic(classicScoreStats, jwtToken)

        } catch (error: any) {
          throw error
        }
      }, authorizationBearerSchema
    )

    .get('/api/open/highscore/classic', async ({ headers }): Promise<ClassicScoreStats[]> => {
        try {
            const authorizationHeader = headers.authorization;
            if (!authorizationHeader || !authorizationHeader.startsWith('Bearer ')) {
                throw new Error('Bearer token not found in Authorization header');
            }
            const jwtToken: string = authorizationHeader.substring(7);

            const driver: Driver = getDriver();
            const scoreService: ScoreService = new ScoreService(driver)
            const output: ClassicScoreStats[] = await scoreService.getHighScoreClassic(jwtToken)

          return output as ClassicScoreStats[]
        } catch (error: any) {
          throw error
        }
      }, authorizationBearerSchema
    )
};


export default scores;
