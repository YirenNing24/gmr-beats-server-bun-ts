//** THIRDWEB IMPORTS
import { Edition, MarketplaceV3, ThirdwebSDK } from "@thirdweb-dev/sdk";
import { LocalWalletNode } from "@thirdweb-dev/wallets/evm/wallets/local-wallet-node";
import { SmartWallet } from "@thirdweb-dev/wallets";

import { ContractOptions, createThirdwebClient, getContract } from "thirdweb";
import { defineChain } from "thirdweb/chains";

//** MEMGRAPH IMPORTS
import { CARD_MARKETPLACE, CARD_UPGRADE_MARKETPLACE, PACK_MARKETPLACE, SECRET_KEY } from "../../config/constants";
import { Driver, Session, ManagedTransaction, QueryResult, RecordShape } from "neo4j-driver-core";

//** CONFIG IMPORTs
import { CHAIN, SMART_WALLET_CONFIG } from "../../config/constants";

//** VALIDATION IMPORT
import ValidationError from "../../outputs/validation.error";

//** SERVICE IMPORTS
import TokenService from "../../user.services/token.services/token.service";
import { BuyCardData, BuyCardUpgradeData, StoreCardData, StoreCardUpgradeData, StorePackData } from "./store.interface";
import { UserData } from "../../user.services/user.service.interface";

//** CYPHER IMPORTS
import { buyCardCypher, buyCardUpgradeCypher, getValidCardPacks, getValidCardUpgrades, getValidCards } from "./store.cypher";

//** SUCCESS MESSAGE IMPORT
import { SuccessMessage } from "../../outputs/success.message";
import { engine } from "../../user.services/wallet.services/wallet.service";



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

        const currentDate = new Date();
        const cards: StoreCardData[] = result.records
            .map(record => record.get("c").properties)
            .filter(card => {
                const [month, day, year] = card.endTime.split('/');
                const endTime = new Date(`20${year}-${month}-${day}`);
                return endTime >= currentDate;
            });

        return cards as StoreCardData[];
    } catch (error: any) {
        console.error("Error fetching items:", error);
        throw error
    }
  }


  public async getValidCardPacks(token: string): Promise<StorePackData[]> {
    try {
        const tokenService: TokenService = new TokenService();
        await tokenService.verifyAccessToken(token);

        const session: Session = this.driver.session();
        const result: QueryResult = await session.executeRead((tx: ManagedTransaction) =>
            tx.run(getValidCardPacks)
        );
        await session.close();

        const currentDate = new Date();
        const packs: StorePackData[] = result.records
            .map(record => record.get("c").properties)
            .filter(card => {
                const [month, day, year] = card.endTime.split('/');
                const endTime = new Date(`20${year}-${month}-${day}`);
                return endTime >= currentDate;
            });

        return packs as StorePackData[];
    } catch (error: any) {
        console.error("Error fetching items:", error);
        throw error
    }
  }


  //Buys a card using the provided card data and access token.
  // public async buyCard(buycardData: BuyCardData, token: string): Promise<SuccessMessage> {
  //   try {
  //     const tokenService: TokenService = new TokenService();
  //     const username: string = await tokenService.verifyAccessToken(token);

  //     const { listingId, uri } = buycardData as BuyCardData

  //     const session: Session = this.driver.session();
  //     const result: QueryResult<RecordShape> = await session.executeRead((tx: ManagedTransaction) =>
  //       tx.run(buyCardCypher, { username }) 
  //     );
  //     await session.close();
  //     if (result.records.length === 0) {
  //       throw new ValidationError(`User with username '${username}' not found.`, '');
  //     }
  //     const userData: UserData = result.records[0].get("u");
  //     const { localWallet, localWalletKey } = userData.properties;

  //     await this.cardPurchase(localWallet, localWalletKey, listingId)

  //     // Decide the relationship type based on inventory and bag size
  //     const inventorySize: number = userData.properties.inventorySize.toNumber()
  //     const inventoryCurrentSize: number = result.records[0].get("inventoryCurrentSize").toNumber()

  //     // Create relationship using a separate Cypher query
  //     await this.createCardRelationship(username, uri, inventoryCurrentSize, inventorySize );

  //     return new SuccessMessage("Purchase was successful");
  //   } catch (error: any) {
  //     throw error
  //   }
  // }

    //Initiates a card purchase using the provided wallet information and listing ID.
  // private async cardPurchase(localWallet: string, localWalletKey: string, listingId: number): Promise<void | Error> {
  //     try {
  //     const walletLocal: LocalWalletNode = new LocalWalletNode({ chain: CHAIN });
  //     await walletLocal.import({
  //       encryptedJson: localWallet,
  //       password: localWalletKey,
  //     });
  //     const smartWallet: SmartWallet = new SmartWallet(SMART_WALLET_CONFIG);
  //     await smartWallet.connect({
  //       personalWallet: walletLocal,
  //     });
  
  //     const sdk: ThirdwebSDK = await ThirdwebSDK.fromWallet(smartWallet, CHAIN);
  //     const contract: MarketplaceV3 = await sdk.getContract(CARD_MARKETPLACE, "marketplace-v3");
  //     await contract.directListings.buyFromListing(listingId, 1);
  
  //   } catch(error: any) {
  //     console.log(error)
  //     return error
  //       }
  // }



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
      const { smartWalletAddress } = userData.properties;

      await this.cardPurchase(smartWalletAddress, listingId.toString());

      // Decide the relationship type based on inventory and bag size
      const inventorySize: number = userData.properties.inventorySize.toNumber();
      const inventoryCurrentSize: number = result.records[0].get("inventoryCurrentSize").toNumber();

      // Create relationship using a separate Cypher query
      this.createCardRelationship(username, uri, inventoryCurrentSize, inventorySize);

      return new SuccessMessage("Purchase was successful");
    } catch (error: any) {
      console.log(error)
      throw error
    }
  }


  private async cardPurchase(walletAddress: string, listingId: string): Promise<void> {
    try {
        const chain: string = "42161";
        const buyDetails = {
            listingId,
            quantity: "1",
            buyer: walletAddress,
        };

        // Make the purchase
        await engine.marketplaceDirectListings.buyFromListing(
            chain, 
            CARD_MARKETPLACE, 
            "0x0AfF10A2220aa27fBe83C676913aebeb3801DfB6", 
            buyDetails
        );
    } catch (error: any) {
        console.error("Error in cardPurchases:", error);
        throw error; // Rethrow the error for further handling if needed
    }
  }

      
  private async cardPackPurchase(walletAddress: string, listingId: string): Promise<void | Error> {
    try {
      const chain: string = "42161";
      const buyDetails = {
          listingId,
          quantity: "1",
          buyer: walletAddress,
      };

      // Make the purchase
      await engine.marketplaceDirectListings.buyFromListing(
          chain, 
          PACK_MARKETPLACE, 
          "0x0AfF10A2220aa27fBe83C676913aebeb3801DfB6", 
          buyDetails
      );
  } catch (error: any) {
      console.error("Error in cardPurchases:", error);
      throw error; // Rethrow the error for further handling if needed
  }
  }


// private async cardPackPurchase(localWallet: string, localWalletKey: string, listingId: number): Promise<void | Error> {
//   try {
//   const walletLocal: LocalWalletNode = new LocalWalletNode({ chain: CHAIN });
//   await walletLocal.import({
//     encryptedJson: localWallet,
//     password: localWalletKey,
//   });
//   const smartWallet: SmartWallet = new SmartWallet(SMART_WALLET_CONFIG);
//   await smartWallet.connect({
//     personalWallet: walletLocal,
//   });

//   const sdk: ThirdwebSDK = await ThirdwebSDK.fromWallet(smartWallet, CHAIN);
//   const contract: MarketplaceV3 = await sdk.getContract(PACK_MARKETPLACE, "marketplace-v3");
//   await contract.directListings.buyFromListing(listingId, 1);

// } catch(error: any) {
//   console.log(error)
//   return error
//     }
//   }


  // public async buyCardPack(buycardData: BuyCardData, token: string): Promise<SuccessMessage> {
  //   try {
  //     const tokenService: TokenService = new TokenService();
  //     const username: string = await tokenService.verifyAccessToken(token);

  //     const { listingId, uri } = buycardData as BuyCardData;

  //     const session: Session = this.driver.session();
  //     const result: QueryResult = await session.executeRead(tx =>
  //       tx.run('MATCH (u:User {username: $username}) RETURN u', { username })
  //     );
  //     await session.close();
  //     if (result.records.length === 0) {
  //       throw new ValidationError(`User with username '${username}' not found.`, '');
  //     };
      
  //     const userData: UserData = result.records[0].get("u");
  //     const { localWallet, localWalletKey } = userData.properties;

  //     await this.cardPackPurchase(localWallet, localWalletKey, listingId);

  //     // Create relationship using a separate Cypher query
  //     await this.createCardPackRelationship(username, uri);

  //     return new SuccessMessage("Purchase was successful");
  //   } catch (error: any) {
  //     throw error
  //   }
  // }


  public async buyCardPack(buycardData: BuyCardData, token: string): Promise<SuccessMessage> {
    try {
      const tokenService: TokenService = new TokenService();
      const username: string = await tokenService.verifyAccessToken(token);

      const { listingId, uri } = buycardData as BuyCardData;

      const session: Session = this.driver.session();
      const result: QueryResult = await session.executeRead(tx =>
        tx.run('MATCH (u:User {username: $username}) RETURN u', { username })
      );
      await session.close();
      if (result.records.length === 0) {
        throw new ValidationError(`User with username '${username}' not found.`, '');
      };
      
      const userData: UserData = result.records[0].get("u");
      const { smartWalletAddress} = userData.properties;

      await this.cardPackPurchase(smartWalletAddress, listingId.toString());

      // Create relationship using a separate Cypher query
      this.createCardPackRelationship(username, uri);

      return new SuccessMessage("Purchase was successful");
    } catch (error: any) {
      throw error
    }
  }
  

  //Creates a relationship between a user and a card based on provided parameters.
  private async createCardRelationship(username: string, uri: string, inventoryCurrentSize: number, inventorySize: number): Promise<void> {
    try {

      // const rewardService: RewardService = new RewardService()
      // Determine the relationship type based on bag and inventory size
      let relationship: string[];
      if (inventorySize < inventoryCurrentSize + 1) {
        relationship = ["BAGGED"];
      } else {
        relationship = ["INVENTORY"];
      }
      
      // Get the card's name
      const session: Session = this.driver.session();
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
  

  private async createCardPackRelationship(username: string, uri: string): Promise<void> {
    const session: Session = this.driver.session();

    try {
        // Step 1: Get the parent pack's properties
        const packNameResult = await session.run(`
            MATCH (p:Pack {uri: $uri})
            RETURN p.name AS name, p.quantity AS quantity, properties(p) AS props
        `, { uri });

        if (packNameResult.records.length === 0) {
            throw new Error(`Pack with URI ${uri} not found`);
        }

        const parentPackName: string = packNameResult.records[0].get("name");
        const parentPackProps: StorePackData = packNameResult.records[0].get("props");

        // Remove the quantity property from the parent pack's properties
        //@ts-ignore
        delete parentPackProps.quantity;

        // Step 2: Check if the user exists and already owns this pack
        const userOwnsPack = await session.run(`
            MATCH (u:User {username: $username})-[:OWNED]->(p:Pack {name: $name})
            RETURN p AS pack
        `, { username, name: parentPackName });

        if (userOwnsPack.records.length > 0) {
            // Update quantity of the owned pack
            await session.run(`
                MATCH (u:User {username: $username})-[:OWNED]->(p:Pack {name: $name})
                SET p.quantity = p.quantity + 1
            `, { username, name: parentPackName });

            // Decrease quantity of the parent pack
            await session.run(`
                MATCH (p:Pack {name: $name})
                WHERE p.child IS NULL OR p.child = false
                SET p.quantity = p.quantity - 1
            `, { name: parentPackName });

        } else {
            // Step 3: Ensure the user exists before creating a new pack
            const userExists = await session.run(`
                MATCH (u:User {username: $username})
                RETURN u
            `, { username });

            if (userExists.records.length === 0) {
                throw new Error(`User with username ${username} not found`);
            }

            // Create a new pack and associate it with the user
            await session.run(`
                MATCH (u:User {username: $username})
                CREATE (u)-[:OWNED]->(newPack:Pack)
                SET newPack = $props, newPack.quantity = 1, newPack.child = true
            `, { username, props: parentPackProps });

            // Decrease quantity of the parent pack
            await session.run(`
                MATCH (p:Pack {name: $name})
                WHERE p.child IS NULL OR p.child = false
                SET p.quantity = p.quantity - 1
            `, { name: parentPackName });
        }

    } catch (error: any) {
        console.error("Error creating relationship:", error);
        throw error;
    } finally {
        await session.close();
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