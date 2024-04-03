//** FAST JWT IMPORT
import { createSigner, createVerifier } from 'fast-jwt';

//** CONFIG IMPORT
import { JWT_SECRET } from '../config/constants';

//** TYPE INTERFACE IMPORT
import { TokenScheme } from './user.service.interface';

const ACCESS_TOKEN_EXPIRY = '10m';
const REFRESH_TOKEN_EXPIRY = '30m';


class TokenService {
    public async generateTokens(username: string): Promise<TokenScheme> {
        try {
            const signSync = createSigner({ key: JWT_SECRET, expiresIn: REFRESH_TOKEN_EXPIRY });
            const refreshToken: string = signSync({ userName: username });

            const accessToken: string = await this.generateAccessToken(username);

            return { refreshToken, accessToken, userName: username } as TokenScheme;
        } catch (error : any) {
            console.log(error)
            throw new Error('Failed to generate refresh token');
        }
    }
    
    private async generateAccessToken(username: string): Promise<string> {
        try {
            const signSync = createSigner({ key: JWT_SECRET, expiresIn: ACCESS_TOKEN_EXPIRY });
            const accessToken: string = signSync({ userName: username });

            return accessToken as string
        } catch (error : any) {
            throw new Error('Failed to generate access token');
        }
    }

    public async verifyAccessToken(token: string): Promise<string> {
        try {
            const verifyAccessTokenSync = createVerifier({ key:  JWT_SECRET });
            const decodedToken = verifyAccessTokenSync(token);
    
            const { userName } = decodedToken as { userName: string };
    
            return userName as string;
        } catch (error: any) {
            throw error

        }
    }

    public async verifyRefreshToken(token: string): Promise<TokenScheme> {
        try{
            const verifyAccessTokenSync: (token: string | Buffer) => any = createVerifier({ key:  JWT_SECRET });
            const decodedToken = verifyAccessTokenSync(token);
            
            const { userName } = decodedToken as { userName: string };
            const tokens: TokenScheme = await this.generateTokens(userName)

            return tokens as TokenScheme
        } catch(error: any) {
            throw error
        }
    }



    // public async verifyToken(accessToken: string, refreshToken: string): Promise<TokenScheme | string> {
    //     try {
    //         const verifyAccessTokenSync = createVerifier({ key: refreshToken });
    //         verifyAccessTokenSync(accessToken);
    
    //         // Access token is verified successfully
    //         const verifyRefreshTokenSync = createVerifier({ key: refreshToken });

    
    //         return userName as string
    //     } catch (error: any) {
    //         if (error.message === 'FAST_JWT_EXPIRED') {
    //             // Token is expired, but we don't know if it's the access token or refresh token
    //             // We'll try to verify the access token again, if it throws an error, it means the access token is expired
    //             try {
    //                 createVerifier({ key: refreshToken })(accessToken);
    //             } catch (accessTokenError) {
    //                 // Access token is expired, generate a new pair of tokens
    //                 const decodedToken = createVerifier({ key: refreshToken })(accessToken);
    //                 const { userName } = decodedToken as { userName: string };
    //                 const newTokenScheme: TokenScheme = await this.generateTokens(userName);
    
    //                 return newTokenScheme as TokenScheme
    //             }
    
    //             // If the above try-catch block does not throw an error, it means the refresh token is expired
    //             throw new Error('Session is expired');
    //         } else {
    //             throw new Error('Session verification failed');
    //         }
    //     }
    // }
    
}

export default TokenService;
