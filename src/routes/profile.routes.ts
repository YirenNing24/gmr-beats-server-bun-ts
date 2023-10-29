import Elysia from 'elysia';
import { getDriver } from '../db/memgraph';
import ProfileService from '../game.services/profile.service';



const router = (app: Elysia) => {
    app.post('/api/update/statpoints', async (context) => {
        try {
          const statPoints = context.body
          const driver = getDriver();
          const profileService = new ProfileService(driver);
          const output = await profileService.updateStats(statPoints);
          return output
        } catch (error) {
          console.log(error)
          return error
        }
      }
    );  

};

export default router;
