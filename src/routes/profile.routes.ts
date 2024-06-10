//** ELYSIA AND JWT MODULE IMPORT
import Elysia from 'elysia'

//** MEMGRAPH DRIVER AND TYPES
import { getDriver } from '../db/memgraph'
import { Driver } from 'neo4j-driver'

//** SERVICES IMPORTS
import ProfileService from '../game.services/profile.services/profile.service'

//** TYPE INTERFACES
import { CardCollection, GroupCardCount, ProfilePicture ,SoulMetaData,StatPoints, UpdateStatsFailed } from '../game.services/profile.services/profile.interface'

//** CONFIG IMPORT
import { SuccessMessage } from '../outputs/success.message'

//** VALIDATION SCHEMA IMPORT
import { authorizationBearerSchema } from './route.schema/schema.auth'
import { getProfilePictureSchema, likeProfilePicturePicSchema, newStatPointsSchema, uploadDpBufferSchema } from './route.schema/schema.profile'
import { soulMetaDataSchema } from '../game.services/profile.services/profile.schema'
import ValidationError from '../outputs/validation.error'


const profile = (app: Elysia) => {
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

      const driver: Driver = getDriver();
      const profileService: ProfileService = new ProfileService(driver);


      const output: SuccessMessage = await profileService.uploadProfilePic(body, jwtToken);

      return output as SuccessMessage
    } catch (error: any) {
      return error;
      }
    }, uploadDpBufferSchema
  )

  .get('/api/open/profilepic/', async ({ headers }): Promise<ProfilePicture[] | Error> => {
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
      console.log(error)
      return error;
      }
    }, authorizationBearerSchema
  )

  .get('/api/open/playerprofilepic/:player_username', async ({ headers, params }): Promise<ProfilePicture[] | Error> => {
    try {
      const authorizationHeader: string | null = headers.authorization;
      if (!authorizationHeader || !authorizationHeader.startsWith('Bearer ')) {
        throw new Error('Bearer token not found in Authorization header');
      }
      const jwtToken: string = authorizationHeader.substring(7);
      const playerUsername: string = params?.player_username;

      const driver: Driver = getDriver();
      const profileService: ProfileService = new ProfileService(driver);
      const output: ProfilePicture[] = await profileService.getPlayerProfilePic(jwtToken, playerUsername);
      return output as ProfilePicture[]
      
    } catch (error: any) {
      console.log(error)
      return error;
      }
    }, getProfilePictureSchema
  )
  .post('/api/upload/dp', async ({ headers, body }): Promise<SuccessMessage | Error> => {
    try {
      const authorizationHeader: string | null = headers.authorization;
      if (!authorizationHeader || !authorizationHeader.startsWith('Bearer ')) {
        throw new Error('Bearer token not found in Authorization header');
      }
      const jwtToken: string = authorizationHeader.substring(7);

      const driver: Driver = getDriver();
      const profileService: ProfileService = new ProfileService(driver);


      const output: SuccessMessage = await profileService.uploadProfilePic(body, jwtToken);

      return output as SuccessMessage
    } catch (error: any) {
      return error;
      }
    }, uploadDpBufferSchema
  )

  .post('/api/like/profilepic', async ({ headers, body }): Promise<SuccessMessage | ValidationError> => {
    try {
      const authorizationHeader: string | null = headers.authorization;
      if (!authorizationHeader || !authorizationHeader.startsWith('Bearer ')) {
        throw new Error('Bearer token not found in Authorization header');
      }
      const jwtToken: string = authorizationHeader.substring(7);

      const driver: Driver = getDriver();
      const profileService: ProfileService = new ProfileService(driver);


      const output: SuccessMessage | ValidationError = await profileService.likeProfilePicture(jwtToken, body);

      console.log(output)

      return output as SuccessMessage
    } catch (error: any) {
      return error;
      }
    }, likeProfilePicturePicSchema
  )

  .post('/api/unlike/profilepic', async ({ headers, body }): Promise<SuccessMessage | ValidationError > => {
    try {
      const authorizationHeader: string | null = headers.authorization;
      if (!authorizationHeader || !authorizationHeader.startsWith('Bearer ')) {
        throw new Error('Bearer token not found in Authorization header');
      }
      const jwtToken: string = authorizationHeader.substring(7);

      const driver: Driver = getDriver();
      const profileService: ProfileService = new ProfileService(driver);

      const output: SuccessMessage  | ValidationError = await profileService.unlikeProfilePicture(jwtToken, body);

      console.log(output)

      return output as SuccessMessage
    } catch (error: any) {
      return error;
      }
    }, likeProfilePicturePicSchema
  )

  .post('/api/profile/preference/save', async ({ headers, body }): Promise<SuccessMessage> => {
    try {
      const authorizationHeader: string | null = headers.authorization;
      if (!authorizationHeader || !authorizationHeader.startsWith('Bearer ')) {
        throw new Error('Bearer token not found in Authorization header');
      }
      const jwtToken: string = authorizationHeader.substring(7);
  
      const driver: Driver = getDriver();
      const profileService: ProfileService = new ProfileService(driver);
      const output: SuccessMessage = await profileService.createSoulPreferences(jwtToken, body);
  
      return output as SuccessMessage;
    } catch (error: any) {
      throw error
      }
    }, soulMetaDataSchema
  )

  .get('api/profile/preference/soul', async ({ headers }): Promise<SoulMetaData>=> {
    try{
      const authorizationHeader: string | null = headers.authorization;
      if (!authorizationHeader || !authorizationHeader.startsWith('Bearer ')) {
        throw new Error('Bearer token not found in Authorization header');
      }
      const jwtToken: string = authorizationHeader.substring(7);
  
      const driver: Driver = getDriver();
      const profileService: ProfileService = new ProfileService(driver);
      const output: SoulMetaData = await profileService.getSoul(jwtToken);

      return output
    } catch(error: any) {
      console.log(error)
      throw error
      }
    }, authorizationBearerSchema
  )

  .get('api/profile/card/count', async ({ headers }) => {
    try{
      const authorizationHeader: string | null = headers.authorization;
      if (!authorizationHeader || !authorizationHeader.startsWith('Bearer ')) {
        throw new Error('Bearer token not found in Authorization header');
      }
      const jwtToken: string = authorizationHeader.substring(7);
  
      const driver: Driver = getDriver();
      const profileService: ProfileService = new ProfileService(driver);
      const output: GroupCardCount = await profileService.getOwnedCardCount(jwtToken);

      return output
    } catch(error: any) {
      throw error
      }
    }, authorizationBearerSchema
  )

  .get('api/profile/card/collection', async ({ headers }): Promise<CardCollection[]> => {
    try{
      const authorizationHeader: string | null = headers.authorization;
      if (!authorizationHeader || !authorizationHeader.startsWith('Bearer ')) {
        throw new Error('Bearer token not found in Authorization header');
      }
      const jwtToken: string = authorizationHeader.substring(7);
  
      const driver: Driver = getDriver();
      const profileService: ProfileService = new ProfileService(driver);
      const output: CardCollection[] = await profileService.getCardCollection(jwtToken);

      return output as  CardCollection[] 
    } catch(error: any) {
      throw error
      }
    }, authorizationBearerSchema
  )
  
};

export default profile;
