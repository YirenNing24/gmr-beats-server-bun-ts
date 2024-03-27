//** THIRDWEB IMPORTS
import { ThirdwebSDK } from "@thirdweb-dev/sdk";
import { LocalWalletNode } from "@thirdweb-dev/wallets/evm/wallets/local-wallet-node";
import { SmartWallet } from "@thirdweb-dev/wallets";

//** MEMGRAPH IMPORTS
import { CARD_MARKETPLACE } from "../../config/constants";
import { Driver, Session, ManagedTransaction, QueryResult } from "neo4j-driver-core";

//** CONFIG IMPORTs
import { CHAIN, SMART_WALLET_CONFIG } from "../../config/constants";

//** VALIDATION IMPORT
import ValidationError from "../../outputs/validation.error";

//** SERVICE IMPORTS
import TokenService from "../../user.services/token.service";
import { StoreCardData } from "./store.interface";


export default class StoreService {
  driver: Driver;

  constructor(driver: Driver) {
    this.driver = driver;
  }

  public async getListedCards(token: string): Promise<StoreCardData[]> {
    try {
      const tokenService: TokenService = new TokenService();
      await tokenService.verifyAccessToken(token);

      const session: Session = this.driver.session();
      const result: QueryResult = await session.executeRead((tx: ManagedTransaction) =>
          tx.run(` MATCH (c:Card) 
                   WHERE c.packed IS NULL AND c.lister IS NOT NULL
                   RETURN c`)
      );
      await session.close();

      const cards: StoreCardData[] = result.records.map(record => record.get("c").properties);

      return cards as StoreCardData[];
    } catch (error: any) {
      console.error("Error fetching items:", error);
      throw error
    }
  }

  async buyCard(tokenId: number, cardName: string, token: string): Promise<any> {
    try {

      const tokenService: TokenService = new TokenService();
      const username: string = await tokenService.verifyAccessToken(token);

      const session = this.driver.session();
      const res = await session.executeRead((tx) =>
        tx.run("MATCH (u:User {username: $username}) RETURN u", { username })
      );
      await session.close();

      if (res.records.length === 0) {
        throw new ValidationError(`User with username '${username}' not found.`, '');
      }

      const userData = res.records[0].get("u");
      const { localWallet, localWalletKey } = userData.properties;

      const walletLocal = new LocalWalletNode({ chain: CHAIN });
      await walletLocal.import({
        encryptedJson: localWallet,
        password: localWalletKey,
      });

      const smartWallet = new SmartWallet(SMART_WALLET_CONFIG);
      await smartWallet.connect({
        personalWallet: walletLocal,
      });

      const sdk = await ThirdwebSDK.fromWallet(smartWallet, CHAIN);
      const contract = await sdk.getContract(CARD_MARKETPLACE, "marketplace-v3");
      await contract.directListings.buyFromListing(tokenId, 1);

      return { success: "ok" };
    } catch (error) {
      return { error: error };
    }
  }

  // async getBundles(itemType: string, token: string): Promise<any[]> {
  //   try {

  //     const tokenService: TokenService = new TokenService();
  //     await tokenService.verifyAccessToken(token);

  //     if (itemType === "bundles") {
  //       const tx = await app.redis.get("bundleStore");
  //       if (tx === null) {
  //         return [];
  //       }
  //       //@ts-ignore
  //       return tx;
  //     }
  //     return [];
  //   } catch (error) {
  //     console.error("Error fetching items:", error);
  //     throw new Error("Failed to fetch items.");
  //   }
  // }
}
