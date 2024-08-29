//** ELYSIA IMPORTS
import app from "../app";
import { ElysiaWS } from "elysia/ws";

//** RETHINK DB
import rt from "rethinkdb";
import { getRethinkDB } from "../db/rethink";

//** TYPE INTERFACE
import { PrivateMessage, NewMessage, Result } from "./chat.interface";
import TokenService from "../user.services/token.services/token.service";


const watchedRooms: Record<string, boolean> = {};

class ChatService {

  websocket?: ElysiaWS<any>;

  constructor(websocket?: ElysiaWS<any>) {
    this.websocket = websocket;
  }

  /**
   * Verifies the token and retrieves the username.
   */
  private async verifyToken(token: string): Promise<string> {
    const tokenService: TokenService = new TokenService();
    return await tokenService.verifyAccessToken(token);
  }

  /**
   * Handles change feed events for a query and sends the data to the WebSocket.
   */
  private async handleChangeFeed(query: rt.Sequence, ws: ElysiaWS<any>, room: string) {
    const connection: rt.Connection = await getRethinkDB();
    
    query.changes().run(connection, (error, cursor) => {
      if (error) {
        console.error("Error running change feed query:", error);
        return;
      }

      cursor.each((error, row) => {
        if (error) {
          console.error("Error processing change feed row:", error);
          return;
        }

        if (row.new_val) {
          const roomData: string = JSON.stringify(row.new_val);
          ws?.send(roomData);
        }
      });
    });

    watchedRooms[room] = true;
  }

  /**
   * Runs the query and sends initial chat data to the WebSocket.
   */
  private async runInitialQuery(query: rt.Sequence, room: string, ws: ElysiaWS<any>): Promise<void> {
    const connection: rt.Connection = await getRethinkDB();
    
    query.run(connection, async (error, cursor) => {
      if (error) {
        console.error("Error running query:", error);
        return;
      }

      try {
        const result: Result[] = await cursor.toArray();
        const room_data = {
          chat: result,
          handle: room,
        };
        const roomData: string = JSON.stringify(room_data);
        ws?.send(roomData);
      } catch (err: any) {
        console.error("Error sending initial chat data:", err);
        throw err;
      }
    });
  }

  /**
   * Handles the public chat room data and sets up change feed listeners.
   */
  private async setupPublicRoom(room: string, ws: ElysiaWS<any>) {
    const query: rt.Sequence = rt.db('beats').table("chats").filter({ roomId: room });
    
    if (!watchedRooms[room]) {
      await this.handleChangeFeed(query, ws, room);
    }

    const orderedQuery: rt.Sequence = query.orderBy(rt.desc("ts")).limit(4);
    await this.runInitialQuery(orderedQuery, room, ws);
  }

  /**
   * Handles the private chat room and receiver data and sets up change feed listeners.
   */
  private async setupPrivateRoom(username: string, ws: ElysiaWS<any>) {
    const privateRoomQuery: rt.Sequence = rt.db('beats').table("private").filter({ roomId: username });

    if (!watchedRooms[username]) {
      await this.handleChangeFeed(privateRoomQuery, ws, username);
    }

    const receiverQuery: rt.Sequence = rt.db('beats').table("private").filter({ receiver: username });

    if (!watchedRooms[username]) {
      await this.handleChangeFeed(receiverQuery, ws, username);
    }
  }

  /**
   * Main function that sets up both public and private rooms.
   */
  public async chatRoom(room: string, token: string): Promise<void> {
    try {
      const username: string = await this.verifyToken(token);
      const ws = this.websocket;

      // Setup public room
      //@ts-ignore
      await this.setupPublicRoom(room, ws);

      // Setup private room for the user (both as roomId and receiver)
      //@ts-ignore
      await this.setupPrivateRoom(username, ws);

    } catch (error: any) {
      console.error("Error in chatRoom function:", error);
      throw error;
    }
  }


  public async privateInboxData(token: string, conversingUsername: string): Promise<PrivateMessage[]> {
    try {

      const tokenService:  TokenService = new TokenService();
      const clientUsername: string = await tokenService.verifyAccessToken(token);

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

      return messageData as PrivateMessage[]
    } catch (error: any) {
      throw error;
    }
  }
  
  
};

export default ChatService

const sanitise = async (message: NewMessage): Promise<boolean> => {

  return !!message && message.message !== null && message.message !== "";
};

export const insertChats = async (newMessage: NewMessage): Promise<void> => {
  try {

    if (await sanitise(newMessage)) {
      const connection: rt.Connection = await getRethinkDB();

      // Check if message.receiver has a value, if it has then the message is a private message
      const table: string = newMessage.receiver ? "private" : "chats";

      insertMessage(connection, newMessage, table);
    }
  } catch (error: any) {
    throw error
  }
};

const insertMessage = async (connection: any, newMessage: NewMessage, table: string = "chats"): Promise<void> => {
  try {
    await rt.db('beats')
    .table(table)
    .insert({
      ...newMessage,
      ts: Date.now(),
    })
    .run(connection);
  } catch(error: any){
    throw error
  }

};
