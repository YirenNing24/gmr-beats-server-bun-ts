//** MEMGRAPH DRIVER AND TYPES
import { Driver, ManagedTransaction, QueryResult, RecordShape, Session } from "neo4j-driver";

//** ERROR CODES
import ValidationError from '../../outputs/validation.error'

//** IMPORTED SERVICES
import WalletService from "../../user.services/wallet.services/wallet.service";

//** TYPE INTERFACES
import { ClassicScoreStats } from "../leaderboard.services/leaderboard.interface";
import { UserData } from "../../user.services/user.service.interface";

//** THIRDWEB IMPORTS
import { NFTCollection, ThirdwebSDK, Token } from "@thirdweb-dev/sdk";

//** CONFIGS
import { BEATS_TOKEN, CHAIN, PRIVATE_KEY, SECRET_KEY, SOUL_ADDRESS } from "../../config/constants";

//** SERVICE IMPORTS
import TokenService from "../../user.services/token.services/token.service";
import { CardMetaData } from "../inventory.services/inventory.interface";
import { SoulMetaData } from "../profile.services/profile.interface";

interface CardOwned {
    name: string;
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

            console.log(response);

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

    public async getCardOwnershipReward(token: string, cardName: CardOwned) {
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

            // Filter out cards whose names are in the soul's ownership array
            const cards = result?.records.map(record => {
                const { name, id } = record.get('Card').properties;
                return { name, id } as { name: string, id: string };
            }).filter(card => !soul?.ownership?.includes(card.name));

            // Check if the card name is in the soul's ownership array and call provideOwnershipReward
            if (soul?.ownership?.includes(name)) {
                await this.provideOwnershipReward(userName, name);
            }

            return { cards, soul };

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
                RETURN cr as CardReward, s as Soul, c as Card, u.smartwalletAddress as smartWalletAddress
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
                const updatedOwnership = [...soul.ownership, cardName];

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
            await edition.erc721.updateMetadata(soulMetadata.id, metadata);

        } catch (error: any) {
            throw error;
        }
    }
}

export default RewardService;
