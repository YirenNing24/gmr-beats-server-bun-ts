//** ELYSIA IMPORT
import Elysia from 'elysia';

//** MEMGRAPH IMPORT 
import { getDriver } from '../db/memgraph';
import { Driver } from 'neo4j-driver';

//** SERVICE IMPORT
import StoreService from '../game.services/store.services/store.service';

//** TYPE INTERFACES
import { SuccessMessage } from '../outputs/success.message';
import { buyCardSchema } from './route.schema/store.schema';
import { StoreCardData } from '../game.services/store.services/store.interface';

//** SCHEMA IMPORT
import { authorizationBearerSchema } from './route.schema/schema.auth';


const store = (app: Elysia) => {

  app.get('/api/store/cards/valid', async ({ headers }): Promise<StoreCardData[]> => {
      try {
        const authorizationHeader: string = headers.authorization;
        if (!authorizationHeader || !authorizationHeader.startsWith('Bearer ')) {
          throw new Error('Bearer token not found in Authorization header');
        }

        const jwtToken: string = authorizationHeader.substring(7);

        const driver: Driver = getDriver();
        const storeService: StoreService = new StoreService(driver);

        const output: StoreCardData[] = await storeService.getValidCards(jwtToken);

        return output as StoreCardData[] 
      } catch (error: any) {
        throw error
      }
    }, authorizationBearerSchema
  )
  .post('/api/store/cards/buy', async ({ headers, body }): Promise<SuccessMessage> => {
      try {
        const authorizationHeader: string = headers.authorization;
        if (!authorizationHeader || !authorizationHeader.startsWith('Bearer ')) {
          throw new Error('Bearer token not found in Authorization header');
        }
        const jwtToken: string = authorizationHeader.substring(7);

        const driver: Driver = getDriver();
        const storeService: StoreService = new StoreService(driver);
        
        const output: SuccessMessage = await storeService.buyCard(body, jwtToken)

        return output as SuccessMessage;
      } catch (error: any) {
        throw error

      }
    }, buyCardSchema
  )
//   .post('/api/store/bundles/get', async (context) => {
//     try {

//       const authorizationHeader = context.headers.authorization;
//       if (!authorizationHeader || !authorizationHeader.startsWith('Bearer ')) {
//         throw new Error('Bearer token not found in Authorization header');
//       }

//       const jwtToken: string = authorizationHeader.substring(7);
//       // Extract the "tokenId", and "username" from the request body
//       const { tokenId, cardName, username } = 
//       context.body as {tokenId: number, cardName: string, username: string}


//       // Create an instance of the StoreService to handle store-related operations
//       const driver = getDriver();
//       const storeService = new StoreService(driver);
      
//       // Call the "buyCard" method of the StoreService to perform the card purchase transaction
//       const output = await storeService.getBundles('bundles', jwtToken)

//       // Send the result of the card purchase transaction as the response
//       return(output);
//     } catch (error) {
//       // If an error occurs while processing the card purchase transaction,
//       // send an error response with status code 401 (Unauthorized) or an appropriate status code.
//       return(error);
//     }
//   }
// );



};

export default store;
