//** ELYSIA IMPORTS
import app from "../app";
import { ElysiaWS } from "elysia/ws";

//** RETHINK DB
import rt from "rethinkdb";
import { getRethinkDB } from "../db/rethink";

//** TYPE INTERFACE
import { PrivateMessage, NewMessage, Result, GroupResult } from "./chat.interface";
import TokenService from "../user.services/token.services/token.service";
import { RouteSchema } from "elysia";


const watchedRooms: Record<string, boolean> = {};
const watchedGroupRooms: Record<string, boolean> = {};

class ChatService {

  websocket?: ElysiaWS<any>;

  constructor(websocket?: ElysiaWS<any>) {
    this.websocket = websocket;
  }

  public async chatRoom(room: string, token: string): Promise<void> {
    try {
      const tokenService: TokenService = new TokenService();
      const username: string = await tokenService.verifyAccessToken(token);
      
      const ws = this.websocket;
      const connection: rt.Connection = await getRethinkDB();
      let query: rt.Sequence = rt.db('beats').table("chats").filter({ roomId: room });
      
      if (!watchedRooms[room]) {
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
              const roomNewVal: Result = row.new_val;
              const roomData: string = JSON.stringify(roomNewVal);
              app.server?.publish('all', roomData);
            }
          });
        });
      
        watchedRooms[room] = true;
      }
      let orderedQuery: rt.Sequence = query.orderBy(rt.desc("ts")).limit(4);
      orderedQuery.run(connection, async (error, cursor) => {
        if (error) {
          console.error(error);
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
        } catch (error: any) {
          throw error
        }
      });
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


    } catch (error: any) {
      throw error
    }
  }


  public async groupChatRoom(token: string) {

    const tokenService: TokenService = new TokenService();
    const username: string = await tokenService.verifyAccessToken(token);
    
    const ws: ElysiaWS<any, RouteSchema, { request: {}; store: {};}> | undefined = this.websocket;
    const connection: rt.Connection = await getRethinkDB();

    let query1: rt.Sequence = rt.db('beats').table("group").filter(rt.row('members').contains(username));

    if (!watchedGroupRooms[username]) {
      query1.changes().run(connection, (error, cursor) => {
        if (error) throw error;
        cursor.each((error, row)  => {
          if (error) throw error;
          if (row.new_val) {
            const room_data: GroupResult = row.new_val;
            const roomData: string = JSON.stringify(room_data);
            ws?.send(roomData)
          }
        })
      });
      watchedGroupRooms[username] = true;
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
      const table: string = newMessage.group ? "group" : (newMessage.receiver ? "private" : "chats");

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
