//** ELYSIA TYPE VALIDATION IMPORT
import { t } from "elysia";

export const uploadDpBufferSchema = { 
    headers: t.Object({ authorization: t.String() }), body: t.Object({
        bufferData: t.Array(t.Number())
    })
}

export const newStatPointsSchema = {
    headers: t.Object({ authorization: t.String() }), 
    body: t.Object({ 
        mainVocalist: t.Number(),
        rapper: t.Number(),
        leadDancer: t.Number(),
        leadVocalist: t.Number(),
        mainDancer: t.Number(),
        visual: t.Number(),
        leadRapper: t.Number(),
        username: t.String()
    })
}