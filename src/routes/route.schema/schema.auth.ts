//** ELYSIA TYPE VALIDATION IMPORT
import { t } from "elysia";

//
/**
 * Schema for validating the body of a Beats login request.
 *
 * @type {Object}
 * @property {Object} body - The body of the request.
 * @property {string} body.username - The username for login.
 * @property {string} body.password - The password for login.
 */
export const beatsLoginSchema = {
    body: t.Object({ username: t.String(), password: t.String() }),

}

/**
 * Schema for validating the authorization header with a bearer token.
 *
 * @type {Object}
 * @property {Object} headers - The headers of the request.
 * @property {string} headers.authorization - The bearer token for authorization.
 */
export const authorizationBearerSchema = { 
    headers: t.Object({ authorization: t.String() })
}

/**
 * Schema for validating the body of a user registration request.
 *
 * @type {Object}
 * @property {Object} body - The body of the request.
 * @property {string} body.userName - The username for registration.
 * @property {string} body.password - The password for registration.
 */
export const registrationSchema = { 
    body: t.Object({ 
        userName: t.String(), 
        password: t.String(), 
        deviceId: t.String()
    })
}

/**
 * Schema for validating the body of a Google server token received.
 *
 * @type {Object}
 * @property {Object} body - The body of the received.
 * @property {string} body.serverToken - The server token for Google authentication.
 */
export const googleServerTokenSchema = { 
    body: t.Object({ 
        serverToken: t.String(),
        deviceId: t.String() 
    })
}


