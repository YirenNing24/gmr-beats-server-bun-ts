//** ELYSIA AND JWT MODULE IMPORT
import Elysia from 'elysia'

//** MEMGRAPH DRIVER AND TYPES
import { Driver } from 'neo4j-driver';
import { getDriver } from '../db/memgraph';

//** INTERFACE IMPORT
import { InventoryCards } from '../game.services/inventory.services/inventory.interface';

//** SERVICES IMPORTS
import InventoryService from '../game.services/inventory.services/inventory.service';

//** VALIDATION SCHEMA IMPORT
import { authorizationBearerSchema } from './route.schema/schema.auth';
import { equipItemSchema  } from '../game.services/inventory.services/inventory.schema';
import { SuccessMessage } from '../outputs/success.message';


const inventory = (app: Elysia): void => {
    app.get('/api/card/inventory/open', async ({ headers }): Promise<InventoryCards> => {
        try {
            const authorizationHeader = headers.authorization;
            if (!authorizationHeader || !authorizationHeader.startsWith('Bearer ')) {
                throw new Error('Bearer token not found in Authorization header');
            }
            const jwtToken: string = authorizationHeader.substring(7);

            const driver: Driver = getDriver();
            const inventoryService: InventoryService = new InventoryService(driver);
            const output = await inventoryService.cardInventoryOpen(jwtToken)

            return output as InventoryCards
            } catch (error: any) {
            return error
            }
        }, authorizationBearerSchema
    )
    
     .post('/api/card/inventory/equip-item', async ({ headers, body }): Promise<SuccessMessage> => {
         try {
             const authorizationHeader: string = headers.authorization || "";
             if (!authorizationHeader || !authorizationHeader.startsWith('Bearer ')) {
                 throw new Error('Bearer token not found in Authorization header');
             }
             const jwtToken: string = authorizationHeader.substring(7);

             const driver: Driver = getDriver();
             const inventoryService: InventoryService = new InventoryService(driver);
             const output: SuccessMessage = await inventoryService.equipItem(jwtToken, body)

             return output as SuccessMessage
         } catch (error: any) {
             return error
             }
         }, equipItemSchema
        )

        .post('/api/card/inventory/unequip-item', async ({ headers, body }): Promise<SuccessMessage> => {
            try {
                const authorizationHeader: string = headers.authorization || "";
                if (!authorizationHeader || !authorizationHeader.startsWith('Bearer ')) {
                    throw new Error('Bearer token not found in Authorization header');
                }
                const jwtToken: string = authorizationHeader.substring(7);
   
                const driver: Driver = getDriver();
                const inventoryService: InventoryService = new InventoryService(driver);
                const output: SuccessMessage = await inventoryService.unequipItem(jwtToken, body)
   
                return output as SuccessMessage
            } catch (error: any) {
                return error
                }
            }, equipItemSchema
           )
         

};

export default inventory;
