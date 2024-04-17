//** MEMGRAPH DRIVER AND TYPES
import { Driver, ManagedTransaction, QueryResult, RecordShape, Session } from "neo4j-driver";

//** VALIDATION ERROR
import ValidationError from "../../outputs/validation.error";

//** IMPORTED SERVICES
import TokenService from "../../user.services/token.services/token.service";

//** TYPE INTERFACES
import { CardMetaData, InventoryCardData , InventoryCards, UpdateInventoryData } from "./inventory.interface";
import { checkInventorySizeCypher, inventoryOpenCardCypher, updateEquippedItemCypher } from "./inventory.cypher";
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
//** replace bagged for items in the inventory with :INVENTORY RELATIONSHIP */
  // Updates inventory data for a user based on the provided access token and update information.
    public async updateEquippedItem(token: string, updateInventoryData: UpdateInventoryData): Promise<SuccessMessage> {
      try {
           const tokenService: TokenService = new TokenService();
           const userName: string = await tokenService.verifyAccessToken(token);

           const { uri, equipped } = updateInventoryData as UpdateInventoryData
           const session: Session | undefined = this.driver?.session();

             // Use a Read Transaction and only return the necessary properties
             const result: QueryResult<RecordShape> | undefined = await session?.executeRead(
                 (tx: ManagedTransaction) =>
                    tx.run( updateEquippedItemCypher, { userName, uri, equipped })
             );
    
             await session?.close();
             
             if (result?.records.length === 0) {
                 throw new ValidationError(`Failed to update inventory.`, "Failed to update inventory");
             };
    
             return new SuccessMessage("Inventory update successful");
            } catch(error: any) {
              console.error("Error updating inventory:", error);
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
  
          // Extract the inventory size from the result
          const inventorySize: number = result.records[0].get("inventorySize");
  
          return inventorySize;
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