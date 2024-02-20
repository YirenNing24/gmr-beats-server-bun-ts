//** FAST JWT IMPORT
import { createSigner, createVerifier } from 'fast-jwt';

//** CONFIG IMPORT
import { JWT_SECRET } from '../config/constants';

//** TYPE INTERFACE IMPORT
import { TokenScheme } from './user.service.interface';

const ACCESS_TOKEN_EXPIRY = '1m'; // Set your desired access token expiry time
const REFRESH_TOKEN_EXPIRY = '2d'; // Set your desired refresh token expiry time



class TokenService {
    public async generateTokens(username: string): Promise<TokenScheme> {
        try {
            const signSync = createSigner({ key: JWT_SECRET, expiresIn: REFRESH_TOKEN_EXPIRY });
            const refreshToken: string = signSync(username);

            const accessToken: string = await this.generateAccessToken(username, refreshToken);

            return { refreshToken, accessToken, username } as TokenScheme;
        } catch (error) {
            console.log(error)
            throw new Error('Failed to generate refresh token');
        }
    }

    private async generateAccessToken(username: string, refreshToken: string): Promise<string> {
        try {
            const signSync = createSigner({ key: refreshToken, expiresIn: ACCESS_TOKEN_EXPIRY });
            const accessToken: string = signSync(username);

            return accessToken;
        } catch (error : any) {
            throw new Error('Failed to generate access token');
        }
    }

    public async verifyToken(accessToken: string, refreshToken: string): Promise<TokenScheme | string> {
        try {
            const verifyAccessTokenSync = createVerifier({ key: refreshToken });
            verifyAccessTokenSync(accessToken);
    
            // Access token is verified successfully
            const verifyRefreshTokenSync = createVerifier({ key: refreshToken });
            const decodedToken = verifyRefreshTokenSync(accessToken);
    
            const { userName } = decodedToken as { userName: string };
    
            return userName;
        } catch (error: any) {
            if (error.message === 'FAST_JWT_EXPIRED') {
                // Token is expired, but we don't know if it's the access token or refresh token
                // We'll try to verify the access token again, if it throws an error, it means the access token is expired
                try {
                    createVerifier({ key: refreshToken })(accessToken);
                } catch (accessTokenError) {
                    // Access token is expired, generate a new pair of tokens
                    const decodedToken = createVerifier({ key: refreshToken })(accessToken);
                    const { userName } = decodedToken as { userName: string };
                    const newTokenScheme: TokenScheme = await this.generateTokens(userName);
    
                    return newTokenScheme;
                }
    
                // If the above try-catch block does not throw an error, it means the refresh token is expired
                throw new Error('Session is expired');
            } else {
                throw new Error('Session verification failed');
            }
        }
    }
    
}

export default TokenService;
