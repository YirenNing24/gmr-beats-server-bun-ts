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
import { UpdateStatsFailed } from '../game.services/game.services.interfaces'

//** CONFIG IMPORT
import { JWT_SECRET } from '../config/constants'
import { SuccessMessage } from '../outputs/success.message'

const router = (app: Elysia) => {
  app.post('/api/update/statpoints', async (context) => {
    try {
      const statPoints = context.body;
      const driver: Driver = getDriver();
      const profileService = new ProfileService(driver);
      const output: any | UpdateStatsFailed = await profileService.updateStats(statPoints);

      return output
    } catch (error: any) {
      return error;
    }
  })

  .post('/api/upload/dp', async (context) => {
    try {
      const authorizationHeader: string | null = context.headers.authorization;
      if (!authorizationHeader || !authorizationHeader.startsWith('Bearer ')) {
        throw new Error('Bearer token not found in Authorization header');
      }

      const jwtToken: string = authorizationHeader.substring(7);
      const decodedToken: string | jwt.JwtPayload = jwt.verify(jwtToken, JWT_SECRET);
      const { userName } = decodedToken as { userName: string };

      const { bufferData } = context.body as { bufferData: Buffer}

      const driver: Driver = getDriver();
      const profileService: ProfileService = new ProfileService(driver);
      const output: SuccessMessage = await profileService.uploadProfilePic(bufferData, userName);

      return output as SuccessMessage
    } catch (error: any) {
      return error;
    }
  });
};

export default router;
