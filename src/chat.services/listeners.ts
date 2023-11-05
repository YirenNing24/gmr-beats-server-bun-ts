// * WEBSOCKET SERVER
import {  WebSocketServer } from "ws";

// * RETHINK DB IMPORTS
import rt from 'rethinkdb'
import { getRethinkDB } from "../db/rethink";
import { RDB_DATABASE } from "../config/constants";


const listenAll = () => {
 const ws: WebSocketServer = new WebSocketServer()
    ws.on("connection", (client) => {
        const ws: WebSocketServer = new WebSocketServer()
           ws.on("connection", (client) => {
               client.addEventListener("message", async (message) => {
                   try{
                       const parsedMessage = JSON.parse(message.toString());
                       if (parsedMessage && parsedMessage.message !== null && parsedMessage.message !== "") {
                           const connection: rt.Connection = await getRethinkDB();
                           // Insert the parsed message into the "chats" table with a timestamp
                    await rt.db(RDB_DATABASE)
                      .table("chats")
                      .insert({
                        ...parsedMessage,
                        ts: Date.now(),
                      })
                      .run(connection);
                    }
            } catch (error: any) {
                throw Error("Error processing message:", error)
            }
        })

    })
    })
} ;


export default listenAll