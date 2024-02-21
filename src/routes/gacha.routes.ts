//** ELYSIA AND JWT MODULE IMPORT
import Elysia from 'elysia'
import jwt from 'jsonwebtoken'

//** CONFIG IMPORT
import { JWT_SECRET } from '../config/constants';

//** MEMGRAPH DRIVER AND TYPES
import { Driver } from 'neo4j-driver';
import { getDriver } from '../db/memgraph';

//** SERVICE
import GachaService from '../game.services/gacha.service';
import { BundleRewards } from '../game.services/game.services.interfaces';



const gacha = (app: Elysia): void => {
    app.post('/api/gacha/bundle/redeem', async (context): Promise<BundleRewards> => {
        try {
            const authorizationHeader = context.headers.authorization;
            if (!authorizationHeader || !authorizationHeader.startsWith('Bearer ')) {
              throw new Error('Bearer token not found in Authorization header');
            }
            const jwtToken: string = authorizationHeader.substring(7);

            
            const { bundleId, amount } = context.body as { bundleId: number, amount: number }

            const driver: Driver = getDriver();
            const gachaService: GachaService = new GachaService(driver)
            const output: BundleRewards = await gachaService.redeemBundle(bundleId, amount, jwtToken)

            return output
        } catch (error: any) {
            throw error
        }
    });

};

export default gacha;