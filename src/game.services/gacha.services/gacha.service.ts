//** MEMGRAPH DRIVER AND TYPES
import { Driver, ManagedTransaction, QueryResult, RecordShape, Session } from "neo4j-driver";


//** RETHINK DB
import rt from "rethinkdb";
import { getRethinkDB } from "../../db/rethink";

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
import { BundleRewards, PackData, RedeemBundle } from "./gacha.interface";
import { UserData } from "../../user.services/user.service.interface";

//** CYPHER IMPORT
import { openCardpackCypher, redeemBundle } from "./gacha.cypher";
import { BuyCardData } from "../store.services/store.interface";



class GachaService {
    driver: Driver;
    constructor(driver: Driver) {
      this.driver = driver;
    }

    public async openCardPack(token: string, cardPackData: PackData) {
      try {
          const tokenService: TokenService = new TokenService();
          const username: string = await tokenService.verifyAccessToken(token);
  
          const { name: cardPackName } = cardPackData; // Renamed to avoid conflict
        
          const session: Session = this.driver.session();
          const result: QueryResult<RecordShape> = await session.executeRead((tx: ManagedTransaction) =>
              tx.run(openCardpackCypher, { username, name: cardPackName }) // Using the renamed variable
          );
  
          if (!result || result.records.length === 0) {
              throw new ValidationError(`no data found`, "");
          }
  
          const pack: PackData = result.records[0].get("pack");

          const connection: rt.Connection = await getRethinkDB();
          const query: rt.Cursor = await rt.db('admin')
            .table('cardPacks')
            .filter({ packName: pack.name })
            .run(connection);
  
          // Use `pack.name` or `cardPackName` as needed
  
      } catch (error: any) {
          console.log(error);
          throw error;
      }
  }

    //Redeems a bundle for a user and returns the rewards obtaine


}

export default GachaService