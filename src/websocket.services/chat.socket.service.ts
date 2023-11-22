//* FASTIFY
import app from "../app";


//* RETHINK DB
import rt from "rethinkdb";
import { getRethinkDB } from "../db/rethink";
import Elysia from "elysia";
import { WebSocket } from "ws";
import { ElysiaWS } from "elysia/ws";




//* TYPE INTERFACES
interface Result {
  id: string;
  message: string;
  roomId: string;
  ts: number;
}

interface SenderData {
  username: string
  level: number
  rank: string
}

interface NewMessage{
  id: string
  message: string
  roomId: string
  sender: SenderData
  receiver: string
  ts: number
}


interface PrivateMessage{
  id: string
  message: string
  receiver: string
  roomId: string
  seen: boolean
  sender: SenderData
  ts: number
}

const watchedRooms: Record<string, boolean> = {};

class ChatService {

  websocket?: WebSocket;

  constructor(websocket?: WebSocket) {
    this.websocket = websocket;
  }

  async chatRoom(room: string, username: string): Promise<void> {
    try {
      const ws: WebSocket | undefined = this.websocket

      const connection: rt.Connection = await getRethinkDB();
      let query: rt.Sequence = rt.db('beats').table("chats").filter({ roomId: room });
      if (!watchedRooms[room]) {
        query.changes().run(connection, (error, cursor) => {
          if (error) throw error;
          cursor.each((error, row)  => {
            if (error) throw error;
            if (row.new_val) {
              const room_data: Result = row.new_val;
                const roomData: string = JSON.stringify(room_data);
                app.server?.publish('all', roomData)
            }
          })
        });
        watchedRooms[room] = true;
      }
      let query2: rt.Sequence = rt.db('beats').table("private").filter({ roomId: username });
      if (!watchedRooms[username]) {
        query2.changes().run(connection, (error, cursor) => {
          if (error) throw error;
          cursor.each((error, row)  => {
            if (error) throw error;
            if (row.new_val) {
              const room_data: Result = row.new_val;
              const roomData: string = JSON.stringify(room_data);
              ws?.send(roomData)
              
            }
          })
        });
        watchedRooms[room] = true;
      }

      let query3: rt.Sequence = rt.db('beats').table("private").filter({ receiver: username });
      if (!watchedRooms[username]) {
        query3.changes().run(connection, (error, cursor) => {
          if (error) throw error;
          cursor.each((error, row)  => {
            if (error) throw error;
            if (row.new_val) {
              const room_data: Result = row.new_val;
              const roomData: string = JSON.stringify(room_data);
              ws?.send(roomData)
            }
          })
        });
        watchedRooms[room] = true;
      }
      let orderedQuery: rt.Sequence = query.orderBy(rt.desc("ts")).limit(4);
      orderedQuery.run(connection, async (error, cursor) => {
        if (error) {
          console.error(error);
          return;
        }
        const ws: WebSocket | undefined = this.websocket

        try {
          const result: Result[] = await cursor.toArray();
          const room_data = {
            data: result,
            handle: room,
          };
          const roomData: string = JSON.stringify(room_data);
          ws?.send(roomData);
        } catch (error: any) {
          console.error("Error processing query result:", error);
        }
      });
    } catch (error: any) {
      console.error("Error in chatRoom function:", error);
    }
  };

  async privateInboxData(clientUsername: string, conversingUsername: string): Promise<PrivateMessage[]> {
    try {
      const connection: rt.Connection = await getRethinkDB();
      
      const query: rt.Cursor = await rt
        .db('beats')
        .table('private')
        .filter({ roomId: clientUsername, receiver: conversingUsername })
        .orderBy(rt.desc('ts'))
        .limit(10)
        .union(
          rt
            .db('beats')
            .table('private')
            .filter({ roomId: conversingUsername, receiver: clientUsername })
            .orderBy(rt.desc('ts'))
            .limit(10)
        )
        .run(connection);
  
      const messageData = await query.toArray() as PrivateMessage[]

      return messageData;
    } catch (error: any) {
      console.error('Error in privateInboxdata function:', error);
      throw error; // Make sure to rethrow the error so the caller can handle it
    }
  }
  
  
};

export default ChatService

const sanitise = async (message: NewMessage): Promise<boolean> => {
  return !!message && message.message !== null && message.message !== "";
};

export const insertChats = async (message: NewMessage): Promise<void> => {
  try {
    console.log(message)
    const newMessage: NewMessage = JSON.parse(message.toString());
    if (await sanitise(newMessage)) {
      const connection = await getRethinkDB();

      // Check if message.receiver has a value, if it has then the message is a private message
      const table: string = newMessage.receiver ? "private" : "chats";
      await insertMessage(connection, newMessage, table);
    }
  } catch (error: any) {
    logError(error);
  }
};

const insertMessage = async (connection: any, newMessage: NewMessage, table: string = "chats"): Promise<void> => {
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