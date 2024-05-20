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
import { ThirdwebSDK, Token } from "@thirdweb-dev/sdk";

//** CONFIGS
import { SECRET_KEY } from "../../config/constants";


//** SERVICE IMPORTS
import TokenService from "../../user.services/token.services/token.service";
import { CardMetaData } from "../inventory.services/inventory.interface";
import { SoulMetaData } from "../profile.services/profile.interface";

class RewardService {

driver?: Driver;
constructor(driver?: Driver) {
    this.driver = driver;
}


public async getAvailableCardReward(token: string) {
    const tokenService: TokenService = new TokenService();
    const userName: string = await tokenService.verifyAccessToken(token);

    try {
        const session: Session | undefined = this.driver?.session();

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

        await session?.close();

        if (!result) {
            return [];
        }

        // Extract soul
        const soulNode = result.records.length > 0 ? result.records[0].get('Soul') : null;
        const soul: SoulMetaData = soulNode ? soulNode.properties : null;

        // Filter out cards whose names are in the soul's ownership array
        const cards = result.records.map(record => {
            const { name, id } = record.get('Card').properties;
            return { name, id } as {name: string, id: string};
        }).filter(card => !soul?.ownership.includes(card.name));

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
    }
}








public async firstCardType(uri: string, tokenId: string) {
  try {


  } catch(error: any) {
    throw error
  }
    
}


  

  
}



export default RewardService