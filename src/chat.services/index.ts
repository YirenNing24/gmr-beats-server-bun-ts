import keydb from "../db/keydb.client";
import { SERVER_ID } from "../config/constants";
import { ElysiaWS } from "elysia/ws";


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
      ws.send(data)
    });
    
    //@ts-ignore
    keydb.subscribe("MESSAGES");
  };


    async initializeChatService () {
        const totalUsersKeyExist = await keydb.exists("total_users");
        if (!totalUsersKeyExist) {
            /** This counter is used for the id */
            await keydb.set("total_users", 0);
            /**
             * Some rooms have pre-defined names. When the clients attempts to fetch a room, an additional lookup
             * is handled to resolve the name.
             * Rooms with private messages don't have a name
             */
            await keydb.set(`room:${0}:name`, "General");
        
            /** Create demo data with the default users */

          }
        
    }

    






}

export default ChatService


export const initializeChatService = async () => {
  const totalUsersKeyExist = await keydb.exists("total_users");
  if (!totalUsersKeyExist) {
      /** This counter is used for the id */
      await keydb.set("total_users", 0);
      /**
       * Some rooms have pre-defined names. When the clients attempts to fetch a room, an additional lookup
       * is handled to resolve the name.
       * Rooms with private messages don't have a name
       */
      await keydb.set(`room:${0}:name`, "General");
  
      /** Create demo data with the default users */

    }
  
}