//** ELYSIA IMPORT
import Elysia, { Context } from 'elysia'

//** SERVICE IMPORT
import AuthService from '../user.services/auth.service'


//** MEMGRAPGH IMPORTS
import { getDriver } from '../db/memgraph'
import { Driver } from 'neo4j-driver'


//** TYPE INTERFACES
import { AuthenticateReturn, GoogleRegistered, GoogleToken, User, ValidateSessionReturn } from '../user.services/user.service.interface';

const auth = (app: Elysia): void => {
  app.post("api/login/beats", async (context: Context) => {
    try {
      const { username, password } = context.body as { username: string; password: string };

      const driver: Driver = getDriver();
      const authService: AuthService = new AuthService(driver);
      const output: AuthenticateReturn = await authService.authenticate(username, password);

      return output;
    } catch (error: any) {
      return error
    }
  })

  .post('/api/validate_session/beats', async (context: Context): Promise<ValidateSessionReturn> => {
    try {
      const authorizationHeader: string | null = context.headers.authorization;
      if (!authorizationHeader || !authorizationHeader.startsWith('Bearer ')) {
        throw new Error('Bearer token not found in Authorization header');
      }
      const jwtToken: string = authorizationHeader.substring(7);

      const driver: Driver = getDriver();
      const authService: AuthService = new AuthService(driver);

      const output: ValidateSessionReturn = await authService.validateSession(jwtToken) 
      return output as ValidateSessionReturn

    } catch (error: any) {
      throw error
    }
  })

  .post("/api/check/google", async (context: Context): Promise<GoogleRegistered> => {
    try {
      const token: GoogleToken = context.body as GoogleToken
      const { serverToken } = token as GoogleToken

      const driver: Driver = getDriver();
      const authService: AuthService = new AuthService(driver);
      const output: GoogleRegistered = await authService.googleCheck(serverToken)

      return output as GoogleRegistered

    } catch (error: any) {
      throw error
    }
  })

   .post("api/login/google", async (context: Context) => {
     try {
       const token: any = context.body as { serverToken: string }
      const { serverToken } = token as { serverToken: string }

       const driver: Driver = getDriver();
       const authService: AuthService = new AuthService(driver);
       const output: GoogleRegistered = await authService.googleCheck(serverToken)

       console.log(output)



      //  await authService.googleServer(serverToken);

      //  return output
     } catch (error: any) {
       return error
     }
   })



  .post('/api/register/beats', async (context: Context) => {
    try {
      const userData: User = context.body as User

      const driver: Driver = getDriver();
      const authService: AuthService = new AuthService(driver);
      await authService.register(userData);

    } catch (error: any) {
      return error
    }
  })

  .post('/api/version-check/beats', async (context: Context) => {
    const currentVersion = {
      apiKey: '1',
      apiId: 'Hello World',
      gameVersion: '0.1',
      logLevel: '2'
    };
    let isVersionCurrent = true;
    for (const key in currentVersion) {
      //@ts-ignore
      if (context.body[key] !== currentVersion[key]) {
        isVersionCurrent = false;
        break;
      }
    }
    if (isVersionCurrent) {
      return('Your app is up to date!');
    } else {
      return('Please update your app');
    }
  })
  
};

export default auth;
