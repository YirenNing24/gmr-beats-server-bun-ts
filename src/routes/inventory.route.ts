//** ELYSIA AND JWT MODULE IMPORT
import Elysia from 'elysia'

//** MEMGRAPH DRIVER AND TYPES
import { Driver } from 'neo4j-driver';
import { getDriver } from '../db/memgraph';

//** INTERFACE IMPORT
import { InventoryCardData } from '../game.services/game.services.interfaces';

//** SERVICES IMPORTS
import InventoryService from '../game.services/inventory.service';

//** VALIDATION SCHEMA IMPORT
import { authorizationBearerSchema } from './route.schema/schema.auth';
import { inventoryCardDataSchema } from './route.schema/schema.inventory';


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
            const output: InventoryCardData = await inventoryService.cardInventoryOpen(jwtToken)
            
            return output as InventoryCardData
            } catch (error: any) {
            return error
            }
        }, authorizationBearerSchema
    )
    
    .post('/api/card/inventory/update', async ({ headers, body }) => {
        try {
            const authorizationHeader: string = headers.authorization || "";
            if (!authorizationHeader || !authorizationHeader.startsWith('Bearer ')) {
                throw new Error('Bearer token not found in Authorization header');
            }
            const jwtToken: string = authorizationHeader.substring(7);

            const driver: Driver = getDriver();
            const inventoryService: InventoryService = new InventoryService(driver);

            const inventoryCardData = body as InventoryCardData
            const output = await inventoryService.updateInventoryData(jwtToken, inventoryCardData)

            return output
        } catch (error: any) {
            console.log(error)
            return error
            }
        }, inventoryCardDataSchema
    )

};

export default inventory;
