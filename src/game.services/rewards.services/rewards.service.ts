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

class RewardService {

driver?: Driver;
constructor(driver?: Driver) {
    this.driver = driver;
}


public async checkAvailableCardReward(token: string) {
	const tokenService: TokenService = new TokenService();
	const userName: string = await tokenService.verifyAccessToken(token);
  
	try {
		const session: Session | undefined = this.driver?.session();

		const getCardRewardNodeCypher = `
			MATCH (u:User {username: $userName})-[:EQUIPPED|INVENTORY]->(c:Card)
			MATCH (r:CardReward)
			OPTIONAL MATCH (u)-[:SOUL]->(s:Soul)-[:CLAIMED]->(r)
			WHERE NOT EXISTS(s)
			RETURN r, c
		`;

		const result: QueryResult<RecordShape> | undefined = await session?.executeRead(
			(tx: ManagedTransaction) =>
				tx.run(getCardRewardNodeCypher, { userName })
		);

		// Process the result to find unclaimed rewards
		const rewards: any = result?.records.map(record => {
			const cardReward = record.get('r').properties;
			const card = record.get('c').properties;
			
			return {
				cardReward,
				card
			};
		}).filter(item => item.cardReward.ownership); // Filter to only return items with ownership property

		await session?.close();
		
		return {
			canClaim: rewards.length > 0,
			rewards
		};

	} catch (error: any) {
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