//** ELYSIA AND JWT MODULE IMPORT
import Elysia from 'elysia'

//** MEMGRAPH DRIVER AND TYPES
import { Driver } from 'neo4j-driver';
import { getDriver } from '../db/memgraph';

//** INTERFACE IMPORT
import { InventoryCardData, UpdateInventoryData } from '../game.services/inventory.services/inventory.interface';

//** SERVICES IMPORTS
import InventoryService from '../game.services/inventory.services/inventory.service';

//** VALIDATION SCHEMA IMPORT
import { authorizationBearerSchema } from './route.schema/schema.auth';
import { updateInventorySchema } from '../game.services/inventory.services/inventory.schema';
import { SuccessMessage } from '../outputs/success.message';


const inventory = (app: Elysia): void => {
    app.get('/api/card/inventory/open', async ({ headers }): Promise<InventoryCardData> => {
        try {
            const authorizationHeader = headers.authorization;
            if (!authorizationHeader || !authorizationHeader.startsWith('Bearer ')) {
                throw new Error('Bearer token not found in Authorization header');
            }
            const jwtToken: string = authorizationHeader.substring(7);

            const driver: Driver = getDriver();
            const inventoryService: InventoryService = new InventoryService(driver);
            const output = await inventoryService.cardInventoryOpen(jwtToken)

            return output as InventoryCardData
            } catch (error: any) {
            return error
            }
        }, authorizationBearerSchema
    )
    
     .post('/api/card/inventory/update', async ({ headers, body }): Promise<SuccessMessage> => {
         try {
             const authorizationHeader: string = headers.authorization || "";
             if (!authorizationHeader || !authorizationHeader.startsWith('Bearer ')) {
                 throw new Error('Bearer token not found in Authorization header');
             }
             const jwtToken: string = authorizationHeader.substring(7);

             const driver: Driver = getDriver();
             const inventoryService: InventoryService = new InventoryService(driver);
             const output: SuccessMessage = await inventoryService.updateInventoryData(jwtToken, body)

             return output as SuccessMessage
         } catch (error: any) {
             return error
             }
         }, updateInventorySchema
     )

};

export default inventory;
