import Elysia from 'elysia';
import { getDriver } from '../db/memgraph';
import StoreService from '../game.services/store.service';



const router = (app: Elysia) => {

  app.get('/api/store/cards/get', async (context) => {
      try {
        // Extract the "itemType" from the request query parameters
        const { itemType } = context.query as { itemType: string }

        // Create an instance of the StoreService to handle store-related operations
        //@ts-ignore
        const storeService = new StoreService();

        // Call the "getCards" method of the StoreService to fetch store items based on itemType
        const output = await storeService.getCards(itemType);

        // Send the fetched store items as the response
        return(output);
      } catch (error) {
        // If an error occurs while fetching store items, send an error response with status code 401 (Unauthorized)
        return([]);
      }
    }
  );


  app.post('/api/store/cards/buy', async (context) => {
      try {
        // Extract the "tokenId", and "username" from the request body
        const { tokenId, cardName, username } = context.body as { tokenId: number, cardName: string, username: string }


        // Create an instance of the StoreService to handle store-related operations
        const driver = getDriver();
        const storeService = new StoreService(driver);
        
        // Call the "buyCard" method of the StoreService to perform the card purchase transaction
        const output = await storeService.buyCard(tokenId, cardName, username)

        // Send the result of the card purchase transaction as the response
        return(output);
      } catch (error) {
        // If an error occurs while processing the card purchase transaction,
        // send an error response with status code 401 (Unauthorized) or an appropriate status code.
        return(error);
      }
    }
  );


  app.post('/api/store/bundles/get', async (context) => {
    try {
      // Extract the "tokenId", and "username" from the request body
      const { tokenId, cardName, username } = 
      context.body as {tokenId: number, cardName: string, username: string}


      // Create an instance of the StoreService to handle store-related operations
      const driver = getDriver();
      const storeService = new StoreService(driver);
      
      // Call the "buyCard" method of the StoreService to perform the card purchase transaction
      const output = await storeService.buyCard(tokenId, cardName, username)

      // Send the result of the card purchase transaction as the response
      return(output);
    } catch (error) {
      // If an error occurs while processing the card purchase transaction,
      // send an error response with status code 401 (Unauthorized) or an appropriate status code.
      return(error);
    }
  }
);



};

export default router;
