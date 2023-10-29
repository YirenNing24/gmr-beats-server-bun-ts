// import rt from "rethinkdb";
// import { getRethinkDB } from "../db/rethink";
// import { RDB_DATABASE } from "../config/constants";
// import app from "../app";
// import { WebsocketPluginOptions } from "@fastify/websocket";
// import { FastifyInstance, FastifyPluginOptions } from "fastify";

// const watchedRooms: Record<string, boolean> = {};

// /**
//  * Public class representing a ChatService.
//  */
// export default class ChatService {
//   connection: WebsocketPluginOptions;

//   /**
//    * Creates an instance of ChatService.
//    * @param {WebsocketPluginOptions} connection - The connection object associated with the chat service.
//    */
//   constructor(connection: WebsocketPluginOptions) {
//     this.connection = connection;
//   }

//   /**
//    * Retrieves and streams chat messages for a specified room.
//    * @param {string} room - The name of the chat room.
//    * @returns {void}
//    */
//   async chatRoom(room: string): Promise<void> {
//     try {
//       const conn = await getRethinkDB();

//       let query = rt.db('beats').table("chats").filter({ roomId: room });
//       if (!watchedRooms[room]) {
//         const cursor = query.changes().run(conn);
//         cursor.then((cursor) => {
//           cursor.each((err, row) => {
//             if (err) {
//               console.error(err);
//               return;
//             }
//             if (row.new_val) {
//               const room_data = row.new_val;
//               for (const client of app.websocketServer.clients) {
//                 const roomData:string = JSON.stringify(room_data);
//                 client.send(roomData);
//               }
//             }
//           });
//         });
//         watchedRooms[room] = true;
//       }
//       let orderedQuery = query.orderBy(rt.desc("ts")).limit(10);
//       orderedQuery.run(conn, async (err, cursor) => {
//         if (err) {
//           console.error(err);
//           return;
//         }
//         const connection = this.connection;

//         //@ts-ignore
//         const client = connection.socket;
//         try {
//           const result = await cursor.toArray();
//           const room_data = {
//             data: result,
//             handle: room,
//           };

//           const roomData:string = JSON.stringify(room_data);
//           client.send(roomData);
//         } catch (err) {
//           console.error("Error processing query result:", err);
//         }
//       });
//     } catch (err) {
//       console.error("Error in chatRoom function:", err);
//     }
//   }
// }

// /**
//  * Inserts chat messages into the database when received from clients.
//  * @param {FastifyInstance} app - The Fastify instance.
//  * @param {FastifyPluginOptions} options - Plugin options.
//  * @param {function} done - Callback function to indicate plugin initialization is complete.
//  * @returns {void}
//  */
// export const insertChats = async (
//   app: FastifyInstance,
//   options: FastifyPluginOptions,
//   done: () => void
// ): Promise<void> => {
//   app.websocketServer.on("connection", (client) => {
//     client.on("message", async (message) => {
//       try {
//         const parsedMessage = JSON.parse(message.toString());

//         // Check if the message is not blank or null
//         if (parsedMessage && parsedMessage.message !== null && parsedMessage.message !== "") {
//           const conn = await getRethinkDB();
//           // Insert the parsed message into the "chats" table with a timestamp
//           await rt.db(RDB_DATABASE)
//             .table("chats")
//             .insert({
//               ...parsedMessage,
//               ts: Date.now(),
//             })
//             .run(conn);
//         }
//       } catch (err) {
//         console.error("Error processing message:", err);
//       }
//     });
//   });
//   done();
// };
