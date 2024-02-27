//** ELYSIA AND JWT MODULE IMPORT
import Elysia from 'elysia'

//** MEMGRAPH DRIVER AND TYPES
import { getDriver } from '../db/memgraph'
import { Driver } from 'neo4j-driver'

//** SERVICES IMPORTS
import ProfileService from '../game.services/profile.service'

//** OUTPUT IMPORT
import { ProfilePicture, StatPoints, UpdateStatsFailed } from '../game.services/game.services.interfaces'

//** CONFIG IMPORT
import { SuccessMessage } from '../outputs/success.message'

//** VALIDATION SCHEMA IMPORT
import { authorizationBearerSchema } from './route.schema/schema.auth'
import { newStatPointsSchema, uploadDpBufferSchema } from './route.schema/schema.profile'


const router = (app: Elysia) => {
  app.post('/api/update/statpoints', async ({ headers, body }): Promise<any | UpdateStatsFailed | Error > => {
    try {

      const authorizationHeader = headers.authorization;
      if (!authorizationHeader || !authorizationHeader.startsWith('Bearer ')) {
          throw new Error('Bearer token not found in Authorization header');
      }
      const jwtToken: string = authorizationHeader.substring(7);

      const statPoints = body as StatPoints

      const driver: Driver = getDriver();
      const profileService = new ProfileService(driver);

      const output: any | UpdateStatsFailed = await profileService.updateStats(statPoints, jwtToken);

      return output as any | UpdateStatsFailed 
    } catch (error: any) {
      return error;
      }
    }, newStatPointsSchema
  )

  .post('/api/upload/dp', async ({ headers, body }): Promise<SuccessMessage | Error> => {
    try {
      const authorizationHeader: string | null = headers.authorization;
      if (!authorizationHeader || !authorizationHeader.startsWith('Bearer ')) {
        throw new Error('Bearer token not found in Authorization header');
      }
      const jwtToken: string = authorizationHeader.substring(7);

      const { bufferData } = body

      const driver: Driver = getDriver();
      const profileService: ProfileService = new ProfileService(driver);
      const output: SuccessMessage = await profileService.uploadProfilePic(bufferData, jwtToken);

      return output as SuccessMessage
    } catch (error: any) {
      return error;
      }
    }, uploadDpBufferSchema
  )

  .get('/api/open/profilepic', async ({ headers }): Promise<ProfilePicture[] | Error> => {
    try {
      const authorizationHeader: string | null = headers.authorization;
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
    }, authorizationBearerSchema
  )
  
};

export default router;
