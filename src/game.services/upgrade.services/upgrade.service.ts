

//** MEMGRAPH DRIVER
import { Driver, QueryResult, Session,  ManagedTransaction, RecordShape } from 'neo4j-driver-core'

//** IMPORTED SERVICES
import TokenService from "../../user.services/token.services/token.service";

//** TYPE INTERFACES
import { CardUpgradeData } from './upgrade.interface';
import { CardMetaData } from '../inventory.services/inventory.interface';

//** CYPHER IMPORT
import { upgradeCardDataCypher } from './upgrade.cypher';

//** VALIDATION ERROR IMPORT
import ValidationError from '../../outputs/validation.error';

//** SUCCESS MESSAGE IMPORT
import { SuccessMessage } from '../../outputs/success.message';
import { StoreCardUpgradeData } from '../store.services/store.interface';

//** IMPORT THIRDWEB
import { Edition, ThirdwebSDK } from '@thirdweb-dev/sdk';
import { CHAIN, EDITION_ADDRESS, SECRET_KEY, SMART_WALLET_CONFIG } from '../../config/constants';
import { LocalWalletNode } from '@thirdweb-dev/wallets/evm/wallets/local-wallet-node';
import { SmartWallet } from '@thirdweb-dev/wallets';

class UpgradeService {
    driver: Driver
    constructor(driver: Driver) {
      this.driver = driver
      }

    public async cardGainExperience(token: string, cardUpgradeData: CardUpgradeData): Promise<SuccessMessage> {
        const tokenService: TokenService = new TokenService();
        const userName: string = await tokenService.verifyAccessToken(token);
    
        try {
            const { cardUri, cardUpgrade } = cardUpgradeData;
            const session: Session | undefined = this.driver?.session();
    
            let card: CardMetaData | undefined;
            const cardUpgradeItem: StoreCardUpgradeData[] = [];
            const cardUpgradeUpdate = []
            // Iterate over each cardUpgrade item
            for (const item of cardUpgrade) {
                const { uri, id, quantityConsumed } = item;
    
                // Use a Read Transaction and only return the necessary properties
                const result: QueryResult<RecordShape> | undefined = await session?.executeRead(
                    (tx: ManagedTransaction) =>
                        tx.run(upgradeCardDataCypher,
                            { userName, cardUri, uri, id }
                        )
                );
    
                if (result && result.records.length > 0) {
                    const record = result.records[0];
                    card = record.get("Card").properties;
                    const cardUpgrade: StoreCardUpgradeData = record.get("CardUpgrade").properties;
    
                    // Subtract quantityConsumed from the quantity property
                    const remainingQuantity = cardUpgrade.quantity - quantityConsumed;
                    if (remainingQuantity < 0) {
                        throw new Error("Quantity consumed exceeds available quantity.");
                    }
                    cardUpgrade.quantity = remainingQuantity;
                    const cardUpgradeItemtoDB = { id, uri, remainingQuantity };
                    // Multiply the experience by the quantity consumed
                    cardUpgrade.experience *= quantityConsumed;
                    cardUpgradeUpdate.push(cardUpgradeItemtoDB)
                    cardUpgradeItem.push(cardUpgrade);
                }
            }

            if (!card) {
                throw new ValidationError("Card not found", "Card not found");
            }
    
            const { level, experience, id } = card as CardMetaData;
    
            // Calculate total experience gained from all card upgrade items
            let experienceGain: number = cardUpgradeItem.reduce((total, item) => total + item.experience, 0);
    
            // Calculate total card experience by adding the gained experience to the current experience
            let cardExperience: number = parseInt(experience) + experienceGain;
            let cardLevel: number = parseInt(level);
    
            // Calculate the required experience for the current card level
            let cardExperienceRequired: number = await this.getRequiredCardExperience(cardLevel);
    
            // Continue leveling up until the required experience is met
            while (cardExperience >= cardExperienceRequired) {
                cardExperience -= cardExperienceRequired;
                const levelUp = await this.levelUp(cardLevel);
                const { newLevel, requiredExp } = levelUp;
                cardLevel = newLevel;
                cardExperienceRequired = requiredExp;
            }

            const stringLevel: string = JSON.stringify(cardLevel)
            const stringExperience: string = JSON.stringify(cardExperience)
            const newMetadata = { ...card, level: stringLevel, experience: stringExperience}
           
            await this.updateCardMetaDataChain(id, newMetadata, userName)
            await this.updateCardMetaDataDB(userName, newMetadata)
            
            return new SuccessMessage("Card Upgrade successful");
        } catch (error: any) {
            throw error;
        }
    }
    
    private async getRequiredCardExperience(level: number): Promise<number> {
        return Math.round(Math.pow(level, 1.8) + level * 4);
    }

    private async levelUp(cardLevel : number) {
        cardLevel += 1
        const requiredExp = await this.getRequiredCardExperience(cardLevel + 1);
        return { newLevel: cardLevel, requiredExp }
    }

    private async updateCardMetaDataChain(tokenId: string, newMetadata: CardMetaData, userName: string) {
        const session: Session | undefined = this.driver?.session();
        try {
            // Fetch wallet data and password from the database
            const result: QueryResult = await session.executeRead(tx =>
                tx.run('MATCH (u:User {username: $userName}) RETURN u.localWallet as localWallet, u.localWalletKey as localWalletKey', { userName })
            );
            await session.close()
            const walletData: string = result.records[0].get('localWallet');
            const password: string = result.records[0].get('localWalletKey');
            
            // Import local wallet
            const localWallet: LocalWalletNode = new LocalWalletNode({ chain: CHAIN });
            await localWallet.import({
                encryptedJson: walletData,
                password: password,
            });
    
            // Connect the smart wallet
            const smartWallet: SmartWallet = new SmartWallet(SMART_WALLET_CONFIG);
            await smartWallet.connect({
                personalWallet: localWallet,
            });
    
            // Use the SDK normally
            const sdk: ThirdwebSDK = await ThirdwebSDK.fromWallet(smartWallet, CHAIN, {
                secretKey: SECRET_KEY,
            });

            const metadata = { newMetadata }
    
            // Update metadata using ERC1155 contract
            const edition: Edition = await sdk.getContract(EDITION_ADDRESS, "edition");
            await edition.erc1155.updateMetadata(tokenId, metadata);
            
        await this this.updateCardUpgradeChain
        } catch(error: any) {
            // Handle errors appropriately, e.g., log or throw custom errors
            console.error("Error updating card metadata:", error);
            throw error;
        }
    }

    private async updateCardMetaDataDB(userName: string, newMetadata: CardMetaData) {
        try {
            const session: Session | undefined = this.driver?.session();
            const { uri } = newMetadata;
            await session.executeWrite(tx =>
                tx.run(`
                    MATCH (u:User {username: $userName})-[:OWNED]->(c:Card {uri: $uri})
                    SET c += $newMetadata`, 
                    { userName, uri, newMetadata }
                )
            );

            await session.close()
        } catch(error: any) {
            throw error;
        }
    }

    private async updateCardUpgradeChain(tokenId: string, walletData: string, password: string) {
        try {

            // Import local wallet
            const localWallet: LocalWalletNode = new LocalWalletNode({ chain: CHAIN });
            await localWallet.import({
                encryptedJson: walletData,
                password: password,
            });
    
            // Connect the smart wallet
            const smartWallet: SmartWallet = new SmartWallet(SMART_WALLET_CONFIG);
            await smartWallet.connect({
                personalWallet: localWallet,
            });

                        // Use the SDK normally
            const sdk: ThirdwebSDK = await ThirdwebSDK.fromWallet(smartWallet, CHAIN, {
                secretKey: SECRET_KEY,
            });

            const metadata = { newMetadata }
    
            // Update metadata using ERC1155 contract
            const edition: Edition = await sdk.getContract(EDITION_ADDRESS, "edition");
            await edition.erc1155.burn();

        } catch(error: any) {

        }

    }
    
    

}

export default UpgradeService