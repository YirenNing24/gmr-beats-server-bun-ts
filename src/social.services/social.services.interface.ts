export interface FollowResponse {
    status: string;
  }

export interface ViewedUserData {
  username: string
  playerStats: string
  }

export interface ViewProfileData {
  username: string
  playerStats: string
  followsUser: boolean
  followedByUser: boolean
  }

export interface MutualData {
    username: string;
    playerStats: string;
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

export interface SetPlayerStatus {
    username: string
    status: boolean
    activity: string
    lastOnline: number
    userAgent: string
    osName: string
    ipAddress: string
  }

export interface CardGiftData {
  cardName: string
  id: string
  receiver: string
  
}


export interface CardGiftSending {
  localWallet: string
  localWalletKey: string
  senderWalletAddress: string
  receiverWalletAddress: string
}