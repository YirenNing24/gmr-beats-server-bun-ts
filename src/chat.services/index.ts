// * RETHINK DB IMPORTS
import rt from "rethinkdb"
import { getRethinkDB } from "../db/rethink";

// * WEBSOCKET SERVERs
import { ElysiaWS } from "elysia/ws";
import { WebSocketServer } from "ws";

interface Message {
  message: string
  roomdId: string
  username: string
}

const watchedRooms = {};

class ChatService {

    async chatRoom(room: string, ws: ElysiaWS<any>): Promise<void> {
      
      console.log("room po patingin: ", room)
        try{
            const connection: rt.Connection = await getRethinkDB();
            let query: rt.Sequence = rt.db('beats').table("chats").filter({ roomId: room });
            console.log(query)
             // Subscribe to new messages
             if (!watchedRooms[room]) {
              const cursor: Promise<rt.Cursor> = query.changes().run(connection);
              cursor.then((cursor) => {
                cursor.each((error, row) => {
                  if (error) {
                    console.error(error);
                    return;
                  }
                  if (row.new_val) {
                    const roomData: string = JSON.stringify(row.new_val);
                    console.log(roomData)
                      ws.send(roomData)
                    }
                 });
              });
              watchedRooms[room] = true;
              }
              let orderedQuery: rt.Sequence = query.orderBy(rt.desc("ts")).limit(10);
              orderedQuery.run(connection, (error, cursor) => {
                if (error) {
                  throw error;
                }
                try {
                  cursor.toArray((error, result) => {
                    if (error) throw error;
                    const roomData = {
                      data: result,
                      handle: room,
                    };
                    // const roomData: string = JSON.stringify(room_data);
                    ws.send(roomData);
                  })

                } catch (error: any) {
                  console.error("Error processing query result:", error);
                }
              });
          } catch (error: any) {
        }
      }
}

export default ChatService