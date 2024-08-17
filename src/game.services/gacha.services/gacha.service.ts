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
import { openCardpackCypher } from "./gacha.cypher";

//** LUCKY ITEM IMPORT
import luckyItem from 'lucky-item'

//** TYPE INTERFACES
import { CardNameWeight, CardPackRate, PackData } from "./gacha.interface";
import { CardMetaData } from "../inventory.services/inventory.interface";


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
          const packName = Object.keys(packData)[0];
          const cardPackDetails = packData[packName];
  
          console.log(cardPackDetails);
  
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
  
          const rewardCards: string[] = await this.rollCardPack(cardPackData, walletAddress);
          
          return rewardCards;
      } catch (error: any) {
          console.log(error);
          throw error;
      }
  }
  

  private async rollCardPack(cardNameWeight: CardNameWeight[], walletAddress: string) {
    try {
        // Use luckyItem to get the weighted items
        const weightedItems: CardNameWeight[] = luckyItem.itemsBy(cardNameWeight, 'weight', 3);
        
        // Extract the card names from the weighted items
        const cardNames: string[] = weightedItems.map(item => item.cardName);

        // Transfer the reward cards
        await this.transferRewardCards(cardNames, walletAddress);

        return cardNames;
    } catch (error: any) {
        console.error(error);
        throw error;
    }
  }


  private async transferRewardCards(rewardCards: string[], walletAddress: string) {
    const session: Session = this.driver.session();
    try {
        // Initialize the ThirdwebSDK with your private key and chain
        const sdk: ThirdwebSDK = ThirdwebSDK.fromPrivateKey(PRIVATE_KEY, CHAIN, {
            secretKey: SECRET_KEY,
        });

        const cardContract: Edition = await sdk.getContract(EDITION_ADDRESS, 'edition');

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

            
            const tokenId: string = card.tokenId; // Assuming there's a tokenId property


            // Example: Transfer 1 unit of the tokenId to the walletAddress
            await cardContract.transfer(walletAddress, tokenId, 1);
        }
    } catch (error: any) {
        console.error(error);
        throw error;
    } finally {
        // Always close the session after execution
        await session.close();
    }
}





}

export default GachaService