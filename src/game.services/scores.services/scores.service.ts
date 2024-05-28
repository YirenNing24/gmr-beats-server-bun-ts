//** IMPORTED TYPES
import { Driver, ManagedTransaction, QueryResult, Session } from "neo4j-driver";
import { ClassicScoreStats } from "../leaderboard.services/leaderboard.interface";


//** IMPORTED SERVICES
import TokenService from "../../user.services/token.services/token.service";
import RewardService from "../rewards.services/rewards.service";
import { SuccessMessage } from "../../outputs/success.message";

class ScoreService {

    driver?: Driver;
    constructor(driver?: Driver) {
        this.driver = driver;
    }   

    //* CLASSIC GAME MODE SAVE FUNCTION
    public async saveScoreClassic(score: ClassicScoreStats, token: string): Promise<SuccessMessage> {
        try {
            const tokenService: TokenService = new TokenService();
            const rewardService: RewardService = new RewardService();
            const userName: string = await tokenService.verifyAccessToken(token);


            const songName: string = toPascalCase(score.songName);

            const session: Session | undefined = this.driver?.session();
            const result: QueryResult | undefined = await session?.executeRead((tx: ManagedTransaction) =>
                 tx.run(`MATCH (s:$songName)
                         RETURN s as Song LIMIT 1`, { songName })
            );

            const result2 = await session?.executeWrite((tx: ManagedTransaction) => 
                tx.run(`MATCH (u:User {username: $userName})
                        CREATE (s:$songName)
                        CREATE (u)-[:SCORE]->(s)
                        SET s += $score
                        RETURN u.smartWalletAddress as smartWalletAddress`, { songName, score, userName}))
            await session?.close();
            const smartWalletAddress: string = result2?.records[0].get("smartWalletAddress");
            if (result?.records.length === 0) {
                rewardService.firstScorer(userName, score.songName, smartWalletAddress, score.artist);
            };

            return new SuccessMessage("Score saved")
        } catch (error: any) {
            throw error;
        }
    }
    
    //* CLASSIC GAME MODE RETRIEVE SCORE FUNCTION
    public async getHighScoreClassic(token: string): Promise<ClassicScoreStats[]> {
        try {

            const tokenService: TokenService = new TokenService();
            const username: string = await tokenService.verifyAccessToken(token);
            
            const session: Session | undefined = this.driver?.session();
            const result: QueryResult | undefined = await session?.executeRead((tx: ManagedTransaction) =>
                tx.run(`
                    MATCH (u:User {username: $username})-[:CLASSIC]->(s:Score)<-[:HIGHSCORE]-(u2:User {username: $username})
                    RETURN s
                `, { username })
            );
            await session?.close();
    
            const classicScoreStats: ClassicScoreStats[] | undefined = result?.records.map(record => record.get('s').properties);

            return classicScoreStats as ClassicScoreStats[];
        } catch (error: any) {
            throw error;
        }
    }
}

export default ScoreService;


const toPascalCase = (str: string): string => {
    return str
        .toLowerCase()
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join('');
}