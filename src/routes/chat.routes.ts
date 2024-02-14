//** ELYSIA IMPORT
import Elysia from "elysia"

//** JWT IMPORT
import jwt, { JwtPayload } from 'jsonwebtoken'

//** CHAT SERVICE IMPORT
import ChatService from "../chat.services/chat.socket.service"
import { insertChats } from "../chat.services/chat.socket.service"
import { NewMessage } from "../chat.services/chat.interface"

//** SERVER TIME SERVICE IMPORT
import TimeService from "../game.services/time.service"

//** CONFIG IMPORT
import { JWT_SECRET } from "../config/constants"


 const chat = (app: Elysia): void => {
   app.ws('/api/ws', { 
    async open(ws) {
        //@ts-ignore
        const room: string = 'all'
        const authorizationHeader: string = ws.data.headers.authorization || ""
        if (!authorizationHeader || !authorizationHeader.startsWith('Bearer ')) {
          // ws?.close()
        }

        const jwtToken: string = authorizationHeader.substring(7);
        const decodedToken: string |JwtPayload = jwt.verify(jwtToken, JWT_SECRET)
        const { userName } = decodedToken as { userName: string };

        //@ts-ignore
        const chatService: ChatService = new ChatService(ws)
        chatService.chatRoom(room, userName)
        ws?.subscribe('all')
        },
    async message(ws, message) {
      const newMessage: any = message as NewMessage
      
      newMessage?.roomId && await insertChats(newMessage);
      //@ts-ignore
      const timeService: TimeService = new TimeService(ws)
      newMessage?.timestamp && await timeService.getServerDateTime(newMessage)
    }
    })
};

 export default chat;