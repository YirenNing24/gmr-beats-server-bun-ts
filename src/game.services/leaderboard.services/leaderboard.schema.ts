import { t } from "elysia";

export const classicScoreStatsSchema = {
    headers: t.Object({ 
        authorization: t.String() }), 
    body: t.Object({
        difficulty: t.String(),
        score: t.Number(),
        combo: t.Number(),
        maxCombo: t.Number(),
        accuracy: t.Number(),
        finished: t.Boolean(),
        songName: t.String(),
        artist: t.String(),
        perfect: t.Number(),
        veryGood: t.Number(),
        good: t.Number(),
        bad: t.Number(),
        miss: t.Number()
    })

};

