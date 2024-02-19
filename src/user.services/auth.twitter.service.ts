//** TWITTER SDK IMPORTS
import { Client, auth } from "twitter-api-sdk";


// Initialize auth client first
const authClient = new auth.OAuth2User({
    client_id: process.env.TWITTER_CLIENT_ID as string,
    client_secret: process.env.TWITTER_CLIENT_ID_SECRET as string,
    callback: "YOUR-CALLBACK",
    scopes: [],
   });
   
// Pass auth credentials to the library client 
const twitterClient = new Client(authClient);


class TwitterService {


    async twitterAuthenticate() {

        const requestToken = () => {
            const authHeader = oauth.toHeader(
              oauth.authorize({
                url: requestTokenURL,
                method: "POST",
              })
            );

    }
}