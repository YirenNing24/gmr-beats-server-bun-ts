//** MEMGRAPH DRIVER AND TYPES
import { Driver, ManagedTransaction, QueryResult, RecordShape, Session } from "neo4j-driver";

//** ERROR CODES
import ValidationError from '../errors/validation.error'

//** IMPORTED SERVICES
import WalletService from "../user.services/wallet.service";

//** TYPE INTERFACES
import { CardInventoryOpen, ClassicScoreStats } from "./game.services.interfaces";

//** THIRDWEB IMPORTS
import { ThirdwebSDK, Token } from "@thirdweb-dev/sdk";

//** CONFIGS
import { SECRET_KEY } from "../config/constants";


class RewardsService {
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

  public async generateClassicReward(userName: string, scoreStats: ClassicScoreStats) {

    try {
    const { highscore, difficulty, score, finalStats, noteStats } = scoreStats;

    // Example logic for reward generation based on different factors
    let rewardAmount = 0;

    // Highscore bonus
    if (highscore) {
      rewardAmount += 50; // Adjust as needed
    }

    // Score-based reward
    rewardAmount += Math.floor(score / 1000); // Adjust as needed

    // Difficulty multiplier
    const difficultyMultiplier: number = await this.getDifficultyMultiplier(difficulty);
    rewardAmount *= difficultyMultiplier;

    // Combo bonus
    rewardAmount += Math.floor(finalStats.combo / 10); // Adjust as needed

    // Accuracy bonus
    rewardAmount += Math.floor(finalStats.accuracy / 5); // Adjust as needed

    // Note-specific rewards
    rewardAmount += noteStats.perfect * 2;
    rewardAmount += noteStats.veryGood;
    rewardAmount += noteStats.good;

    // Example: Save the reward amount to the user's wallet in the database
    await this.getWalletAddress(userName, rewardAmount);
    
      } catch(error: any) {
          throw error
    }
  }

  private async getDifficultyMultiplier(difficulty: string): Promise<number>{
    // Example: Assign multipliers based on difficulty
    switch (difficulty) {
      case 'easy':
        return 0.5;
      case 'normal':
        return 1.0;
      case 'hard':
        return 1.5;
      default:
        return 1.0;
    }
  }

  private async getWalletAddress(userName: string, rewardAmount: number): Promise<string> {
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
  
      // Retrieve the required properties directly from the query result
      const { localWallet, localWalletKey } = result?.records[0].toObject() as CardInventoryOpen;
  
      // Return wallet address
      const walletService: WalletService = new WalletService();
      const walletAddress: string = await walletService.getWalletAddress(localWallet, localWalletKey);
  
      // Send rewards directly
      await this.sendRewards(walletAddress, rewardAmount);
  
      return walletAddress;
    } catch (error: any) {
      throw error;
    }
  }
  
  private async sendRewards(walletAddress: string, rewardAmount: number): Promise<void> {
    try {
      const sdk: ThirdwebSDK = new ThirdwebSDK("mumbai", {
        secretKey: SECRET_KEY,
      });
  
      const contract: Token = await sdk.getContract("0x63F8Cb0ffc1DeB782E84B9C68b2F85260fbd497d", "token");
  
      await contract.erc20.transfer(walletAddress, rewardAmount);
    } catch (error: any) {
      throw error;
    }
  }
  
}



export default RewardsService