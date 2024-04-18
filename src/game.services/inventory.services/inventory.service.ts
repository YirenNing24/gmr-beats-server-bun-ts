//** MEMGRAPH DRIVER AND TYPES
import { Driver, ManagedTransaction, QueryResult, RecordShape, Session } from "neo4j-driver";

//** VALIDATION ERROR
import ValidationError from "../../outputs/validation.error";

//** IMPORTED SERVICES
import TokenService from "../../user.services/token.services/token.service";

//** TYPE INTERFACES
import { CardMetaData, InventoryCardData , InventoryCards, UpdateInventoryData } from "./inventory.interface";
import { checkInventorySizeCypher, inventoryOpenCardCypher, removeEquippedItemCypher, updateEquippedItemCypher } from "./inventory.cypher";
import { SuccessMessage } from "../../outputs/success.message";


class InventoryService {
driver?: Driver;
constructor(driver?: Driver) {
this.driver = driver;
    }

    //** CARD INVENTORY */
    //Retrieves inventory card data for a user based on the provided access token.
    public async cardInventoryOpen(token: string): Promise<InventoryCards>  {
      try {
        const tokenService: TokenService = new TokenService();
        const userName: string = await tokenService.verifyAccessToken(token);
    
        const session: Session | undefined = this.driver?.session();
    
        // Use a Read Transaction and only return the necessary properties
        const result: QueryResult<RecordShape> | undefined = await session?.executeRead(
          (tx: ManagedTransaction) =>
            tx.run( inventoryOpenCardCypher, { userName })
        );
    
        await session?.close();
    
        // If no records found, return empty arrays
        if (!result || result.records.length === 0) {
          return [[], []];
        }
    
        // Initialize arrays to store cards with different relationships
        const ownedAndBagged: InventoryCardData[] = [];
        const ownedAndEquipped: InventoryCardData[] = [];
    
        // Iterate over the result records
        result.records.forEach((record) => {
          // Extract URI and card data from the record
          const uri: string = record.get("uri");
          const card: CardMetaData = record.get("card").properties;
    
          // Check the relationship type and add the card to the appropriate array
          const relationshipType: string = record.get("relationshipType");
          if (relationshipType === "INVENTORY") {
            ownedAndBagged.push({ [uri]: { ...card, uri } });
          } else if (relationshipType === "EQUIPPED") {
            ownedAndEquipped.push({ [uri]: { ...card, uri } });
          }
        });

        return [ownedAndBagged, ownedAndEquipped] as InventoryCards
      } catch (error: any) {
        console.error("Error opening user inventory:", error);
        throw error;
      }
    }

  // Updates inventory data for a user based on the provided access token and update information.
    public async equipItem(token: string, updateInventoryData: UpdateInventoryData[]): Promise<SuccessMessage> {
      try {
          const tokenService: TokenService = new TokenService();
          const userName: string = await tokenService.verifyAccessToken(token);

          const session: Session | undefined = this.driver?.session();

          // Iterate over each item in the updateInventoryData array
          for (const item of updateInventoryData) {
              const { uri, equipped } = item;

              // Use a Write Transaction to update the equipped status of the item
              await session?.executeWrite(async (tx: ManagedTransaction) => {
                  await tx.run(updateEquippedItemCypher, { userName, uri, equipped });
              });
          }

          await session?.close();

          // Return success message
          return new SuccessMessage("Inventory update successful");
      } catch (error: any) {
          console.error("Error updating inventory:", error);
          throw error;
      }
    }

    public async removeEquippedItem(token: string, updateInventoryData: UpdateInventoryData[]): Promise<SuccessMessage> {
      try {
          const tokenService: TokenService = new TokenService();
          const userName: string = await tokenService.verifyAccessToken(token);
  
          const session: Session | undefined = this.driver?.session();
  
          // Get the remaining inventory size
          const remainingSize: number | undefined = await this.checkInventorySize(userName);
  
          if (remainingSize === undefined) {
              throw new Error("Failed to retrieve remaining inventory size.");
          }
  
          // Calculate the number of items to be removed
          const itemsToRemove: number = updateInventoryData.length;
  
          // Check if the number of items to be removed exceeds the remaining inventory size
          if (itemsToRemove > remainingSize) {
              throw new Error("Insufficient inventory space to remove equipped items.");
          }
  
          let totalRemovedCount: number = 0;
  
          // Iterate over each item in the updateInventoryData array
          for (const item of updateInventoryData) {
              const { uri } = item;
  
              // Use a Write Transaction to remove the equipped status of the item and reinstate it in the inventory
              const result: QueryResult<RecordShape> | undefined = await session?.executeWrite(
                  async (tx: ManagedTransaction) => {
                      return tx.run(removeEquippedItemCypher, { userName, uri });
                  }
              );
  
              // Extract the removed count from the result
              const removedCount: number = result?.records[0].get("removedCount");
  
              // Update the total removed count
              totalRemovedCount += removedCount;
          }
  
          await session?.close();
  
          // Return success message
          return new SuccessMessage(`${totalRemovedCount} equipped items removed successfully and reinstated in the inventory.`);
      } catch (error: any) {
          console.error("Error removing equipped items:", error);
          throw error;
      }
    }




    private async checkInventorySize(username: string): Promise<number | undefined> {
      try {
          const session: Session | undefined = this.driver?.session();
  
          // Use a Read Transaction and only return the necessary properties
          const result: QueryResult<RecordShape> | undefined = await session?.executeRead(
              (tx: ManagedTransaction) =>
                  tx.run(checkInventorySizeCypher, {
                      username
                  })
          );
  
          await session?.close();
  
          // If no records found, return undefined
          if (!result || result.records.length === 0) {
              return undefined;
          }
  
          // Extract the remaining inventory size from the result
          const remainingSize: number = result.records[0].get("remainingSize");
  
          return remainingSize as number
      } catch (error: any) {
          console.error("Error checking inventory size:", error);
          throw error;
      }
    }
  
  

    // private async getWalletAddress(localWallet: string, localWalletKey: string): Promise<string> {
    //   const walletService: WalletService = new WalletService();
    //   return await walletService.getWalletAddress(localWallet, localWalletKey);
    //   }


  }
  

export default InventoryService;