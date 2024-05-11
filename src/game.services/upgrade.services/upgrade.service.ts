

//** MEMGRAPH DRIVER
import { Driver, QueryResult, Session,  ManagedTransaction, RecordShape } from 'neo4j-driver-core'

//** IMPORTED SERVICES
import TokenService from "../../user.services/token.services/token.service";

//** TYPE INTERFACES
import { CanLevelUp, UpgradeCardData } from './upgrade.interface';
import { CardMetaData } from '../inventory.services/inventory.interface';

//** CYPHER IMPORT
import { upgradeCardDataCypher } from './upgrade.cypher';

//** VALIDATION ERROR IMPORT
import ValidationError from '../../outputs/validation.error';

//** SUCCESS MESSAGE IMPORT
import { SuccessMessage } from '../../outputs/success.message';





class UpgradeService {
    driver: Driver
    constructor(driver: Driver) {
      this.driver = driver
      }

    public async upgradeCard(token: string, upgradeCardData: UpgradeCardData): Promise<SuccessMessage> {
        try {
            const tokenService: TokenService = new TokenService();
            const userName: string = await tokenService.verifyAccessToken(token);

            const { uri, upgradeItemUri } = upgradeCardData as UpgradeCardData
            const session: Session | undefined = this.driver?.session();
            // Use a Read Transaction and only return the necessary properties
            const result: QueryResult<RecordShape> | undefined = await session?.executeRead(
              (tx: ManagedTransaction) =>
                tx.run(upgradeCardDataCypher, { userName, uri }
                )
            );

            await session?.close();
  
            // If no records found, return validation error
            if (!result || result.records.length === 0) {
                throw new ValidationError(`Not found.`, "not found");
            }
    
            // Extract the card data
            const cardData: CardMetaData = result.records[0].get("c");
            await this.calculateUpgrade(cardData)

        return new SuccessMessage("Upgrade success")
        } catch(error: any) {
            console.error(error)
            throw error
        }

    }

    private async calculateUpgrade(cardData: CardMetaData): Promise<CanLevelUp> {
        try {
            const { level, currentExperience } = cardData as CardMetaData;
    
            // Define the exp_per_level array
            const exp_per_level: number[] = Array.from({length: 101}, (_, i) => 10 * (i**2 - i) / 2);
    
            // Convert level from string to number
            const currentLevel: number = parseInt(level, 10);
    
            // Get the required experience points for the next level
            const requiredExpForNextLevel: number = exp_per_level[currentLevel];
    
            // Check if the card can level up
            const canLevelUp: boolean = parseInt(currentExperience) >= requiredExpForNextLevel;
    
            // Return an object indicating whether the card leveled up or not
            return { levelUp: canLevelUp } as CanLevelUp
        } catch(error: any) {
            throw error;
        }
    }


    public async cardGainExperience(token: string, upgradeCardData: any) {
        const tokenService: TokenService = new TokenService();
        const userName: string = await tokenService.verifyAccessToken(token);
        try {




            const cardExperienceRequired =  await this.getRequiredCardExperience()

        } catch(error: any) {

        }
    }



    private async getRequiredCardExperience(level: number): Promise<number> {
        return Math.round(Math.pow(level, 1.8) + level * 4);
    }

}

export default UpgradeService