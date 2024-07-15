//** ELYSIA IMPORT
import Elysia, { Context, t } from 'elysia'

//** SERVICE IMPORT
import AuthService from '../user.services/auth.services.ts/auth.service'

//** MEMGRAPGH IMPORTS
import { getDriver } from '../db/memgraph'
import { Driver } from 'neo4j-driver'

//** TYPE INTERFACES
import { AuthenticateReturn, TokenScheme, User, ValidateSessionReturn } from '../user.services/user.service.interface';

//** VALIDATION ERROR IMPORT
import ValidationError from '../outputs/validation.error';

//** VALIDATION SCHEMA IMPORT
import { authorizationBearerSchema, beatsLoginSchema, googleServerTokenSchema, registrationSchema } from './route.schema/schema.auth';
import { ip } from 'elysia-ip';
import TokenService from '../user.services/token.services/token.service';

const auth = (app: Elysia): void => {

  app.use(ip())
  .post('api/login/google', async ({ body }): Promise<AuthenticateReturn> => {
    try {
      const { serverToken } = body;
  
      const driver: Driver = getDriver();
      const authService: AuthService = new AuthService(driver);
      const output: AuthenticateReturn | ValidationError = await authService.googleLogin(serverToken);
  
      return output as AuthenticateReturn;
    } catch (error: any) {
      return error;
    }
      }, { body: t.Object({ serverToken: t.String() }) 
  })

  .post('/api/login/beats', async ({ body }): Promise<AuthenticateReturn> => {
    try {
        const { username, password } = body
        const driver: Driver = getDriver(); 
        const authService: AuthService = new AuthService(driver);

        const output: AuthenticateReturn = await authService.authenticate(username, password);

        return output as AuthenticateReturn;
    } catch (error: any) {
      return error
    }
  }, beatsLoginSchema)

  .post('/api/validate_session/beats', async ({ headers }): Promise<AuthenticateReturn> => {
    try {
      const authorizationHeader: string | null = headers.authorization;
      if (!authorizationHeader || !authorizationHeader.startsWith('Bearer ')) {
        throw new Error('Bearer token not found in Authorization header');
      }
      const jwtToken: string = authorizationHeader.substring(7);

      const driver: Driver = getDriver();
      const authService: AuthService = new AuthService(driver);

      const output: ValidateSessionReturn = await authService.validateSession(jwtToken);
      return output as ValidateSessionReturn;
    } catch (error: any) {  
      throw error
    }
        }, authorizationBearerSchema
      )

  .post('/api/register/beats', async ({ body, ip }): Promise<void> => {
    try {
      const userData: User = body

      const driver: Driver = getDriver();
      const authService: AuthService = new AuthService(driver);
      const ipAddress = ip as string
      await authService.register(userData, ipAddress);

    } catch (error: any) {
      throw error
    }
      }, registrationSchema 
      ) 
  
  .post('/api/register/google', async ({ body, ip }): Promise<void | ValidationError> => {
    try {

      const driver: Driver = getDriver();
      const authService: AuthService = new AuthService(driver);
      const ipAddress = ip as string
      await authService.googleRegister(body, ipAddress);

    } catch (error: any) {
      throw error
    }
      }, googleServerTokenSchema
      )

  .post('/api/renew/access', async ({ headers }): Promise<TokenScheme> => {
        try {
          const authorizationHeader: string = headers.authorization;
          if (!authorizationHeader || !authorizationHeader.startsWith('Bearer ')) {
              throw new Error('Bearer token not found in Authorization header');
          };
  
          const jwtToken: string = authorizationHeader.substring(7);
          const tokenService: TokenService = new TokenService();
          const output: TokenScheme = await tokenService.refreshTokens(jwtToken);
  
          return output as TokenScheme;
        } catch(error: any) {
          throw error
          }
        }, authorizationBearerSchema
      )

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
