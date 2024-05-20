//** ELYSIA IMPORT
import Elysia from 'elysia';

//** MEMGRAPH IMPORT 
import { getDriver } from '../db/memgraph';
import { Driver } from 'neo4j-driver';

//** SERVICE IMPORT
import RewardService from '../game.services/rewards.services/rewards.service';

//** TYPE INTERFACES


//** SCHEMA IMPORT
import { authorizationBearerSchema } from './route.schema/schema.auth';



const rewards = (app: Elysia) => {


  app.get('/api/reward/card', async ({ headers }) => {
      try {
        const authorizationHeader: string = headers.authorization;
        if (!authorizationHeader || !authorizationHeader.startsWith('Bearer ')) {
          throw new Error('Bearer token not found in Authorization header');
        }
        const jwtToken: string = authorizationHeader.substring(7);

        const driver: Driver = getDriver();
        const rewardService: RewardService = new RewardService(driver)
        
        const output = await rewardService.getAvailableCardReward(jwtToken);

        return output 
      } catch (error: any) {
        console.log(error)
        throw error

        }
     }, authorizationBearerSchema
    )

}

export default rewards