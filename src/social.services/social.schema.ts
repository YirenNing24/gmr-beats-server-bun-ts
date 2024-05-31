//** ELYSIA TYPE VALIDATION IMPORT
import { t } from "elysia";


export const cardGiftSchema = {
    headers: t.Object({ authorization: t.String() }),
    body: t.Object({ 
        cardName: t.String(), 
        id: t.String(), 
        receiver: t.String() })
}


export interface CardGiftData {
    cardName: string
    id: string
    receiver: string
  }