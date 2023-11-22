//* FASTIFY
import app from "../app";

//* RETHINK DB
import rt from "rethinkdb";
import { getRethinkDB } from "../db/rethink";

//* WEBSOCKET


//* TYPE INTERFACES
interface Result {
  id: string;
  message: string;
  roomId: string;
  ts: number;
  username: string;
};

interface NewMessage{
  message: string
  roomId: string
  username: string
  sender: SenderData
  receiver: string
};

interface SenderData {
  username: string
  level: number
  rank: string
};


const watchedRooms: Record<string, boolean> = {};
const watchedPrivateRooms: Record<string, boolean> = {};

class SocialSocketService {

  websocket: SocketStream;
  constructor(websocket: SocketStream) {
    this.websocket = websocket;
  };

  async chatRoom(room: string): Promise<void> {
    try {
      const connection: rt.Connection = await getRethinkDB();
      let query: rt.Sequence = rt.db('beats').table("chats").filter({ roomId: room });
      if (!watchedRooms[room]) {
        query.changes().run(connection, (error, cursor) => {
          if (error) throw error;
          cursor.each((error, row)  => {
            if (error) throw error;
            if (row.new_val) {
              const newMessageData: Result = row.new_val;
              for (const client of app.websocketServer.clients) {
                const messageData:string = JSON.stringify(newMessageData);
                client.send(messageData);
              }
            }
          })
        });
        watchedRooms[room] = true;
      }
      let orderedQuery: rt.Sequence = query.orderBy(rt.desc("ts")).limit(10);
      orderedQuery.run(connection, async (error, cursor) => {
        if (error) {
          console.error(error);
          return;
        }
        const websocket: SocketStream = this.websocket;
        const ws = websocket.socket
        try {
          const result: Result[] = await cursor.toArray();
          const room_data = {
            data: result,
            handle: room,
          };

          const roomData: string = JSON.stringify(room_data);
          ws.send(roomData);
        } catch (error: any) {
          console.error("Error processing query result:", error);
        }
      });
    } catch (error: any) {
      console.error("Error in chatRoom function:", error);
    }
  };

  async privateInbox(username: string): Promise<void>{
    try {
      const websocket: SocketStream = this.websocket;
      const ws: WebSocket = websocket.socket;
  
      const connection: rt.Connection = await getRethinkDB();
      
      let query: rt.Sequence = rt.db('beats').table("private").filter({ roomId: username })
      if (!watchedPrivateRooms[username]) {
        query.changes().run(connection, (error, cursor) => {
          if (error) throw error;
  
          cursor.each((error, row)  => {
            if (error) throw error;
            if (row.new_val) {
              const roomData: Result = row.new_val;
              const roomDataString: string = JSON.stringify(roomData);
              ws.send(roomDataString);
            }
          });
        });
  
        watchedPrivateRooms[username] = true;
      }
  
      let orderedQuery: rt.Sequence = query.orderBy(rt.desc("ts")).limit(10);
      orderedQuery.run(connection, async (error, cursor) => {
        if (error) {
          console.error(error);
          return;
        }
  
        try {
          const result: Result[] = await cursor.toArray();
          const roomData = {
            data: result,
            handle: username,  // Use the room ID as the handle
          };
          const roomDataString: string = JSON.stringify(roomData);
          ws.send(roomDataString);
        } catch (error: any) {
          console.error("Error processing query result:", error);
        }
      });

    } catch (error: any) {
      console.error("Error in privateChat function:", error);
    }
  };

  async privateInboxdata(username1: string, username2: string) {
    try {
      const connection: rt.Connection = await getRethinkDB();
  
      // Query for messages sent by username1 and received by username2
      const query1: rt.Sequence = rt.db('beats')
        .table("private")
        .filter({ roomId: username1, receiver: username2 })
        .orderBy(rt.desc("ts"))
        .limit(10);
  
      // Query for messages sent by username2 and received by username1
      const query2: rt.Sequence = rt.db('beats')
        .table("private")
        .filter({ roomId: username2, receiver: username1 })
        .orderBy(rt.desc("ts"))
        .limit(10);
  
      // Combine the results of both queries
      const combinedQuery: rt.Sequence = query1.union(query2);
  
      // Further filter the combined query based on the receiver
      const finalQuery: rt.Sequence = combinedQuery.filter({ receiver: username1 });
  
      const result = await finalQuery.run(connection);

      console.log(result);
      return result

    } catch (error: any) {
      console.error("Error in privateInboxdata function:", error);
    }
  }
};

export default SocialSocketService

export const socketListener = async (app: FastifyInstance, options: FastifyPluginOptions, done: () => void): Promise<void> => {
  app.websocketServer.on("connection", (client: WebSocket) => {
    client.on("message", async (message: RawData) => {
      try {
        const newMessage: NewMessage = JSON.parse(message.toString());
        if (await sanitise(newMessage)) {
          const connection = await getRethinkDB();

          const table: string = newMessage.receiver ? "private" : "chats";
          await insertChat(connection, newMessage, table);
        }
      } catch (error: any) {
        logError(error);
      }
    });
  });
  done();
};

const sanitise = async (message: NewMessage): Promise<boolean> => {
  return !!message && message.message !== null && message.message !== "";
};

const insertChat = async (connection: rt.Connection, newMessage: NewMessage, table: string = "chats"): Promise<void> => {
  await rt.db('beats')
    .table(table)
    .insert({
      ...newMessage,
      ts: Date.now(),
    })
    .run(connection);
    
};

const logError = (error: any): void => {
  console.error("Error processing message:", error);
};
