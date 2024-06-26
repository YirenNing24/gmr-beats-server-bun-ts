//** THIRDWEB IMPORTS
import { Edition, MarketplaceV3, ThirdwebSDK } from "@thirdweb-dev/sdk";
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
import { BuyCardData, BuyCardUpgradeData, StoreCardData, StoreCardUpgradeData } from "./store.interface";
import { UserData } from "../../user.services/user.service.interface";

//** CYPHER IMPORTS
import { buyCardCypher, buyCardUpgradeCypher, getValidCardUpgrades, getValidCards } from "./store.cypher";

//** SUCCESS MESSAGE IMPORT
import { SuccessMessage } from "../../outputs/success.message";
import RewardService from "../rewards.services/rewards.service";


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
      await this.createCardRelationship(username, uri, inventoryCurrentSize, inventorySize );

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
  private async createCardRelationship(username: string, uri: string, inventoryCurrentSize: number, inventorySize: number): Promise<void> {
    try {

      const rewardService: RewardService = new RewardService()
      // Determine the relationship type based on bag and inventory size
      let relationship: string[];
      if (inventorySize < inventoryCurrentSize + 1) {
        relationship = ["BAGGED"];
      } else {
        relationship = ["INVENTORY"];
      }
      
      // Get the card's name
      const session: Session = this.driver.session();
      const cardNameResult = await session.run(`
        MATCH (c:Card {uri: $uri})
        RETURN c.Name AS name
      `, { uri });
      const cardName = cardNameResult.records[0].get("name");
  
      // Check for uniqueness of the card's name among BAGGED or INVENTORY relationships
      const uniquenessCheck = await session.run(`
        MATCH (u:User {username: $username})-[:BAGGED|INVENTORY]->(c:Card)
        WHERE c.Name = $cardName
        RETURN COUNT(c) AS count, c.id as id
      `, { username, cardName });
      const count: number = uniquenessCheck.records[0].get("count").toInt();
      const id: string = uniquenessCheck.records[0].get("id");
  
      // If the card's name is unique, call the firstCardType function
      if (count === 0) {
        await rewardService.firstCardType(uri, id)
      }
  
      // Loop through each relationship type
      for (const rel of relationship) {
        await session.run(`
          MATCH (u:User {username: $username}), (c:Card {uri: $uri})
          MATCH (c)-[l:LISTED]->(cs:CardStore)
          DELETE l
          CREATE (u)-[:${rel}]->(c)
          CREATE (c)-[:SOLD]->(cs)
        `, { username, uri });
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

  public async buyCardUpgrade(buyCardUpgradeData: BuyCardUpgradeData, token: string): Promise<SuccessMessage> {
    try {
      const tokenService: TokenService = new TokenService();
      const username: string = await tokenService.verifyAccessToken(token);
  
      const { listingId, quantity } = buyCardUpgradeData as BuyCardUpgradeData;
  
      const session: Session = this.driver.session();
      const result: QueryResult<RecordShape> = await session.executeRead((tx: ManagedTransaction) =>
        tx.run(buyCardUpgradeCypher, { username })
      );

  
      if (result.records.length === 0) {
        throw new ValidationError(`User with username '${username}' not found.`, '');
      }
      const userData: UserData = result.records[0].get("u");
      const { localWallet, localWalletKey } = userData.properties;
      
      await this.cardUpgradePurchase(localWallet, localWalletKey, listingId, quantity);
      await this.createCardUpgradeRelationship(username, listingId);
      
      return new SuccessMessage("Card Upgrade purchase successful")
    } catch(error: any) {
      return error;
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
    await contract.directListings.buyFromListing(listingId, quantity);

  } catch(error: any) {
    console.log(error)
    return error
      }
  }

  private async createCardUpgradeRelationship(username: string, listingId: number): Promise<void> {
  try {
    const session: Session = this.driver.session();

    await session.executeWrite((tx: ManagedTransaction) =>
      tx.run(`
        MATCH (u:User {username: "nashar4"}), (c:CardUpgrade {listingId: listingId}), (cu:CardUpgradeStore)
        MATCH (c)-[l:LISTED]->(cu)
        DELETE l
        CREATE (u)-[:OWNED]->(c)
        CREATE (c)-[:SOLD]->(cu)
      `, { username, listingId }) 
    );

    
  } catch (error: any) {
    console.error("Error creating relationship:", error);
    throw error;
  }
  }
  
}