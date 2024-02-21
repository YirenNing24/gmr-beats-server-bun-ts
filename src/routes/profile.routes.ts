//** ELYSIA AND JWT MODULE IMPORT
import Elysia from 'elysia'

//** JWT IMPORT
import jwt from 'jsonwebtoken'

//** MEMGRAPH DRIVER AND TYPES
import { getDriver } from '../db/memgraph'
import { Driver } from 'neo4j-driver'

//** SERVICES IMPORTS
import ProfileService from '../game.services/profile.service'

//** OUTPUT IMPORT
import { ProfilePicture, UpdateStatsFailed } from '../game.services/game.services.interfaces'

//** CONFIG IMPORT
import { JWT_SECRET } from '../config/constants'
import { SuccessMessage } from '../outputs/success.message'

const router = (app: Elysia) => {
  app.post('/api/update/statpoints', async (context): Promise<any | UpdateStatsFailed | Error > => {
    try {

      const authorizationHeader = context.headers.authorization;
      if (!authorizationHeader || !authorizationHeader.startsWith('Bearer ')) {
          throw new Error('Bearer token not found in Authorization header');
      }
      const jwtToken: string = authorizationHeader.substring(7);

      const statPoints = context.body;
      const driver: Driver = getDriver();

      const profileService = new ProfileService(driver);

      const output: any | UpdateStatsFailed = await profileService.updateStats(statPoints, jwtToken);

      return output as any | UpdateStatsFailed 
    } catch (error: any) {
      return error;
    }
  })

  .post('/api/upload/dp', async (context): Promise<SuccessMessage | Error> => {
    try {
      const authorizationHeader: string | null = context.headers.authorization;
      if (!authorizationHeader || !authorizationHeader.startsWith('Bearer ')) {
        throw new Error('Bearer token not found in Authorization header');
      }
      const jwtToken: string = authorizationHeader.substring(7);

      const { bufferData } = context.body as { bufferData: ArrayBuffer }

      const driver: Driver = getDriver();
      const profileService: ProfileService = new ProfileService(driver);
      const output: SuccessMessage = await profileService.uploadProfilePic(bufferData, jwtToken);

      return output as SuccessMessage
    } catch (error: any) {
      return error;
    }
  })

  .get('/api/open/profilepic', async (context): Promise<ProfilePicture[] | Error> => {
    try {
      const authorizationHeader: string | null = context.headers.authorization;
      if (!authorizationHeader || !authorizationHeader.startsWith('Bearer ')) {
        throw new Error('Bearer token not found in Authorization header');
      }
      const jwtToken: string = authorizationHeader.substring(7);


      const driver: Driver = getDriver();
      const profileService: ProfileService = new ProfileService(driver);
      const output: ProfilePicture[] = await profileService.getProfilePic(jwtToken);

      return output as ProfilePicture[]
    } catch (error: any) {
      return error;
    }
  })
  
};

export default router;
