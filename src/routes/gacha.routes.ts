//** ELYSIA AND JWT MODULE IMPORT
import Elysia from 'elysia'


//** MEMGRAPH DRIVER AND TYPES
import { Driver } from 'neo4j-driver';
import { getDriver } from '../db/memgraph';

//** SERVICE IMPORT
import GachaService from '../game.services/gacha.services/gacha.service';

//**  TYPE INTERFACE IMPORT
import { BundleRewards } from '../game.services/gacha.services/gacha.interface';
import { redeemBundleSchema } from '../game.services/gacha.services/gacha.schema';



const gacha = (app: Elysia): void => {
    app.post('/api/gacha/bundle/redeem', async ({ headers, body }): Promise<BundleRewards> => {
        try {
            const authorizationHeader: string = headers.authorization;
            if (!authorizationHeader || !authorizationHeader.startsWith('Bearer ')) {
              throw new Error('Bearer token not found in Authorization header');
            }
            const jwtToken: string = authorizationHeader.substring(7);

            const driver: Driver = getDriver();
            const gachaService: GachaService = new GachaService(driver);

            const output: BundleRewards = await gachaService.redeemBundle(body, jwtToken);
            return output as BundleRewards
        } catch (error: any) {
            throw error
        } 
     }, redeemBundleSchema
    
    );

};

export default gacha;