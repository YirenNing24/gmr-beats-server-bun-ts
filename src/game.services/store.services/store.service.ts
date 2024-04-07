//** THIRDWEB IMPORTS
import { Marketplace, ThirdwebSDK } from "@thirdweb-dev/sdk";
import { LocalWalletNode } from "@thirdweb-dev/wallets/evm/wallets/local-wallet-node";
import { SmartWallet } from "@thirdweb-dev/wallets";

//** MEMGRAPH IMPORTS
import { CARD_MARKETPLACE } from "../../config/constants";
import { Driver, Session, ManagedTransaction, QueryResult, RecordShape } from "neo4j-driver-core";

//** CONFIG IMPORTs
import { CHAIN, SMART_WALLET_CONFIG } from "../../config/constants";

//** VALIDATION IMPORT
import ValidationError from "../../outputs/validation.error";

//** SERVICE IMPORTS
import TokenService from "../../user.services/token.service";
import { BuyCardData, StoreCardData } from "./store.interface";
import { UserData } from "../../user.services/user.service.interface";
import { buyCardCypher, getValidCards } from "./store.cypher";
import { SuccessMessage } from "../../outputs/success.message";


export default class StoreService {
  driver: Driver;

  constructor(driver: Driver) {
    this.driver = driver;
  }

/**
 * Retrieves valid cards from the using the provided access token.
 * @param token The access token used for authentication.
 * @returns A promise resolving to an array of valid card data.
 */
  public async getValidCards(token: string): Promise<StoreCardData[]> {
    try {
      const tokenService: TokenService = new TokenService();
      await tokenService.verifyAccessToken(token);

      const session: Session = this.driver.session();
      const result: QueryResult = await session.executeRead((tx: ManagedTransaction) =>
          tx.run(getValidCards)
      );
      await session.close();

      const cards: StoreCardData[] = result.records.map(record => record.get("c").properties);

      return cards as StoreCardData[];
    } catch (error: any) {
      console.error("Error fetching items:", error);
      throw error
    }
  }
/**
 * Buys a card using the provided card data and access token.
 * @param buycardData The data of the card to be purchased.
 * @param token The access token used for authentication.
 * @returns A promise resolving to the result of the purchase operation.
 */
  public async buyCard(buycardData: BuyCardData, token: string): Promise<any> {
    try {
      const tokenService: TokenService = new TokenService();
      const username: string = await tokenService.verifyAccessToken(token);

      const { listingId, uri } = buycardData as BuyCardData

      const session: Session = this.driver.session();
      const result: QueryResult<RecordShape> = await session.executeRead((tx: ManagedTransaction) =>
        tx.run(buyCardCypher, { username }) 
      );
      await session.close();

      if (result.records.length === 0) {
        throw new ValidationError(`User with username '${username}' not found.`, '');
      }
      const userData: UserData = result.records[0].get("u");
      const { localWallet, localWalletKey } = userData.properties;

      await this.cardPurchase(localWallet, localWalletKey, listingId)

      // Decide the relationship type based on inventory and bag size
      const inventorySize: number = userData.properties.inventorySize
      const bagSize: number = result.records[0].get("sizeBaggedCards");

      // Create relationship using a separate Cypher query
      await this.createRelationship(username, uri, bagSize, inventorySize );

      return new SuccessMessage("Purchase was successfull");
    } catch (error: any) {
      throw error
    }
  }

/**
 * Creates a relationship between a user and a card based on provided parameters.
 * @param username The username of the user.
 * @param uri The URI of the card.
 * @param bagSize The size of the user's bagged cards.
 * @param inventorySize The size of the user's card inventory.
 * @returns A promise resolving to void when the relationship is successfully created.
 */
  private async createRelationship(username: string, uri: string, bagSize: number, inventorySize: number): Promise<void> {
    try {
      // Determine the relationship type based on bag and inventory size
      let relationship: string[];
      if (bagSize + 1 <= inventorySize) {
        relationship = ["BAGGED, OWNS"];
      } else {
        relationship = ["OWNS"];
      }
      const session: Session = this.driver.session();
      // Loop through each relationship type
      for (const rel of relationship) {
        await session.run(`
          MATCH (u:User {username: $username}), (c:Card {uri: $uri})
          CREATE (u)-[:${rel}]->(c)`,
          { username, uri });
      }
      await session.close();
    } catch (error: any) {
      throw error;
    }
  }
  
/**
 * Initiates a card purchase using the provided wallet information and listing ID.
 * @param localWallet The encrypted JSON string representing the local wallet.
 * @param localWalletKey The password/key to decrypt the local wallet.
 * @param listingId The ID of the listing from which the card is being purchased.
 * @returns A promise resolving to void when the purchase is successfully initiated.
 */
    private async cardPurchase(localWallet: string, localWalletKey: string, listingId: number): Promise<void> {
    try {
    const walletLocal: LocalWalletNode = new LocalWalletNode({ chain: CHAIN });
    await walletLocal.import({
      encryptedJson: localWallet,
      password: localWalletKey,
    });
    const smartWallet: SmartWallet = new SmartWallet(SMART_WALLET_CONFIG);
    await smartWallet.connect({
      personalWallet: walletLocal,
    });

    const sdk: ThirdwebSDK = await ThirdwebSDK.fromWallet(smartWallet, CHAIN);
    const contract = await sdk.getContract(CARD_MARKETPLACE, "marketplace-v3");
    await contract.directListings.buyFromListing(listingId, 1);
  } catch(error: any) {
    throw error
      }
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

