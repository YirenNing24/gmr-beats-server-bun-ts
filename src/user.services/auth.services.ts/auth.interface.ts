/**
 * Represents the data required for registering a user with Google.
 *
 * @interface GoogleRegister
 * @property {string} token - The Google authentication token.
 * @property {string} deviceId - The unique identifier for the device used for registration.
 */
export interface GoogleRegister {
    serverToken: string;
    deviceId: string;
}