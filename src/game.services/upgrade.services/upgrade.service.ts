

//** MEMGRAPH DRIVER
import { Driver, QueryResult, Session,  ManagedTransaction, RecordShape } from 'neo4j-driver-core'

//** IMPORTED SERVICES
import TokenService from "../../user.services/token.services/token.service";

//** TYPE INTERFACES
import { UpgradeCardData } from './upgrade.interface';
import { SuccessMessage } from '../../outputs/success.message';
import { upgradeCardDataCypher } from './upgrade.cypher';


class UpgradeService {
    driver: Driver
    constructor(driver: Driver) {
      this.driver = driver
      }


    public async upgradeCard(token: string, upgradeCardData: UpgradeCardData) {
        try {
            const tokenService: TokenService = new TokenService();
            const userName: string = await tokenService.verifyAccessToken(token);

            const { uri } = upgradeCardData
            const session: Session | undefined = this.driver?.session();
            // Use a Read Transaction and only return the necessary properties
            const result: QueryResult<RecordShape> | undefined = await session?.executeRead(
              (tx: ManagedTransaction) =>
                tx.run(upgradeCardDataCypher, { userName, uri }
                )
            );

            
            
        } catch(error: any) {

        }

    }





}

export default UpgradeService