

//** MEMGRAPH DRIVER
import { Driver, QueryResult, Session,  ManagedTransaction, RecordShape } from 'neo4j-driver-core'

//** IMPORTED SERVICES
import TokenService from "../../user.services/token.services/token.service";

//** TYPE INTERFACES
import { UpgradeCardData } from './upgrade.interface';
import { SuccessMessage } from '../../outputs/success.message';
import { upgradeCardDataCypher } from './upgrade.cypher';
import { CardMetaData } from '../inventory.services/inventory.interface';
import ValidationError from '../../outputs/validation.error';


class UpgradeService {
    driver: Driver
    constructor(driver: Driver) {
      this.driver = driver
      }


    public async upgradeCard(token: string, upgradeCardData: UpgradeCardData) {
        try {
            const tokenService: TokenService = new TokenService();
            const userName: string = await tokenService.verifyAccessToken(token);

            const { uri } = upgradeCardData as UpgradeCardData
            const session: Session | undefined = this.driver?.session();
            // Use a Read Transaction and only return the necessary properties
            const result: QueryResult<RecordShape> | undefined = await session?.executeRead(
              (tx: ManagedTransaction) =>
                tx.run(upgradeCardDataCypher, { userName, uri }
                )
            );

            await session?.close();
  
            // If no records found, return validation error
            if (!result || result.records.length === 0) {
                throw new ValidationError(`Not found.`, "not found");
            }
    
            // Extract the card data
            const cardData: CardMetaData = result.records[0].get("c");


            
        return new SuccessMessage("Upgrade success")
        } catch(error: any) {


        }

    }





}

export default UpgradeService