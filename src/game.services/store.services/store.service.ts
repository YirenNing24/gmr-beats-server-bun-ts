//** THIRDWEB IMPORTS
import { MarketplaceV3, ThirdwebSDK } from "@thirdweb-dev/sdk";
import { LocalWalletNode } from "@thirdweb-dev/wallets/evm/wallets/local-wallet-node";
import { SmartWallet } from "@thirdweb-dev/wallets";

//** MEMGRAPH IMPORTS
import { CARD_MARKETPLACE, CARD_UPGRADE_MARKETPLACE } from "../../config/constants";
import { Driver, Session, ManagedTransaction, QueryResult, RecordShape } from "neo4j-driver-core";

//** CONFIG IMPORTs
import { CHAIN, SMART_WALLET_CONFIG } from "../../config/constants";

//** VALIDATION IMPORT
import ValidationError from "../../outputs/validation.error";

//** SERVICE IMPORTS
import TokenService from "../../user.services/token.services/token.service";
import { BuyCardData, StoreCardData, StoreCardUpgradeData } from "./store.interface";
import { UserData } from "../../user.services/user.service.interface";

//** CYPHER IMPORTS
import { buyCardCypher, buyCardUpgradeCypher, getValidCardUpgrades, getValidCards } from "./store.cypher";

//** SUCCESS MESSAGE IMPORT
import { SuccessMessage } from "../../outputs/success.message";


export default class StoreService {
  driver: Driver;
  constructor(driver: Driver) {
    this.driver = driver;
  }

  //Retrieves valid cards from the using the provided access token.
  public async getValidCards(token: string): Promise<StoreCardData[]> {
    try {
        const tokenService: TokenService = new TokenService();
        await tokenService.verifyAccessToken(token);

        const session: Session = this.driver.session();
        const result: QueryResult = await session.executeRead((tx: ManagedTransaction) =>
            tx.run(getValidCards)
        );
        await session.close();

        const cards: StoreCardData[] = result.records.map(record => {
            const cardProperties: any = record.get("c").properties;
            const { imageByte, ...cardData } = cardProperties;
            return cardData as StoreCardData
        });

        return cards as StoreCardData[];
    } catch (error: any) {
        console.error("Error fetching items:", error);
        throw error
    }
  }

  //Buys a card using the provided card data and access token.
  public async buyCard(buycardData: BuyCardData, token: string): Promise<SuccessMessage> {
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
      const inventorySize: number = userData.properties.inventorySize.toNumber()
      const inventoryCurrentSize: number = result.records[0].get("inventoryCurrentSize").toNumber()

      // Create relationship using a separate Cypher query
      await this.createRelationship(username, uri, inventoryCurrentSize, inventorySize );

      return new SuccessMessage("Purchase was successful");
    } catch (error: any) {
      throw error
    }
  }

  //Initiates a card purchase using the provided wallet information and listing ID.
  private async cardPurchase(localWallet: string, localWalletKey: string, listingId: number): Promise<void | Error> {
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
      const contract: MarketplaceV3 = await sdk.getContract(CARD_MARKETPLACE, "marketplace-v3");
      await contract.directListings.buyFromListing(listingId, 1);
  
    } catch(error: any) {
      console.log(error)
      return error
        }
  }
  
  //Creates a relationship between a user and a card based on provided parameters.
  private async createRelationship(username: string, uri: string, inventoryCurrentSize: number, inventorySize: number): Promise<void> {
    try {
      // Determine the relationship type based on bag and inventory size
      let relationship: string[];
      if (inventorySize < inventoryCurrentSize + 1) {
        relationship = ["BAGGED", "OWNED"];
      } else {
        relationship = ["INVENTORY", "OWNED"];
      }
      const session: Session = this.driver.session();
      // Loop through each relationship type
      for (const rel of relationship) {
        await session.run(`
          MATCH (u:User {username: $username}), (c:Card {uri: $uri})
          MATCH (c)-[l:LISTED]->(cs:CardStore)
          DELETE l
          CREATE (u)-[:${rel}]->(c)
          CREATE (u)-[:SOLD]->(cs)`,
        { username, uri, rel });    
      }
      await session.close();
    } catch (error: any) {
      console.error("Error creating relationship:", error);
      throw error;
    }
  }

  public async getvalidCardUpgrade(token: string): Promise<StoreCardUpgradeData[]> {
    try {
      const tokenService: TokenService = new TokenService();
      await tokenService.verifyAccessToken(token);

      const session: Session = this.driver.session();
      const result: QueryResult = await session.executeRead((tx: ManagedTransaction) =>
          tx.run(getValidCardUpgrades)
      );
      await session.close();

      const cardUpgrade: StoreCardUpgradeData[] = result.records.map(record => record.get("c").properties);

      return cardUpgrade as StoreCardUpgradeData[];
    } catch (error: any) {
        console.error("Error fetching items:", error);
        throw error
    }
  }

  public async buyCardUpgrade(buyCardUpgradeData: any, token: string) {
    try {
      const tokenService: TokenService = new TokenService();
      const username: string = await tokenService.verifyAccessToken(token);

      const { listingId, uri } = buyCardUpgradeData as BuyCardData

      const session: Session = this.driver.session();
      const result: QueryResult<RecordShape> = await session.executeRead((tx: ManagedTransaction) =>
        tx.run(buyCardUpgradeCypher, { username }) 
      );
      await session.close();

      if (result.records.length === 0) {
        throw new ValidationError(`User with username '${username}' not found.`, '');
      }
      const userData: UserData = result.records[0].get("u");
      const { localWallet, localWalletKey } = userData.properties;

      await this.cardUpgradePurchase(localWallet, localWalletKey, listingId);

      return new SuccessMessage("Purchase was successful");
    } catch(error: any) {
      
    }

  }

  private async cardUpgradePurchase(localWallet: string, localWalletKey: string, listingId: number, quantity: string): Promise<void | Error> {
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
    const contract: MarketplaceV3 = await sdk.getContract(CARD_UPGRADE_MARKETPLACE, "marketplace-v3");
    await contract.directListings.buyFromListing(listingId, 1, quantity);

  } catch(error: any) {
    console.log(error)
    return error
      }
}
  
}


