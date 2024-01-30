//** ELYSIA IMPORTS
import { RouteSchema } from "elysia";
import { ElysiaWS } from "elysia/ws";




const watchedRooms: Record<string, boolean> = {};

class ClassicMode {

  websocket?: ElysiaWS<any>;

  constructor(websocket?: ElysiaWS<any>) {
    this.websocket = websocket;
  }

  public async classicConnect(username: string): Promise<void> {
    try {
        const ws: ElysiaWS<any, RouteSchema, { request: {}; store: {}; }> | undefined= this.websocket






    } catch (error: any) {
      throw error("Error connecting to game server")
    }
  };

  private async loadMap(mapName: string) {

  };

}

export default ClassicMode