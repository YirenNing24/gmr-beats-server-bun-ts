// * RETHINK DB IMPORTS
import rt from "rethinkdb";
import { getRethinkDB } from "../db/rethink";
import { RDB_DATABASE } from "../config/constants";
import { WebSocketServer } from "ws";
import app from "../app";

interface Message {
    message: string
    roomdId: string
    username: string
}

const listenAll = async (): Promise<void> => {
  try {
    const webSocketServer = new WebSocketServer({host: 'http://192.168.4.117:8081'})
    webSocketServer.on("connection", (client) => {
      client.addEventListener("message", async (message) => {
        const parsedMessage = JSON.parse(message.toString());
        console.log(parsedMessage)

      })
    })
    // Check if the message is not blank or null
    // const connection: rt.Connection = await getRethinkDB();
    // // Insert the parsed message into the "chats" table with a time
    //   await rt.db(RDB_DATABASE)
    //     .table("chats")
    //     .insert(Object.assign(message, { ts: Date.now()}))
    //     .run(connection);
  } catch (error: any) {
    console.error("Error processing message:", error);
  }
};

export default listenAll;
