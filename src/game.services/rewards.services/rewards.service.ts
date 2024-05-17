//** MEMGRAPH DRIVER AND TYPES
import { Driver, ManagedTransaction, QueryResult, RecordShape, Session } from "neo4j-driver";

//** ERROR CODES
import ValidationError from '../../outputs/validation.error'

//** IMPORTED SERVICES
import WalletService from "../../user.services/wallet.services/wallet.service";

//** TYPE INTERFACES
import { ClassicScoreStats } from "../leaderboard.services/leaderboard.interface";
import { UserData } from "../../user.services/user.service.interface";

//** THIRDWEB IMPORTS
import { ThirdwebSDK, Token } from "@thirdweb-dev/sdk";

//** CONFIGS
import { SECRET_KEY } from "../../config/constants";


//** SERVICE IMPORTS
import TokenService from "../../user.services/token.services/token.service";
import { CardMetaData } from "../inventory.services/inventory.interface";

class RewardService {

driver?: Driver;
constructor(driver?: Driver) {
    this.driver = driver;
}

public async firstCardType(uri: string, tokenId: string) {
  try {


  } catch(error: any) {
    throw error
  }
    
}


  

  
}



export default RewardService