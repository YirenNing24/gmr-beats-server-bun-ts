import Elysia from 'elysia';
import { getDriver } from '../db/memgraph';
import InventoryService from '../game.services/inventory.service';
import { Driver } from 'neo4j-driver';
import jwt from 'jsonwebtoken'
import { NFT } from '@thirdweb-dev/sdk';
import { InventoryCardData } from '../game.services/game.services.interfaces';


const inventory = (app: Elysia) => {
    app.get('/api/card/inventory/open', async (context) => {
        try {
            const authorizationHeader = context.headers.authorization;
            if (!authorizationHeader || !authorizationHeader.startsWith('Bearer ')) {
                throw new Error('Bearer token not found in Authorization header');
            }
            const jwtToken: string = authorizationHeader.substring(7);
            const decodedToken = jwt.decode(jwtToken)  
            const { userName } = decodedToken as { userName: string };

            const driver: Driver = getDriver();
            const inventoryService: InventoryService = new InventoryService(driver);
            
            return await inventoryService.cardInventoryOpen(userName) as InventoryCardData
            } catch (error: any) {
            console.log(error)
            return error
            }
        }
    )
    
    .post('/api/card/inventory/update', async (context) => {
        try {
            const authorizationHeader: string = context.headers.authorization || "";
            if (!authorizationHeader || !authorizationHeader.startsWith('Bearer ')) {
                throw new Error('Bearer token not found in Authorization header');
            }
            const jwtToken: string = authorizationHeader.substring(7);
            const decodedToken = jwt.decode(jwtToken)
            const { userName } = decodedToken as { userName: string };
            
            const driver: Driver = getDriver();
            const inventoryService: InventoryService = new InventoryService(driver);

            const inventoryCardData: InventoryCardData = context.body as InventoryCardData
            return await inventoryService.updateInventoryData(userName, inventoryCardData)
        } catch (error: any) {
            console.log(error)
            return error
        }
    })

};

export default inventory;
