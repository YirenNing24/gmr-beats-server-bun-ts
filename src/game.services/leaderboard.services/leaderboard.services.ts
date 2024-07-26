//** MEMGRAPH DRIVER AND TYPES
import { Driver } from "neo4j-driver";

//** VALIDATION ERROR
import { ClassicScoreStats, LeaderboardQuery } from "./leaderboard.interface";

//** SERVICE IMPORT
import TokenService from "../../user.services/token.services/token.service";

//** RETHINK DB IMPORT
import rt from "rethinkdb";
import { getRethinkDB } from "../../db/rethink";



class LeaderboardService {
	driver?: Driver;
	constructor(driver?: Driver) {
		this.driver = driver;
	}

	public async weeklyLeaderboard(token: string, query: LeaderboardQuery): Promise<ClassicScoreStats[]> {
		//* Weekly is from Monday to Sunday
		try {

			const tokenService: TokenService = new TokenService();
			await tokenService.verifyAccessToken(token);

			const { songName, difficulty } = query;
		
			const now = new Date();
			const dayOfWeek = now.getUTCDay(); // Sunday - Saturday: 0 - 6
			const diffToMonday = (dayOfWeek + 6) % 7; // Calculate how many days to subtract to get to Monday
			const startOfWeek = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - diffToMonday, 0, 0, 0, 0));
			const endOfWeek = new Date(startOfWeek);
			endOfWeek.setUTCDate(startOfWeek.getUTCDate() + 6); // Add 6 days to Monday to get Sunday
			
			const connection: rt.Connection = await getRethinkDB();
			const result: rt.Cursor = await rt.db('beats')
				.table('classicScores')
				.filter(rt.row('songName').eq(songName).and(rt.row('difficulty').eq(difficulty)))
				.run(connection);
	
			const scores: ClassicScoreStats[] = await result.toArray();
			connection.close();
	
			// Filter scores in JavaScript to get only those within the current week
			const weeklyScores = scores.filter(score => {
				const scoreDate = new Date(score.timestamp);
				return scoreDate >= startOfWeek && scoreDate <= endOfWeek;
			});
	
			return weeklyScores;
		
		} catch (error: any) {
			console.log(error);
			throw error;
		}
	}

}

export default LeaderboardService;
