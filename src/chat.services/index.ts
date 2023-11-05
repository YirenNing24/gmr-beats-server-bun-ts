// * RETHINK DB IMPORTS
import rt from "rethinkdb"
import { getRethinkDB } from "../db/rethink";

// * WEBSOCKET SERVERs
import { ElysiaWS } from "elysia/ws";
import { WebSocketServer } from "ws";



class ChatService {

    ws?: ElysiaWS<any>;
    constructor(ws?: ElysiaWS<any>) {
      this.ws = ws;
    }
  
    async chatRoom(room: string, ws: ElysiaWS<any>): Promise<void> {
        try{
            const webSocketServer = new WebSocketServer()
            const watchedRooms: Record<string, boolean> = {};
            const conn: rt.Connection = await getRethinkDB();
            let query: rt.Sequence = rt.db('beats').table("chats").filter({ roomId: room });

             // Subscribe to new messages
             if (!watchedRooms[room]) {
              const cursor: Promise<rt.Cursor> = query.changes().run(conn);
              cursor.then((cursor) => {
                cursor.each((error, row) => {
                  if (error) {
                    console.error(error);
                    return;
                  }
                  if (row.new_val) {
                    const roomData: string = JSON.stringify(row.new_val);
                    for (const client of webSocketServer.clients) {
                      client.send(roomData)
                     }
                    }
                 });
              });
              watchedRooms[room] = true;
              }
              let orderedQuery: rt.Sequence = query.orderBy(rt.desc("ts")).limit(10);
              orderedQuery.run(conn, async (error, cursor) => {
                if (error) {
                  throw error;
                }
                try {
                  const result: any[] = await cursor.toArray();
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
        }
      }
}

export default ChatService