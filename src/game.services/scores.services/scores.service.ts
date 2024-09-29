//** IMPORTED TYPES
import { Driver } from "neo4j-driver";
import { ClassicScoreStats, ScorePeerId } from "../leaderboard.services/leaderboard.interface";

//** RETHINK DB IMPORT
import rt from "rethinkdb";
import { getRethinkDB } from "../../db/rethink";


//** IMPORTED SERVICES
import TokenService from "../../user.services/token.services/token.service";
import RewardService from "../rewards.services/rewards.service";

import { SuccessMessage } from "../../outputs/success.message";
import { RewardData } from "../rewards.services/reward.interface";


class ScoreService {

    driver?: Driver;
    constructor(driver?: Driver) {
        this.driver = driver;
    }   

    //** BEATS SERVER EXCLUSIVE SERVICE */
    public async saveScoreClassic(score: ClassicScoreStats, apiKey: string): Promise<SuccessMessage> {
        try {
            const tokenService: TokenService = new TokenService();
            const isAuthorized: boolean = await tokenService.verifyApiKey(apiKey);

            if (!isAuthorized) {
                throw new Error("Unauthorized");
            }



            const scoreWithTime = { ...score, timestamp: Date.now() };
            const connection: rt.Connection = await getRethinkDB();

            const rewardService: RewardService = new RewardService();

            const rewardData: RewardData = { songName: score.songName, songRewardType: 'first', type: 'song' };
            const isFirstSongComplete: boolean = await rewardService.checkSongReward(score.username, rewardData);

            console.log(scoreWithTime)

            if (!isFirstSongComplete) {

                const dataReward = {
                    username: score.username,
                    type: rewardData.type,
    
                    songName: score.songName,
                    songRewardType: rewardData.songRewardType,
    
                    rewardName: 'First time completing ' + score.songName,
                };
                rewardService.setMissionReward(score.username, dataReward)
            }

            await rt.db('beats').table('classicScores').insert(scoreWithTime).run(connection);

            return new SuccessMessage("Score saved")
        } catch (error: any) {
            console.log(error)
            throw error;
        }
    }
    

    //* CLASSIC GAME MODE RETRIEVE SCORE FUNCTION
    public async getHighScoreClassic(peerId: ScorePeerId, token: string): Promise<ClassicScoreStats[]> {
        try {
            const tokenService: TokenService = new TokenService();
            await tokenService.verifyAccessToken(token);
    
            const connection: rt.Connection = await getRethinkDB();
            const idPeer: number = parseInt(peerId.peerId)

            const result: rt.Cursor = await rt
                .db('beats')
                .table('classicScores')
                .filter({ peerId: idPeer })
                .run(connection);
    
            const classicScoreStats: ClassicScoreStats[] = await result.toArray();
    
            return classicScoreStats;
        } catch (error: any) {
            throw error;
        }
    }
    

    public async getAllHighScoreClassic(token: string): Promise<ClassicScoreStats[]> {
        try {
            const tokenService: TokenService = new TokenService();
            await tokenService.verifyAccessToken(token);
    
            const connection: rt.Connection = await getRethinkDB();
    
            const result: rt.Cursor = await rt.db('beats')
                .table('classicScores')
                .orderBy(rt.desc('score'))
                .run(connection);
    
            const classicScoreStats: ClassicScoreStats[] = await result.toArray();
    
            await connection.close();
    
            return classicScoreStats;
        } catch (error: any) {
            throw error;
        }
    }
    
    
}

export default ScoreService;


// const toPascalCase = (str: string): string => {
//     return str
//         .toLowerCase()
//         .split(' ')
//         .map(word => word.charAt(0).toUpperCase() + word.slice(1))
//         .join('');
// }