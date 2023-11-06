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
            ws.subscribe(room)
            const connection: rt.Connection = await getRethinkDB();
            let query: rt.Sequence = rt.db('beats').table("chats").filter({ roomId: room });
             if (!watchedRooms[room]) {
              query.changes().run(connection, (error, cursor) => {
                if (error) throw error;
                cursor.each((error, row) => {
                  if (row.new_val) {
                    console.log(row.new_val, " row bat ito?!?")
                    ws.publish(room, row.new_val)
                  }
                })
              })
              // cursor.then((cursor) => {
              //   cursor.each((error, row) => {
              //     console.log(row)
              //     if (error) 
              //       throw error  
              //     if (row.new_val) {
              //       console.log(row.new_val, "wheereerereerree")
              //       const room_data = row.new_val;
              //       const roomData: string = JSON.stringify(room_data);
              //       ws.send(roomData)

              //     }
              //   });
              // });
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