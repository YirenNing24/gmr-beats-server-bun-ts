//** MEMGRAPH DRIVER AND TYPES
import { Driver, ManagedTransaction, QueryResult, RecordShape, Session } from "neo4j-driver";

//** THIRDWEB IMPORTS
import { Edition, NFT, Pack, ThirdwebSDK } from "@thirdweb-dev/sdk";

//** VALIDATION ERROR
import ValidationError from "../../outputs/validation.error";

//** IMPORTED SERVICES
import WalletService from "../../user.services/wallet.service";
import TokenService from "../../user.services/token.service";

//** CONFIG IMPORTS
import { EDITION_ADDRESS, PACK_ADDRESS, SECRET_KEY } from "../../config/constants";

//** TYPE INTERFACES
import { CardMetaData, InventoryCardData, UpdateInventoryData } from "./inventory.interface";
import { inventoryOpenCardCypher, updateInventoryCypher } from "./inventory.cypher";
import { SuccessMessage } from "../../outputs/success.message";

/**
 * Service for handling user inventory-related operations.
 *
 * @class
 * @name InventoryService
 */
class InventoryService {
    driver?: Driver;
    constructor(driver?: Driver) {
        this.driver = driver;
    }

    //** CARD INVENTORY */
    public async cardInventoryOpen(token: string): Promise<InventoryCardData>  {
      try {
        const tokenService: TokenService = new TokenService();
        const userName: string = await tokenService.verifyAccessToken(token);
    
        const session: Session | undefined = this.driver?.session();
        if (!session) throw new Error('Session is undefined'); // Check for session existence
    
        // Use a Read Transaction and only return the necessary properties
        const result: QueryResult<RecordShape> | undefined = await session.executeRead(
          (tx: ManagedTransaction) =>
            tx.run( inventoryOpenCardCypher, { userName })
        );
    
        await session.close();
    
        // Verify the user exists
        if (!result || result.records.length === 0) {
          throw new ValidationError(`User with username '${userName}' not found.`, "");
        }
    
        // Map the card data
        const cardData: InventoryCardData = result.records.map((record) => {
          const uri: string = record.get("uri");
          const card: CardMetaData = record.get("card").properties;
          return { [uri]: card };
        });
    
        return cardData as InventoryCardData;
      } catch (error: any) {
        throw error;
      }
    }
    
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
              throw error;
            }
    }


  

          

          


    private async getWalletAddress(localWallet: string, localWalletKey: string): Promise<string> {
      const walletService: WalletService = new WalletService();
      return await walletService.getWalletAddress(localWallet, localWalletKey);
      }


  }
  

export default InventoryService;