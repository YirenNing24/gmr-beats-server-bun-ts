//** MEMGRAPH DRIVER AND TYPES
import { Driver, ManagedTransaction, QueryResult, RecordShape, Session } from "neo4j-driver";

//** THIRDWEB IMPORTS
import { Pack, ThirdwebSDK } from "@thirdweb-dev/sdk";

//** THIRDWEB IMPORT * TYPES
import { LocalWalletNode } from "@thirdweb-dev/wallets/evm/wallets/local-wallet-node";
import { SmartWallet } from "@thirdweb-dev/wallets";

//** VALIDATION ERROR
import ValidationError from "../../outputs/validation.error";

//** IMPORTED SERVICES
import TokenService from "../../user.services/token.services/token.service";
import { PACK_ADDRESS, SECRET_KEY, CHAIN, SMART_WALLET_CONFIG } from "../../config/constants";


//** TYPE INTERFACES
import { BundleRewards, RedeemBundle } from "./gacha.interface";
import { UserData } from "../../user.services/user.service.interface";

//** CYPHER IMPORT
import { redeemBundle } from "./gacha.cypher";



class GachaService {
    driver?: Driver;
    constructor(driver?: Driver) {
        this.driver = driver;
    }

    public openCardPack() {
      try {
            


      } catch(error: any) {
        console.log(error);
        throw error;
      }
    }
    //Redeems a bundle for a user and returns the rewards obtaine


}

export default GachaService