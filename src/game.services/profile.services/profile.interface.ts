/**
 * Represents the status of a player.
 *
 * @interface PlayerStatus
 * @property {string} username - The username of the player.
 * @property {boolean} status - The online status of the player (true for online, false for offline).
 * @property {string} activity - The current activity of the player.
 * @property {number} lastOnline - The timestamp indicating when the player was last online.
 * @property {string} userAgent - The user agent string of the player's device.
 * @property {string} osName - The name of the operating system running on the player's device.
 * @property {string} ipAddress - The IP address of the player's device.
 * @property {string} id - The unique identifier of the player status record.
 */
export interface PlayerStatus {
    username: string;
    status: boolean;
    activity: string;
    lastOnline: number;
    userAgent: string;
    osName: string;
    ipAddress: string;
    id: string;
}

/**
 * Represents the stat points of a player for different roles.
 *
 * @interface StatPoints
 * @property {number} mainVocalist - The stat points for the main vocalist role.
 * @property {number} rapper - The stat points for the rapper role.
 * @property {number} leadDancer - The stat points for the lead dancer role.
 * @property {number} leadVocalist - The stat points for the lead vocalist role.
 * @property {number} mainDancer - The stat points for the main dancer role.
 * @property {number} visual - The stat points for the visual role.
 * @property {number} leadRapper - The stat points for the lead rapper role.
 */
export interface StatPoints {
    mainVocalist: number;
    rapper: number;
    leadDancer: number;
    leadVocalist: number;
    mainDancer: number;
    visual: number;
    leadRapper: number;
}

/**
 * Represents the result when a stats update fails.
 *
 * @interface UpdateStatsFailed
 * @property {boolean} success - Indicates whether the update failed.
 * @property {string} message - A message providing details about the failure.
 */
export interface UpdateStatsFailed {
    success: boolean;
    message: string;
  }

  /**
 * Represents the profile picture of a user.
 *
 * @interface ProfilePicture
 * @property {string} userName - The username of the user.
 * @property {string} fileFormat - The file format of the profile picture.
 * @property {number[]} profilePicture - The binary data of the profile picture.
 * @property {number} uploadedAt - The timestamp indicating when the profile picture was uploaded.
 * @property {number} fileSize - The size of the profile picture file in bytes.
 */
export interface ProfilePicture {
    userName: string;
    fileFormat: string;
    profilePicture: number[];
    uploadedAt: number;
    fileSize: number;
}

export interface SoulMetaData {
	genre1: string;
	genre2: string;
	genre3: string;
	animal1: string;
	horoscope: string;
}
