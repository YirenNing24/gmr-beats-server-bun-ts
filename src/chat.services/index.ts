// * RETHINK DB IMPORTS
import rt from "rethinkdb"
import { getRethinkDB } from "../db/rethink";

// * WEBSOCKET SERVERs
import { ElysiaWS } from "elysia/ws";
import { WebSocketServer } from "ws";
import { constructAbiFromBytecode } from "@thirdweb-dev/sdk";

interface Message {
  message: string
  roomdId: string
  username: string
}

const watchedRooms: Record<string, boolean> = {};

class ChatService {

    async chatRoom(room: string, ws: ElysiaWS<any>): Promise<void> {
        try{
            const connection: rt.Connection = await getRethinkDB();
            let query: rt.Sequence = rt.db('beats').table("chats").filter({ roomId: room });
             // Subscribe to new messages
             if (!watchedRooms[room]) {
              console.log('watched ba?1/1/1/1/')
              const cursor: Promise<rt.Cursor> = query.changes().run(connection);
              cursor.then((cursor) => {
                cursor.each((err, row) => {
                  if (err) {
                    console.error(err);
                    return;
                  }
                  if (row.new_val) {
                    const room_data = row.new_val;
                    ws.send(room_data)

                  }
                });
              });
              watchedRooms[room] = true;
              }
              // Return message history & Socket.io handle to get new messages
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