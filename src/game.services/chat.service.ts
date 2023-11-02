import keydb from "../db/keydb.client";
import { SERVER_ID } from "../config/constants";
import { ElysiaWS } from "elysia/ws";
import { ServerWebSocket } from "bun";


class ChatService {

    
    async publish (type: string, data: any) {
        const outgoing = {
            serverId: SERVER_ID,
            type,
            data,
        };
        keydb.publish("MESSAGES", JSON.stringify(outgoing));
    };

    async initPubSub(ws: ElysiaWS<any>) {
        
        keydb.on("message", (_, message) => {
          const { serverId, type, data } = JSON.parse(message) as {
            serverId: string;
            type: string;
            data: object;
          };
          if (serverId === SERVER_ID) {
            return;
          }
          console.log(ws)
          
          
        });
        //@ts-ignore
        keydb.subscribe("MESSAGES");
      };




}

export default ChatService