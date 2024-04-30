

//** MEMGRAPH DRIVER
import { Driver, QueryResult, Session,  ManagedTransaction } from 'neo4j-driver-core'

//** IMPORTED SERVICES
import TokenService from "../../user.services/token.services/token.service";


class UpgradeService {
    driver: Driver
    constructor(driver: Driver) {
      this.driver = driver
      }


    public async upgradeCard() {

    }





}

export default UpgradeService