//** MEMGRAPH DRIVER AND TYPES
import { Driver, ManagedTransaction, QueryResult, RecordShape, Session } from "neo4j-driver";

//** ERROR CODES
import ValidationError from '../../outputs/validation.error'

//** THIRDWEB IMPORTS
import { Edition, NFTCollection, ThirdwebSDK, Token } from "@thirdweb-dev/sdk";

//** CONFIGS
import { BEATS_TOKEN, CHAIN, PRIVATE_KEY, SECRET_KEY, SOCIAL_BADGES_ADDRESS, SOUL_ADDRESS } from "../../config/constants";

//** SERVICE IMPORTS
import TokenService from "../../user.services/token.services/token.service";
import { CardMetaData } from "../inventory.services/inventory.interface";
import { SoulMetaData } from "../profile.services/profile.interface";
import { SuccessMessage } from "../../outputs/success.message";

interface CardOwned {
    name: string;
}

interface AnimalMatch {
    animal: string;
}

class RewardService {

    driver?: Driver;
    constructor(driver?: Driver) {
        this.driver = driver;
    }

    public async getAvailableCardReward(token: string) {
        const tokenService: TokenService = new TokenService();
        const userName: string = await tokenService.verifyAccessToken(token);

        let session: Session | undefined;

        try {
            session = this.driver?.session();

            const getCardRewardNodeCypher = `
                MATCH (u:User {username: $userName})-[:EQUIPPED|INVENTORY]->(c:Card)
                OPTIONAL MATCH (u)-[:SOUL]->(s:Soul)
                OPTIONAL MATCH (c)-[:REWARD]->(cr:CardReward)
                RETURN cr as CardReward, s as Soul, c as Card
            `;

            const result: QueryResult<RecordShape> | undefined = await session?.executeRead(
                (tx: ManagedTransaction) =>
                    tx.run(getCardRewardNodeCypher, { userName })
            );

            if (!result) {
                return [];
            }

            // Extract soul
            const soulNode = result.records.length > 0 ? result.records[0].get('Soul') : null;
            const soul: SoulMetaData = soulNode ? soulNode.properties : null;

            // Filter out cards whose names are in the soul's ownership array
            const cards = result.records.map(record => {
                const { name, id } = record.get('Card').properties;
                return { name, id } as { name: string, id: string };
            }).filter(card => !soul?.ownership?.includes(card.name));

            // Extract rewards
            const rewards = result.records.map(record => {
                const rewardNode = record.get('CardReward');
                return rewardNode ? rewardNode.properties : null;
            }).filter(reward => reward !== null);

            // Construct the final result
            const response = {
                cards,
                rewards,
                soul
            };
            //@ts-ignore
            return response;
        } catch (error: any) {
            console.error(error);
            throw error;
        } finally {
            if (session) {
                await session.close();
            }
        }
    }

    public async ClaimCardOwnershipReward(token: string, cardName: CardOwned) {
        const tokenService: TokenService = new TokenService();
        const userName: string = await tokenService.verifyAccessToken(token);

        let session: Session | undefined;

        try {
            const { name } = cardName;

            session = this.driver?.session();
            const getCardRewardNodeCypher = `
                MATCH (u:User {username: $userName})-[:EQUIPPED|INVENTORY]->(c:Card {name: $name})
                OPTIONAL MATCH (u)-[:SOUL]->(s:Soul)
                OPTIONAL MATCH (c)-[:REWARD]->(cr:CardReward)
                RETURN cr as CardReward, s as Soul, c as Card
            `;

            const result: QueryResult<RecordShape> | undefined = await session?.executeRead(
                (tx: ManagedTransaction) =>
                    tx.run(getCardRewardNodeCypher, { userName, name })
            );

            if (!result || result.records.length === 0) {
                throw new ValidationError("No matches found", "No matches found");
            }

            // Extract soul
            const soulNode = result?.records?.length > 0 ? result?.records[0].get('Soul') : null;
            const soul: SoulMetaData = soulNode ? soulNode.properties : null;

            // Check if the card name is in the soul's ownership array and call provideOwnershipReward
            if (!soul?.ownership?.includes(name)) {
                await this.provideOwnershipReward(userName, name); 
            }

            return new SuccessMessage("Rewards received")
        } catch (error: any) {
            console.error(error);
            throw error;
        } finally {
            if (session) {
                await session.close();
            }
        }
    }

    private async provideOwnershipReward(userName: string, cardName: string) {
        const session: Session | undefined = this.driver?.session();
        try {
            const getCardRewardNodeCypher = `
                MATCH (u:User {username: $userName})-[:EQUIPPED|INVENTORY]->(c:Card {name: $cardName})
                OPTIONAL MATCH (u)-[:SOUL]->(s:Soul)
                OPTIONAL MATCH (c)-[:REWARD]->(cr:CardReward)
                RETURN cr as CardReward, s as Soul, c as Card, u.smartWalletAddress as smartWalletAddress
            `;

            const result: QueryResult<RecordShape> | undefined = await session?.executeRead(
                (tx: ManagedTransaction) =>
                    tx.run(getCardRewardNodeCypher, { userName, cardName })
            );

            if (!result || result.records.length === 0) {
                throw new ValidationError("No matches found", "No matches found");
            }

            // Extract soul and smartWalletAddress
            const soulNode = result.records[0].get('Soul');
            if (!soulNode) {
                throw new ValidationError("No Soul node found", "No Soul node found");
            }

            const soul: SoulMetaData = soulNode.properties;
            const smartWalletAddress: string = result.records[0].get('smartWalletAddress');

            if (Array.isArray(soul.ownership)) {
                // Add the cardName to the ownership array
                const updatedOwnership: string[] = [...soul.ownership, cardName];

                // Update the Soul node with the new ownership array
                const updateOwnershipCypher = `
                    MATCH (u:User {username: $userName})-[:SOUL]->(s:Soul)
                    SET s.ownership = $updatedOwnership
                `;

                await session?.executeWrite(
                    (tx: ManagedTransaction) =>
                        tx.run(updateOwnershipCypher, { userName, updatedOwnership })
                );

                await this.sendRewardToken(smartWalletAddress, soul, updatedOwnership);
            } else {
                throw new ValidationError("Invalid ownership data", "Invalid ownership data");
            }

        } catch (error: any) {
            console.error(error);
            throw error;
        } finally {
            if (session) {
                await session.close();
            }
        }
    }

    private async sendRewardToken(smartWalletAddress: string, soulMetadata: SoulMetaData, ownership: string[]) {
        try {
            const sdk: ThirdwebSDK = ThirdwebSDK.fromPrivateKey(PRIVATE_KEY, CHAIN, {
                secretKey: SECRET_KEY,
            });

            const beats: Token = await sdk.getContract(BEATS_TOKEN, "token");
            await beats.erc20.transfer(smartWalletAddress, 100);

            const metadata = { ...soulMetadata, ownership };
            const edition: NFTCollection = await sdk.getContract(SOUL_ADDRESS, "nft-collection");

            //@ts-ignore
            await edition.erc721.updateMetadata(soulMetadata.id, metadata);

            const ownershipBadge = await sdk.getContract(SOCIAL_BADGES_ADDRESS, "edition");

            const tokenId: string = "0"
            const tokenAmount: string = "1"
            ownershipBadge.transfer(smartWalletAddress, tokenId, tokenAmount);

        } catch (error: any) {
            throw error;
        }
    }

    public async provideHoroscopeReward(token: string, cardName: CardOwned): Promise<SuccessMessage> {
        const tokenService: TokenService = new TokenService();
        const userName: string = await tokenService.verifyAccessToken(token);
    
        let session: Session | undefined;
    
        try {
            const { name } = cardName;
            session = this.driver?.session();
    
            const getCardRewardNodeCypher = `
                MATCH (u:User {username: $userName})-[:EQUIPPED|INVENTORY]->(c:Card {name: $name})
                OPTIONAL MATCH (u)-[:SOUL]->(s:Soul)
                RETURN s as Soul, c as Card
            `;
    
            const result: QueryResult<RecordShape> | undefined = await session?.executeRead(
                (tx: ManagedTransaction) =>
                    tx.run(getCardRewardNodeCypher, { userName, name })
            );
    
            if (!result || result.records.length === 0) {
                throw new ValidationError("No match found", "No match found");
            };
    
            // Extract soul
            const soulNode = result.records.length > 0 ? result.records[0].get('Soul') : null;
            const soul: SoulMetaData = soulNode ? soulNode.properties : null;
    
            const cards: CardMetaData[] = result.records.map(record => {
                const { zodiac, name } = record.get('Card').properties as CardMetaData;
                return { zodiac, name } as CardMetaData;
            });
    
            // Check for horoscope match and provide reward if necessary
            for (const card of cards) {
                if (soul?.horoscope === card.zodiac && (!soul.horoscopeMatch || !soul.horoscopeMatch.includes(card.name))) {
                    await this.provideHoroscopeRewardToUser(userName, card.name);
                    break;  // Exit loop after providing the reward for one matching card
                }
            }
            return new SuccessMessage("Horoscope reward received");
        } catch (error: any) {
            console.error(error);
            throw error
        } finally {
            if (session) {
                await session.close();
            }
        }
    }
    
    private async provideHoroscopeRewardToUser(userName: string, cardName: string) {
        const session: Session | undefined = this.driver?.session();
        try {
            const getHoroscopeRewardNodeCypher = `
                MATCH (u:User {username: $userName})-[:EQUIPPED|INVENTORY]->(c:Card {name: $cardName})
                OPTIONAL MATCH (u)-[:SOUL]->(s:Soul)
                OPTIONAL MATCH (c)-[:REWARD]->(cr:CardReward)
                RETURN cr as CardReward, s as Soul, c as Card, u.smartWalletAddress as smartWalletAddress
            `;
    
            const result: QueryResult<RecordShape> | undefined = await session?.executeRead(
                (tx: ManagedTransaction) =>
                    tx.run(getHoroscopeRewardNodeCypher, { userName, cardName })
            );
    
            if (!result || result.records.length === 0) {
                throw new ValidationError("No matches found", "No matches found");
            }
    
            // Extract soul and smartWalletAddress
            const soulNode = result.records[0].get('Soul');
            if (!soulNode) {
                throw new ValidationError("No Soul node found", "No Soul node found");
            }
    
            const soul: SoulMetaData = soulNode.properties;
            const smartWalletAddress: string = result.records[0].get('smartWalletAddress');
    
            if (Array.isArray(soul.horoscopeMatch)) {
                // Add the cardName to the horoscopeMatch array
                const updatedhoroscopeMatch: string[] = [...soul.horoscopeMatch, cardName];
    
                const updateHoroscopeCypher = `
                    MATCH (u:User {username: $userName})-[:SOUL]->(s:Soul)
                    SET s.horoscopeMatch = $updatedhoroscopeMatch
                `;
    
                await session?.executeWrite(
                    (tx: ManagedTransaction) =>
                        tx.run(updateHoroscopeCypher, { userName, updatedhoroscopeMatch })
                );
    
                await this.sendRewardHoroscope(smartWalletAddress, soul, updatedhoroscopeMatch);
            } else {
                throw new ValidationError("Invalid horoscopeMatch data", "Invalid horoscopeMatch data");
            }
        } catch (error: any) {
            console.error(error);
            throw error;
        } finally {
            if (session) {
                await session.close();
            }
        }
    }
    
    private async sendRewardHoroscope(smartWalletAddress: string, soulMetadata: SoulMetaData, updatedhoroscopeMatch: string[]) {
        try {
            const sdk: ThirdwebSDK = ThirdwebSDK.fromPrivateKey(PRIVATE_KEY, CHAIN, {
                secretKey: SECRET_KEY,
            });
    
            const beats: Token = await sdk.getContract(BEATS_TOKEN, "token");
            await beats.erc20.transfer(smartWalletAddress, 250);
    
            const metadata = { ...soulMetadata, horoscopeMatch: updatedhoroscopeMatch };
            const edition: NFTCollection = await sdk.getContract(SOUL_ADDRESS, "nft-collection");

            //@ts-ignore
            await edition.erc721.updateMetadata(soulMetadata.id, metadata);

            const zodiacMatchBadge: Edition = await sdk.getContract(SOCIAL_BADGES_ADDRESS, "edition");
            const tokenId: string = "1"
            const tokenAmount: string = "1"
            zodiacMatchBadge.transfer(smartWalletAddress, tokenId, tokenAmount);
    
        } catch (error: any) {
            throw error;
        }
    }

    public async provideAnimalReward(token: string, animalMatch: AnimalMatch) {
        const tokenService: TokenService = new TokenService();
        const userName: string = await tokenService.verifyAccessToken(token);

        

        let session: Session | undefined;
        try {

            const { animal } = animalMatch;
            session = this.driver?.session();

            const getCardRewardNodeCypher = `
            MATCH (u:User {username: $userName})-[:EQUIPPED|INVENTORY]->(c:Card {animal: $animal})
            OPTIONAL MATCH (u)-[:SOUL]->(s:Soul)
            RETURN s as Soul, c as Card
        `;

        const result: QueryResult<RecordShape> | undefined = await session?.executeRead(
            (tx: ManagedTransaction) =>
                tx.run(getCardRewardNodeCypher, { userName, animal })
        );

        if (!result || result.records.length === 0) {
            throw new ValidationError("No match found", "No match found");
        };

        // Extract soul
        const soulNode = result.records.length > 0 ? result.records[0].get('Soul') : null;
        const soul: SoulMetaData = soulNode ? soulNode.properties : null;

        const cards: CardMetaData[] = result.records.map(record => {
            const { animal, name } = record.get('Card').properties as CardMetaData;
            return { animal, name } as CardMetaData;
        });




        } catch(error: any) {
            throw error
        }
    }
}

export default RewardService;
