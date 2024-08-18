//** MEMGRAPH DRIVER AND TYPES
import { Driver, ManagedTransaction, QueryResult, RecordShape, Session } from "neo4j-driver";

//** RETHINK DB
import rt from "rethinkdb";
import { getRethinkDB } from "../../db/rethink";

//** THIRDWEB IMPORTS
import { Edition, ThirdwebSDK } from "@thirdweb-dev/sdk";

//** VALIDATION ERROR
import ValidationError from "../../outputs/validation.error";

//** IMPORTED SERVICES
import TokenService from "../../user.services/token.services/token.service";

//** CONFIG IMPORT
import { SECRET_KEY, CHAIN, PRIVATE_KEY, EDITION_ADDRESS } from "../../config/constants";

//** CYPHER IMPORT
import { deductCardpack, openCardpackCypher } from "./gacha.cypher";
import { buyCardCypher } from "../store.services/store.cypher";

//** LUCKY ITEM IMPORT
import luckyItem from 'lucky-item'

//** TYPE INTERFACES
import { CardNameWeight, CardPackRate, PackData, PackDataItem } from "./gacha.interface";
import { CardMetaData } from "../inventory.services/inventory.interface";
import { UserData } from "../../user.services/user.service.interface";



class GachaService {
    driver: Driver;
    constructor(driver: Driver) {
      this.driver = driver;
  }


  public async openCardPack(token: string, packData: PackData): Promise<string[]> {
      try {
          const tokenService: TokenService = new TokenService();
          const username: string = await tokenService.verifyAccessToken(token);
  
          // Assuming you know the pack name or ID key you want to work with
          const packName: string = Object.keys(packData)[0];

          const session: Session = this.driver.session();
          const result: QueryResult<RecordShape> = await session.executeRead((tx: ManagedTransaction) =>
              tx.run(openCardpackCypher, { username, name: packName })
          );

          if (!result || result.records.length === 0) {
              throw new ValidationError(`no data found`, "");
          }
  
          const pack: PackData = result.records[0].get("pack").properties;
          const walletAddress: string = result.records[0].get("walletAddress");
          
          const connection: rt.Connection = await getRethinkDB();
          const query: rt.Cursor = await rt.db('admin')
              .table('cardPacks')
              .filter({ packName: pack.name })
              .run(connection);
  
          const cardPack: CardPackRate[] = await query.toArray();
          const cardPackContent = cardPack[0];
  
          const { cardPackData } = cardPackContent;
          
          //@ts-ignore
          const rewardCards: string[] = await this.rollCardPack(cardPackData, walletAddress, username, pack.id);

           await session.executeRead((tx: ManagedTransaction) =>
             tx.run(deductCardpack, { username, name: packName })
         );

        return rewardCards;
      } catch (error: any) {
          console.log(error);
          throw error;
      }
  }
  

  private async rollCardPack(cardNameWeight: CardNameWeight[], walletAddress: string, username: string, packId: string) {
    try {
        // Use luckyItem to get the weighted items
        const weightedItems: CardNameWeight[] = luckyItem.itemsBy(cardNameWeight, 'weight', 3);
        
        // Extract the card names from the weighted items
        const cardNames: string[] = weightedItems.map(item => item.cardName);

        // Transfer the reward cards
        await this.transferRewardCards(cardNames, walletAddress, username, packId);


        return cardNames;
    } catch (error: any) {
        console.error(error);
        throw error;
    }
  }


  private async transferRewardCards(rewardCards: string[], walletAddress: string, username: string, packId: string) {
    const session: Session = this.driver.session();
    try {
        // Initialize the ThirdwebSDK with your private key and chain
        const sdk: ThirdwebSDK = ThirdwebSDK.fromPrivateKey(PRIVATE_KEY, CHAIN, {
            secretKey: SECRET_KEY,
        });

        const cardContract: Edition = await sdk.getContract(EDITION_ADDRESS, 'edition');


        let cardIDs: Array<string> = []
        // Iterate over the rewardCards and execute the query for each card
        for (const cardName of rewardCards) {
            // Cypher query to find the card
            const query = `
                MATCH (c:Card {name: $cardName})
                WHERE c.transferred = false OR c.transferred IS NULL
                AND NOT EXISTS((c)-[:INVENTORY | BAGGED ]->(:User))
                RETURN c
            `;

            // Execute the query and retrieve the matching card
            const result: QueryResult<RecordShape> = await session.executeRead((tx: ManagedTransaction) =>
                tx.run(query, { cardName })
            );

            // Extract the card from the query result
            const record = result.records[0];
            if (!record) {
                console.log(`No card found for name: ${cardName}`);
                continue;
            }

            const card: CardMetaData = record.get('c').properties;
            const { id } = card
            cardIDs.push(id);

            // Example: Transfer 1 unit of the tokenId to the walletAddress
            await cardContract.transfer(walletAddress, id, 1);
        }

        await this.updateInventory(username, rewardCards, cardIDs);

        await cardContract.burn(packId, 1);

    } catch (error: any) {
        console.error(error);
        throw error;
    } finally {
        // Always close the session after execution
        await session.close();
    }
  }


private async updateInventory(username: string, cardNames: string[], tokenIds: string[]): Promise<void> {
    try {
        const session: Session = this.driver.session();
        const result: QueryResult<RecordShape> = await session.executeRead((tx: ManagedTransaction) =>
            tx.run(buyCardCypher, { username })
        );

        await session.close();

        const userData: UserData = result.records[0].get("u");

        // Decide the relationship type based on inventory and bag size
        const inventorySize: number = userData.properties.inventorySize.toNumber();
        const inventoryCurrentSize: number = result.records[0].get("inventoryCurrentSize").toNumber();

        // Create relationships for all cards using a separate Cypher query
        await this.createCardRelationship(username, cardNames, tokenIds, inventoryCurrentSize, inventorySize);
        

    } catch (error: any) {
        throw error;
    }
  }


private async createCardRelationship(username: string, cardNames: string[], tokenIds: string[], inventoryCurrentSize: number, inventorySize: number): Promise<void> {
    try {
        const session: Session = this.driver.session();
        for (let i = 0; i < cardNames.length; i++) {
            const cardName = cardNames[i];
            const tokenId = tokenIds[i];

            // Decide the relationship type
            const relationship: string = (inventorySize < inventoryCurrentSize + 1) ? "BAGGED" : "INVENTORY";

            // Create the relationship using the card's name and token ID
            await session.run(`
                MATCH (u:User {username: $username}), (c:Card {name: $cardName, tokenId: $tokenId})
                CREATE (u)-[:${relationship}]->(c)
                SET c.transferred = true
            `, { username, cardName, tokenId });

            // Update the inventory size
            inventoryCurrentSize++;
        }
        await session.close();
    } catch (error: any) {
        console.error("Error creating relationship:", error);
        throw error;
    }





  }



  

}

export default GachaService