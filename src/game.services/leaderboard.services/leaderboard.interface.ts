/**
 * Represents the statistics of a classic score, including user information, score details, and note statistics.
 *
 * @interface ClassicScoreStats
 * @property {string} username - The username of the player.
 * @property {boolean} highscore - Indicates if the score is a highscore.
 * @property {string} difficulty - The difficulty level of the score.
 * @property {number} score - The score achieved.
 * @property {Object} finalStats - The final statistics of the score.
 * @property {number} finalStats.score - The final score achieved.
 * @property {number} finalStats.combo - The combo achieved during the score.
 * @property {number} finalStats.maxCombo - The maximum combo achieved.
 * @property {number} finalStats.accuracy - The accuracy of the score.
 * @property {string} finalStats.map - The map used for the score.
 * @property {boolean} finalStats.finished - Indicates if the score was completed.
 * @property {string} finalStats.songName - The name of the song for the score.
 * @property {Object} noteStats - The statistics of notes hit during the score.
 * @property {number} noteStats.perfect - The number of perfect notes hit.
 * @property {number} noteStats.veryGood - The number of very good notes hit.
 * @property {number} noteStats.good - The number of good notes hit.
 * @property {number} noteStats.bad - The number of bad notes hit.
 * @property {number} noteStats.miss - The number of missed notes.
 */
export interface ClassicScoreStats {
    username: string;
    highscore: boolean;
    difficulty: string;
    score: number;
    finalStats: {
        score: number;
        combo: number;
        maxCombo: number;
        accuracy: number;
        map: string;
        finished: boolean;
        songName: string;
    };
    noteStats: {
        perfect: number;
        veryGood: number;
        good: number;
        bad: number;
        miss: number;
    };
}

/**
* Represents the request parameters for retrieving classic mode leaderboard.
*
* @interface ClassicLeaderboardRequest
* @property {string} gameMode - The game mode for which the leaderboard is requested.
* @property {string} songName - The name of the song for the leaderboard.
* @property {string} period - The period for which the leaderboard is requested.
* @property {string} difficulty - The difficulty level for the leaderboard.
*/
export interface ClassicLeaderboardRequest {
    gameMode: string;
    songName: string;
    period: string;
    difficulty: string;
   }