//** ELYSIA TYPE VALIDATION IMPORT
import { t } from "elysia";


export const inventoryCardDataSchema = {
    headers: t.Object({ authorization: t.String() }),
    // body: t.Object({
    //     slotEquipment: t.Object({
    //         IveEquip: t.Record(t.String(), t.Object({ Equipped: t.Boolean(), Item: t.String() }))
    //         })
    //     }),
    //     inventoryCard: t.Record( t.String(), t.Object({Item: t.Union([ t.Null(), t.String()] )
    //     }
    //     )),

    //     cardsData: t.Record(t.String(), t.Object({  // Fix the missing opening curly brace
    //         uri: t.Object({
    //             name: t.String(),
    //             description: t.String(),
    //             image: t.String(),
    //             id: t.String(),
    //             boostCount: t.String(),
    //             breakthrough: t.String(),
    //             era: t.String(),
    //             experience: t.String(),
    //             experienceRequired: t.String(),
    //             group: t.String(),
    //             healBoost: t.String(),
    //             itemType: t.String(),
    //             level: t.String(),
    //             position: t.String(),
    //             position2: t.String(),
    //             rarity: t.String(),
    //             scoreBoost: t.String(),
    //             skill: t.String(),
    //             slot: t.String(),
    //             stars: t.String(),
    //             supply: t.String(),
    //             tier: t.String(),
    //         })
    //     }))
    } 