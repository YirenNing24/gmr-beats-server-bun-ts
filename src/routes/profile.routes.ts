import Elysia from 'elysia';
import { getDriver } from '../db/memgraph';
import ProfileService from '../game.services/profile.service';
import { UpdateStatsFailed, UpdatedStats } from '../game.services/game.services.interfaces';



const router = (app: Elysia) => {
    app.post('/api/update/statpoints', async (context) => {
        try {
          const statPoints = context.body
          const driver = getDriver();
          const profileService = new ProfileService(driver);
          const output: UpdatedStats | UpdateStatsFailed = await profileService.updateStats(statPoints);

          return output
        } catch (error: any) {
          console.log(error)
          return error
        }
      }
    );  

};

export default router;
