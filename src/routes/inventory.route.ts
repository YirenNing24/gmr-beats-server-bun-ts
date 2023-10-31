import Elysia from 'elysia';
import { getDriver } from '../db/memgraph';
import InventoryService from '../game.services/inventory.service';
import { Driver } from 'neo4j-driver';
import jwt from 'jsonwebtoken'
import { NFT } from '@thirdweb-dev/sdk';


const inventory = (app: Elysia) => {
    app.get('/api/cards', async (context) => {
        try {
            const authorizationHeader = context.headers.authorization;
            if (!authorizationHeader || !authorizationHeader.startsWith('Bearer ')) {
                throw new Error('Bearer token not found in Authorization header');
            }
            const jwtToken: string = authorizationHeader.substring(7);
            const driver: Driver = getDriver();
            const inventoryService: InventoryService = new InventoryService(driver);
            const decodedToken = jwt.decode(jwtToken)  
            const { username } = decodedToken as { username: string };
            
            const output: NFT[] = await inventoryService.getCards(username)
            return output
            } catch (error) {
            console.log(error)
            return error
            }
        }
    );  

};

export default inventory;
