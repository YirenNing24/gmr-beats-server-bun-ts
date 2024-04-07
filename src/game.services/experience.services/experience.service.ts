//** MEMGRAPH DRIVER AND TYPES
import { Driver, ManagedTransaction, QueryResult, Session } from "neo4j-driver";

//** ERROR CODES
import ValidationError from '../../outputs/validation.error'

//** TYPE INTERFACES
import { UserData } from "../../user.services/user.service.interface";
import { PlayerStats,  LevelUpResult } from "./experience.interface";

//** CYPHER IMPORT
import { saveUserDetails } from "./experience.cypher";

class ExperienceService {

driver?: Driver;

constructor(driver?: Driver) {
    this.driver = driver;
}
    //Calculates the experience gain for a user based on their accuracy and experience needed for the next level.
    public async calculateExperienceGain(userName: string, accuracy: number, experienceRequired: number): Promise<LevelUpResult> {
        try {
            // Retrieve user details
            const user = await this.getUserDetails(userName);
            const { playerStats } = user.properties;
            
            // Calculate experience gain
            const baseExperienceGain: number = Math.floor(10 * Math.pow(playerStats.level, 1.8));
            let adjustedExperienceGain: number = baseExperienceGain * (accuracy / 100);
            const minExperienceGain: number = Math.floor(experienceRequired * 0.05);
            const maxExperienceGain: number = Math.floor(experienceRequired * 0.2);
            adjustedExperienceGain = Math.max(minExperienceGain, Math.min(maxExperienceGain, adjustedExperienceGain));

            const experienceGained: number = Math.floor(adjustedExperienceGain);

            // Generate the experience and return the result
            const result: LevelUpResult = await this.generateExperience(userName, experienceGained, playerStats);
            return result;
            
        } catch (error: any) {
            console.error("Error calculating experience gain:", error);
            throw error;
        }
    }

    //Generates experience for a user, updating their level and experience points accordingly.
    public async generateExperience(userName: string, experienceGained: number, stats: PlayerStats): Promise<LevelUpResult> {
        try {
            const { level, playerExp } = stats;
            let currentLevel = level;
            let currentExperience = playerExp + experienceGained;
    
            // Loop until all experience is consumed
            while (currentExperience >= 50 * Math.pow(currentLevel, 2.5)) {
                // Subtract required experience for the current level
                currentExperience -= 50 * Math.pow(currentLevel, 2.5);
                // Increment level
                currentLevel++;
            }
    
            // Check if the player leveled up and adjust current experience
            if (currentExperience > 0 && currentLevel > level) {
                currentExperience = experienceGained;
            } else {
                currentExperience += experienceGained;
            }
            
            // Update user statistics and save details
            stats.level = currentLevel;
            stats.playerExp = currentExperience;
            await this.saveUserDetails(userName, stats);
    
            // Return the updated level and experience
            return { currentLevel, currentExperience };
        } catch (error: any) {
            console.error("Error generating experience:", error);
            throw error;
        }
    }
    //Retrieves details of a user  based on the provided username.
    private async getUserDetails(userName: string): Promise<UserData> {
        const session: Session | undefined = this.driver?.session();

        try {
            // Find the user node within a Read Transaction
            const result: QueryResult | undefined = await session?.executeRead((tx: ManagedTransaction) =>
                tx.run('MATCH (u:User {username: $userName}) RETURN u', { userName })
            );

            if (!result || result.records.length === 0) {
                throw new ValidationError(`User with username '${userName}' not found.`, "");
            }

            return result.records[0].get('u');
        } finally {
            await session?.close();
        }
    }
    //Saves the details of a user, including player statistics, in the database.
    private async saveUserDetails(userName: string, playerStats: PlayerStats): Promise<void> {
        
        try {
            const session: Session | undefined = this.driver?.session();
            // Find the user node within a Read Transaction
            const result: QueryResult | undefined = await session?.executeWrite((tx: ManagedTransaction) =>
                tx.run(saveUserDetails, { userName, playerStats })
            );
            await session?.close();
            if (!result || result.records.length === 0) {
                throw new ValidationError(`User with username '${userName}' not found.`, "");
            }

        } catch(error: any) {
            console.error("Error saving user details:", error);
            throw error
        }
    }
}
    

export default ExperienceService