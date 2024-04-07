










export interface SuccessResponse{
  success: string;
};







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





export interface ProfilePicture {
  userName: string
  fileFormat: string
  profilePicture: number[]
  uploadedAt: number
  fileSize: number
}

//* TYPE INTERFACES
export interface ViewProfileData {
  username: string
  playerStats: string
  followsUser: boolean
  followedByUser: boolean
  }

export interface FollowResponse {
    status: string;
  }

export interface MutualData {
    username: string;
    playerStats: string;
  }

export interface PrivateMessage {
    message: string
    roomId: string
    sender: SenderData
    receiver: string
    seen: boolean
    ts: number
  }

export interface SenderData {
    username: string
    level: number
    rank: string
  }

export interface PlayerStatus {
    username: string
    status: boolean
    activity: string
    lastOnline: number
    userAgent: string
    osName: string
    ipAddress: string
    id: string
  }


export interface StatPoints {
    mainVocalist: number;
    rapper: number;
    leadDancer: number;
    leadVocalist: number;
    mainDancer: number;
    visual: number;
    leadRapper: number;
  }
  