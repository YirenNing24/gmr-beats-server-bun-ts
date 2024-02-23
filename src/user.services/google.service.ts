//** GOOGLE AUTH LIBRARY IMPORT */
import { OAuth2Client } from "google-auth-library";
import { GetTokenResponse } from "google-auth-library/build/src/auth/oauth2client";

//** TYPE INTERFACE IMPORT
import { PlayerInfo } from "./user.service.interface";

//** CONFIG IMPORT
import { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET } from "../config/constants";


class GoogleService {
    public async googleAuth(token: string): Promise<PlayerInfo> {
        try{
            const oAuth2Client = new OAuth2Client( GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET);
            const { tokens } = await oAuth2Client.getToken(token) as GetTokenResponse

            const apiUrl: string = 'https://games.googleapis.com/games/v1/players/me';
            const response: Response = await fetch(apiUrl, {
            method: 'GET',
            headers: { Authorization: `Bearer ${tokens.access_token}` },
            });

            const playerInfo: PlayerInfo = await response.json() as PlayerInfo ;
            console.log(playerInfo)

            return playerInfo as PlayerInfo
        } catch(error: any){
            throw error
        }
    };

}

export default GoogleService