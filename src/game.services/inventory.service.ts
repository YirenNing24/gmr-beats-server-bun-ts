//** MEMGRAPH DRIVER AND TYPES
import { Driver, ManagedTransaction, QueryResult, RecordShape, Session } from "neo4j-driver";

//** THIRDWEB IMPORTS
import { Edition, NFT, Pack, ThirdwebSDK } from "@thirdweb-dev/sdk";

//** VALIDATION ERROR
import ValidationError from "../errors/validation.error";

//** IMPORTED SERVICES
import WalletService from "../user.services/wallet.service";
import { EDITION_ADDRESS, PACK_ADDRESS, SECRET_KEY } from "../config/constants";

//** TYPE INTERFACES
import { CardNFT, CardInventoryOpen, EquipmentSlots, CardMetaData, CardsData, InventoryCardData } from "./game.services.interfaces";
import { CardInventory, CardInventoryItem } from "../user.services/user.service.interface";


/**
 * Service for handling user inventory-related operations.
 *
 * @class
 * @name InventoryService
 */
class InventoryService {
    /**
     * Neo4j driver instance for database interactions.
     * @type {Driver|undefined}
     * @memberof InventoryService
     * @instance
     */
    driver?: Driver;

    /**
     * Creates an instance of InventoryService.
     *
     * @constructor
     * @param {Driver|undefined} driver - The Neo4j driver to be used for database interactions.
     * @memberof InventoryService
     * @instance
     */
    constructor(driver?: Driver) {
        this.driver = driver;
    }

    /**
     * Opens the card inventory for the specified user.
     *
     * @async
     * @method
     * @memberof InventoryService
     * @param {string} userName - The username of the user.
     * @returns {Promise<NFT[]>} A promise that resolves to an array of NFT cards owned by the user.
     * @throws {ValidationError} If the user is not found or an error occurs during the process.
     */

    //** CARD INVENTORY */

    public async cardInventoryOpen(userName: string): Promise<InventoryCardData> {
        try {
          const session: Session | undefined = this.driver?.session();
      
          // Use a Read Transaction and only return the necessary properties
          const result: QueryResult<RecordShape> | undefined = await session?.executeRead(
            (tx: ManagedTransaction) =>
              tx.run(
                `MATCH (u:User {username: $userName}) 
                RETURN u.localWallet as localWallet, u.localWalletKey as localWalletKey, u.cardInventory as cardInventory`,
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
          const { localWallet, localWalletKey, cardInventory } = walletData as CardInventoryOpen;
      
          // Return wallet address
          const walletAddress: string = await this.getWalletAddress(localWallet, localWalletKey);
      
          // Use ThirdwebSDK to get NFT cards
          const inventoryCard: CardInventory = JSON.parse(cardInventory);
          const cards: CardNFT[] = await this.getOwnedCardNFTs(walletAddress);
          
          // Create a new object to store cards with URI as main key and metadata as value
          const cardsData: Record<string, CardsData['uri']> = {};
      
          for (const card of cards) {
            const { metadata } = card as CardNFT;
      
            // Extract the relevant information from the card metadata
            const { uri, ...Metadata } = metadata as CardMetaData;
      
            // Set URI as the main key with metadata as the value
            cardsData[uri] = { ...Metadata };
      
            // Extract the group and slot information
            const { group, slot } = metadata as { group: string; slot: string };

            const equipmentSlot: string = `${group.toLowerCase().replace(/\s+/g, "")}Equip`;
      
            // Check if the URI already exists in the inventoryCard if not check in equipment slot
            if (!Object.values(inventoryCard).some((item) => item?.Item === uri)) {

              // If URI is not in both inventory and equipment slot, add it to any null slot in the inventory
              const equipmentSlotExists: boolean = await this.checkEquipmentSlot(userName, equipmentSlot, uri, slot, group);

              if (!equipmentSlotExists) {
                const emptySlot: string | undefined = Object.keys(inventoryCard).find((slot) => inventoryCard[slot]?.Item === null);
                if (emptySlot) {
                  inventoryCard[emptySlot] = { Item: uri };
                }
              }

            }
            else{
              console.log("not yet sure!")
          }
          }
      
          // Update inventory only if there's a change
          await this.updateWalletCardInventory(userName, inventoryCard);
      
          // Retrieve equipment slots after potential updates
          const slotEquipment: EquipmentSlots = await this.getEquipmentSlot(userName);
          
          // Return all relevant data
          return { slotEquipment, inventoryCard, cardsData } as InventoryCardData
        } catch (error: any) {
          throw error;
        }
      }

    public async updateInventoryData(userName: string, inventoryCardData: InventoryCardData):  Promise<{ success: true; }>  {
        try {
            const { slotEquipment, inventoryCard } = inventoryCardData;
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
                  const slot = inventoryCard[key];
          
                  // Check if 'Item' value is not null
                  if (slot.Item !== null) {
                      // Check if there's a matching URI in the cards obtained from the wallet
                      const matchingCard = cards.find((card) => {
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
          const stringCardInventory: string = JSON.stringify(inventoryCard)
          const session2: Session | undefined = this.driver?.session();
    
            // Use a Write Transaction to update the inventoryCard property in the database
          await session2?.executeWrite(async (tx: ManagedTransaction) => {
                await tx.run(
                    `MATCH (u:User {username: $userName}) 
                     SET u.cardInventory = $stringCardInventory`,
                    { userName, stringCardInventory}
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
        return cardContract.erc1155.getOwned(walletAddress) as Promise<CardNFT[]>;
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
      
          const equipmentSlotValue = result?.records[0].get("equipmentSlot");
          const capitalizedGroup: string = await this.titleCase(group)
          const mainKey: string =  capitalizedGroup + "Equip"
      
          // Parse the JSON if the value is not null
          const equipmentSlots = equipmentSlotValue ? JSON.parse(equipmentSlotValue) : null;
          
          // Check if the slot exists in the equipment slot and if the URI matches
          if (equipmentSlots[mainKey][slot]["Item"] === uri) {
            return true;
          }
        } catch (error: any) {
          throw error;
        }
      
        return false;
      }

    private async updateWalletCardInventory(userName: string, cardInventory: CardInventory) {
        try {
          const inventoryCard: string = JSON.stringify(cardInventory);
          const session: Session | undefined = this.driver?.session();
      
          // Use a Write Transaction to update the cardInventory property in the database
          await session?.executeWrite(async (tx: ManagedTransaction) => {
            await tx.run(
              `MATCH (u:User {username: $userName}) 
              SET u.cardInventory = $inventoryCard`,
              { userName, inventoryCard }
            );
          });
        } catch (error: any) {
          // Handle errors here, log them, or throw a specific error type
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
          const equipmentSlotsString = result?.records[0].get("u.iveEquip").toString();
          const equipmentSlots: EquipmentSlots = JSON.parse(equipmentSlotsString)
  
          return equipmentSlots;
      } catch (error: any) {
          throw error;
      }
      }

    private async updateEquipmentSlots(equipmentSlots: EquipmentSlots, userName: string, cards: CardNFT[], inventoryCard: CardInventory): Promise<void> {
        try {
            const { IveEquip } = equipmentSlots as EquipmentSlots

            let mismatchFound: boolean = false;
    
            for (const memberName in IveEquip.IveEquip) {
                if (IveEquip.hasOwnProperty(memberName)) {
                    const member = IveEquip.IveEquip[memberName];
    
                    // Check if the 'Item' property is not null for the current member
                    if (member.Item !== null) {
                        // Check if there's a matching URI in the cards obtained from the wallet
                        const matchingCard = cards.find((card) => {
                            const { metadata } = card as CardNFT;
                            const { uri } = metadata as CardMetaData;
                            return uri === member.Item as string
                        });
    
                        // Check if the 'Item' value already exists in cardInventory
                        const isItemInCardInventory: boolean = this.checkItemInCardInventory(member.Item, inventoryCard);
    
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
    
            const stringIveEquip: string = JSON.stringify({IveEquip: IveEquip});
            const session: Session | undefined = this.driver?.session();
    
            // Use a Write Transaction to update the iveEquip property in the database
            await session?.executeWrite(async (tx: ManagedTransaction) => {
                await tx.run(
                    `MATCH (u:User {username: $userName}) 
                    SET u.iveEquip = $stringIveEquip`,
                    { userName, stringIveEquip }
                );
            });
        } catch (error: any) {
            // Handle errors here, log them, or throw a specific error type
            throw error;
        }
      }
    
    private checkItemInCardInventory(item: string, inventoryCard: CardInventory): boolean {
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

      /**
     * Gets the wallet address using the WalletService.
     *
     * @private
     * @async
     * @method
     * @memberof InventoryService
     * @param {string} localWallet - The local wallet data.
     * @param {string} localWalletKey - The local wallet key.
     * @returns {Promise<string>} A promise that resolves to the wallet address.
     */
    private async getWalletAddress(localWallet: string, localWalletKey: string): Promise<string> {
      const walletService: WalletService = new WalletService();
      return await walletService.getWalletAddress(localWallet, localWalletKey);
      }


  }
  

export default InventoryService;