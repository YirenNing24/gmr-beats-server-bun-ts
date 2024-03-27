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
import {  CardInventoryOpen, EquipmentSlots } from "../game.services.interfaces";
import { CardData, CardMetaData, CardNFT, InventoryCardData } from "./inventory.interface";
import { CardInventory, CardInventoryItem } from "../../user.services/user.service.interface";


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
          // Use a Read Transaction and only return the necessary properties
          const result: QueryResult<RecordShape> | undefined = await session?.executeRead(
              (tx: ManagedTransaction) =>
                  tx.run(
                      ` MATCH (u:User{username: $userName})-[:OWNS]->(c:Card)
                        
                        RETURN c.uri as uri, c as card`,
                      { userName }
                  )
          );
  
          await session?.close();
  
          // Verify the user exists
          if (!result || result.records.length === 0) {
              throw new ValidationError(`User with username '${userName}' not found.`, "");
          }
  
          const cardData = result.records.map((record) => {
              const uri: string = record.get("uri");
              const card: CardMetaData = record.get("card").properties;
              return { [uri]: card };
          });
  

          return cardData as InventoryCardData
  
      } catch (error: any) {
          console.log(error);
          throw error;
      }
  }
  

    public async updateInventoryData(token: string, inventoryCardData: any):  Promise<{ success: true; }>  {
        try {
          const tokenService: TokenService = new TokenService();
          const userName: string = await tokenService.verifyAccessToken(token);

            const { slotEquipment, inventoryCard } = inventoryCardData as InventoryCardData;
            const session1: Session | undefined = this.driver?.session();

            // Use a Read Transaction and only return the necessary properties
            const result: QueryResult<RecordShape> | undefined = await session1?.executeRead(
                (tx: ManagedTransaction) =>
                    tx.run(
                        `MATCH (u:User {username: $userName}) 
                        RETURN u.localWallet as localWallet, u.localWalletKey as localWalletKey `,
                        { userName }
                    )
            );
    
            await session1?.close();
    
            // Verify the user exists
            if (result?.records.length === 0) {
                throw new ValidationError(`User with username '${userName}' not found.`, "");
            }
    
            const walletData: RecordShape | undefined = result?.records[0].toObject();
            // Retrieve the required properties directly from the query result
            const { localWallet, localWalletKey } = walletData as CardInventoryOpen;
    
            // Return User Details
            const wallet: string = await this.getWalletAddress(localWallet, localWalletKey);
    
            // Use ThirdwebSDK to get NFT cards
            const cards: CardNFT[] = await this.getOwnedCardNFTs(wallet);
    
            let mismatchFound = false;
    
            // Iterate through each entry in inventoryCard
            for (const key in inventoryCard) {
              if (inventoryCard.hasOwnProperty(key)) {
                  const slot: { Item: string | null} = inventoryCard[key];
          
                  // Check if 'Item' value is not null
                  if (slot.Item !== null) {
                      // Check if there's a matching URI in the cards obtained from the wallet
                      const matchingCard: CardNFT | undefined = cards.find((card) => {
                          const { metadata } = card as CardNFT;
                          const { uri } = metadata as CardMetaData;
                          return uri === slot.Item;
                      });
          
                      // If a match is not found, update the inventoryCard accordingly
                      if (!matchingCard) {
                          mismatchFound = true;
                          console.error(`Mismatch found for key '${key}': slot.Item value '${slot.Item}' does not match with any URI in metadata.`);
                          break; // Break the loop if a mismatch is found
                      }
                  }
              }
          }
           
          if (mismatchFound) {
              throw new Error('At least one non-null slot.Item value does not match with the URI in metadata.');
          }
          const session2: Session | undefined = this.driver?.session();
    
            // Use a Write Transaction to update the inventoryCard property in the database
          await session2?.executeWrite(async (tx: ManagedTransaction) => {
                await tx.run(
                    `MATCH (u:User {username: $userName}) 
                     SET u.cardInventory = $inventoryCard`,
                    { userName, inventoryCard }
                );
            });
    
            await this.updateEquipmentSlots(slotEquipment, userName, cards, inventoryCard);

            return {success: true}
        } catch (error: any) {
            throw error;
        }
      }
    
    /**
     * Gets the NFT cards owned by the user using the ThirdwebSDK.
     *
     * @private
     * @async
     * @method
     * @memberof InventoryService
     * @param {string} wallet - The wallet address.
     * @returns {Promise<NFT[]>} A promise that resolves to an array of NFT cards.
     */
    private async getOwnedCardNFTs(walletAddress: string): Promise<CardNFT[]> {
        const sdk: ThirdwebSDK = new ThirdwebSDK("mumbai", {
            secretKey: SECRET_KEY,
        });
    
        const cardContract: Edition = await sdk.getContract(EDITION_ADDRESS, "edition");
        
        //@ts-ignore
        return await cardContract.erc1155.getOwned(walletAddress) as Promise<CardNFT[]>;
      }

    private async checkEquipmentSlot(userName: string, equipSlot: string, uri: string, slot: string, group: string): Promise<boolean> {
        try {
          const session: Session | undefined = this.driver?.session();
      
          // Use a Read Transaction and only return the necessary properties
          const result: QueryResult<RecordShape> | undefined = await session?.executeRead(
            (tx: ManagedTransaction) =>
              tx.run(
                `MATCH (u:User {username: $userName}) 
                RETURN u.${equipSlot} as equipmentSlot`,
                { userName, equipSlot }
              )
          );
          
          // Verify the user exists
          if (result?.records.length === 0) {
            throw new ValidationError(`Equipment Slot '${equipSlot}' not found.`, "");
          }
      
          const equipmentSlotValue: EquipmentSlots = result?.records[0].get("equipmentSlot");
          const capitalizedGroupName: string = await this.titleCase(group)
          const mainKey: string =  capitalizedGroupName + "Equip"
      
          const equipmentSlots: EquipmentSlots = equipmentSlotValue;
          // Check if the slot exists in the equipment slot and if the URI matches

          //@ts-ignore
          if (equipmentSlots[mainKey] && equipmentSlots[mainKey][slot] && equipmentSlots[mainKey][slot]["Item"] === uri) {
            return true;
          }
        } catch (error: any) {
          throw error;
        }
      
        return false;
      }

    private async updateWalletCardInventory(userName: string, cardInventory: CardInventory) {
        try {
          const session: Session | undefined = this.driver?.session();
      
          // Use a Write Transaction to update the cardInventory property in the database
          await session?.executeWrite(async (tx: ManagedTransaction) => {
            await tx.run(
              `MATCH (u:User {username: $userName}) 
               SET u.cardInventory = $cardInventory`,
              { userName, cardInventory }
            );
          });
        } catch (error: any) {
        throw error
        }
      }

    private async getEquipmentSlot(userName: string): Promise<EquipmentSlots> {
      try {
          const session: Session | undefined = this.driver?.session();
  
          // Use a Read Transaction and only return the necessary properties
          const result: QueryResult<RecordShape> | undefined = await session?.executeRead(
              (tx: ManagedTransaction) =>
                  tx.run(
                      `MATCH (u:User {username: $userName}) 
                       RETURN u.iveEquip`,
                      { userName }
                  )
                );
  
          await session?.close();
  
          if (result?.records.length === 0) {
              throw new ValidationError(`User with username '${userName}' not found.`, "");
          }
  
          // Parse the stringified JSON back to a JavaScript object
          const equipmentSlots: EquipmentSlots = result?.records[0].get("u.iveEquip");
          return equipmentSlots;
      } catch (error: any) {
          throw error;
      }
      }

      private async updateEquipmentSlots(equipmentSlots: EquipmentSlots, userName: string, cards: CardNFT[], inventoryCard: CardInventory): Promise<void> {
        try {
            const { IveEquip } = equipmentSlots as EquipmentSlots;
    
            let mismatchFound: boolean = false;
    
            for (const memberName in IveEquip.IveEquip) {
                if (IveEquip.IveEquip.hasOwnProperty(memberName)) {
                    const member: Member = IveEquip.IveEquip[memberName];
    
                    // Check if the 'Item' property is not null for the current member
                    if (member?.Item !== null) {
                        // Check if there's a matching URI in the cards obtained from the wallet
                        const matchingCard = cards.find((card) => {
                            const { metadata } = card as CardNFT;
                            const { uri } = metadata as CardMetaData;
                            return uri === member?.Item as string;
                        });
    
                        // Check if the 'Item' value already exists in cardInventory
                        const isItemInCardInventory: boolean = this.checkItemInCardInventory(member?.Item, inventoryCard);
    
                        // If a match is not found, set mismatchFound to true
                        if (!matchingCard || isItemInCardInventory) {
                            mismatchFound = true;
                            break; // Break the loop if a mismatch is found
                        }
                    }
                }
            }
    
            if (mismatchFound) {
                throw new Error('At least one equipment slot Item value does not match with the URI in metadata.');
            }
    
            const session: Session | undefined = this.driver?.session();
    
            const mainKey = 'IveEquip'; // Set your main key here
    
            // Dynamically build the structure with the main key
            const dynamicStructure: { [key: string]: any } = { [mainKey]: { [mainKey]: IveEquip } };


            console.log(dynamicStructure)
    
            // Use a Write Transaction to update the dynamicStructure property in the database
            await session?.executeWrite(async (tx: ManagedTransaction) => {
                await tx.run(
                    `MATCH (u:User {username: $userName}) 
                    SET u.${mainKey} = $dynamicStructure`,
                    { userName, dynamicStructure }
                );
            });
        } catch (error: any) {
            // Handle errors here, log them, or throw a specific error type
            throw error;
        }
    }
    
    
    private checkItemInCardInventory(item: string | undefined, inventoryCard: CardInventory): boolean {
      for (const key in inventoryCard) {
          if (inventoryCard.hasOwnProperty(key)) {
              const slot: CardInventoryItem | null = inventoryCard[key];
              if (slot?.Item === item) {
                  return true; // 'Item' value already exists in cardInventory
              }
          }
      }
  
      return false; // 'Item' value not found in cardInventory
      }

    //** BAG INVENTORY */
    public async bagInventoryOpen(userName: string): Promise<NFT[]> {
      try {
        const session: Session | undefined = this.driver?.session();
    
        // Use a Read Transaction and only return the necessary properties
        const result: QueryResult<RecordShape> | undefined = await session?.executeRead(
          (tx: ManagedTransaction) =>
            tx.run(
              `MATCH (u:User {username: $userName}) 
                  RETURN u.localWallet as localWallet, u.localWalletKey as localWalletKey`,
              { userName }
            )
        );
    
        await session?.close();
    
        // Verify the user exists
        if (result?.records.length === 0) {
          throw new ValidationError(`User with username '${userName}' not found.`, "");
        }
    
        const walletData: RecordShape | undefined = result?.records[0].toObject();
        // Retrieve the required properties directly from the query result
        const { localWallet, localWalletKey } = walletData as CardInventoryOpen;
    
        // Return wallet address
        const walletAddress: string = await this.getWalletAddress(localWallet, localWalletKey);
    
        // Return NFT Packs
        const bundleNFTs: NFT[] = await this.getOwnedBundles(walletAddress);
    
        // Use Promise.all to concurrently fetch bundle contents for all bundles
        const bundleContentsPromises: Promise<any>[] = bundleNFTs.map(async (bundle) => {
          const bundleContents = await this.getBundleContents(bundle.metadata.id);
          return { ...bundle, rewards: bundleContents };
        });
    
        // Wait for all promises to resolve
        const bundlesWithContents: NFT[] = await Promise.all(bundleContentsPromises);
    
        return bundlesWithContents as NFT[];
      } catch (error: any) {
        throw error
      }
      }
    
    private async getOwnedBundles(walletAddress: string): Promise<NFT[]> {
      {
        const sdk: ThirdwebSDK = new ThirdwebSDK("mumbai", {
            secretKey: SECRET_KEY,
        });
    
        const bundleContract: Pack = await sdk.getContract(PACK_ADDRESS, "pack");
        const ownedBundles: NFT[] = await bundleContract.getOwned(walletAddress)



        return ownedBundles as NFT[]
      }
      }

    private async getBundleContents(bundleId: string) {
        const sdk: ThirdwebSDK = new ThirdwebSDK("mumbai", {
          secretKey: SECRET_KEY,
        });
      
        const bundleContract: Pack = await sdk.getContract(PACK_ADDRESS, "pack");
        const bundleContents = await bundleContract.getPackContents(bundleId);
      
        const { erc1155Rewards } = bundleContents;
      
        // Iterate through erc1155Rewards array and fetch additional data
        const enhancedErc1155Rewards = await Promise.all(
          erc1155Rewards.map(async (reward) => {
            const tokenId = reward.tokenId;
            const editionContract: Edition = await sdk.getContract(EDITION_ADDRESS, "edition");
            const cardData = await editionContract.erc1155.get(tokenId);
            return { ...reward, cardData };
          })
        );
      
        // Add enhancedErc1155Rewards to the bundleContents
        const enhancedBundleContents = { ...bundleContents, erc1155Rewards: enhancedErc1155Rewards };
      
        return enhancedBundleContents;
      }
      


    //** UTILS */
    private async titleCase(group: string): Promise<string> {
      return group[0].toUpperCase() + group.substring(1).toLowerCase()
      }


    private async getWalletAddress(localWallet: string, localWalletKey: string): Promise<string> {
      const walletService: WalletService = new WalletService();
      return await walletService.getWalletAddress(localWallet, localWalletKey);
      }


  }
  

export default InventoryService;