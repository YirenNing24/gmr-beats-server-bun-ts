//** MEMGRAPH DRIVER AND TYPES
import { Driver, ManagedTransaction, QueryResult, RecordShape, Session } from "neo4j-driver";

//** VALIDATION ERROR
import ValidationError from "../../outputs/validation.error";

//** IMPORTED SERVICES
import TokenService from "../../user.services/token.services/token.service";

//** TYPE INTERFACES
import { CardMetaData, InventoryCardData , UpdateInventoryData } from "./inventory.interface";
import { inventoryOpenCardCypher, updateInventoryCypher } from "./inventory.cypher";
import { SuccessMessage } from "../../outputs/success.message";


class InventoryService {
driver?: Driver;
constructor(driver?: Driver) {
this.driver = driver;
    }

    //** CARD INVENTORY */
    //Retrieves inventory card data for a user based on the provided access token.
    public async cardInventoryOpen(token: string): Promise<InventoryCardData>  {
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
    
        // If no records found, return an empty array
        if (!result || result.records.length === 0) {
          return [];
        }
    
        // Map the card data
        const cardData: InventoryCardData = result.records.map((record) => {
          const uri: string = record.get("uri");
          const card: CardMetaData = record.get("card").properties;
          return { [uri]: card };
        });
    
        return cardData as InventoryCardData;
      } catch (error: any) {
        console.error("Error opening user inventory:", error);
        throw error;
      }
    }

  // Updates inventory data for a user based on the provided access token and update information.
    public async updateInventoryData(token: string, updateInventoryData: UpdateInventoryData): Promise<SuccessMessage> {
      try {
           const tokenService: TokenService = new TokenService();
           const userName: string = await tokenService.verifyAccessToken(token);

           const { uri, equipped } = updateInventoryData as UpdateInventoryData
           const session: Session | undefined = this.driver?.session();

             // Use a Read Transaction and only return the necessary properties
             const result: QueryResult<RecordShape> | undefined = await session?.executeRead(
                 (tx: ManagedTransaction) =>
                    tx.run( updateInventoryCypher, { userName, uri, equipped })
             );
    
             await session?.close();
             
             if (result?.records.length === 0) {
                 throw new ValidationError(`Failed to update inventory.`, "Failed to update inventory");
             };
    
             return new SuccessMessage("Inventory update successfully");
            } catch(error: any) {
              console.error("Error updating inventory:", error);
              throw error;
            }
    }

    // private async getWalletAddress(localWallet: string, localWalletKey: string): Promise<string> {
    //   const walletService: WalletService = new WalletService();
    //   return await walletService.getWalletAddress(localWallet, localWalletKey);
    //   }


  }
  

export default InventoryService;