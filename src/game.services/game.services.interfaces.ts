//** IMPORTED TYPE INTERFACES
import { CardInventory, IveEquip } from "../noobs/noobs";

//**  TYPE INTERFACE

/**
 * Represents the return data structure from MemgraphDB needed to open the CardInventory.
 *
 * @property {localWallet} localWallet - the generated local wallet of the user.
 * @property {localWalletKey} localWalletKey - the password for the local wallet of the user.
 * @property {cardInventory} cardInventory - the users card inventory slots that may have an item inside or none.
 */
export interface CardInventoryOpen {
    localWallet: string
    localWalletKey: string
    cardInventory: string
}

/**
 * Represents the return data structure from the card Editition Contract in the blockchain.
 *
 * @property {metadata} the CardMetaData interface.
 * @property {owner} the wallet address that owns the card NFT.
 * @property {type} the type of NFT Standard which is ERC-1155 for the card NFTs.
 * @property {supply} the number of the same NFTs minted, note each Card NFTs are uniquely minted.
 * @property {quantityOwned} the number of this card NFT owned by the owner address.
 */
export interface CardNFT {
    metadata: CardMetaData
    owner: string
    type: "ERC1155"
    supply: string
    quantityOwned?: string
  }

/**
 * Represents the card metadata interface which is the a property of the CardNFT object.
 *
 * @property {breakthrough} Card property that dictates if the card is ready to go the next tier by reaching the breakthrough level.
 * @property {cardAddress} the contract address that minted the card.
 * @property {description} the higher level description ofthe card meant to be readable for players.
 * @property {era} the era model/design of the card, corresponds to the title track of the group's song.
 * @property {experience} the experience gained by the card.
 * @property {healboost} the health recovery boost added by the card while playing.
 * @property {id} the card's token ID relative to the contract where it was minted from.
 * @property {image} the URI of the card's image from IPFS.
 * @property {level} the current level of the card.
 * @property {name} the card's name. The naming standard is: Artist's name + Era + Rarity.
 * @property {owner} the wallet address of the owner
 * @property {position} the position of the artist in their respective group. Also corresponsds to the equip slot in the game inventory
 * @property {position} the secondary position of the artist in their respective group. Also corresponsds to the equip slot in the game inventory
 * @property {quantityOwned} the number of this card NFT owned by the owner address.
 * @property {rarity} the rarity of the card
 * @property {scoreboost} the score boost added by the card while playing
 * @property {skill} the skill that a card adds while in-game, a card doesn't always have a skill
 * @property {stars} indicates the stars a card has indicating if it's ready for breakthrough to next tier, the starts are relative to the card's level
 * @property {supply} the number of this card's duplicates
 * @property {tier} the tier of the card
 * @property {type} the type of the card's NFT standard which ERC-1155
 * @property {uri} the uri of the card saved on IPFS which contains the cards metadata
 */
export interface CardMetaData {
      name: string;
      description: string;
      image: string;
      id: string;
      uri: string;
      boostCount: string;
      breakthrough: string;
      era: string;
      experience: string;
      experienceRequired: string;
      group: string;
      healBoost: string;
      itemType: string;
      level: string;
      position: string;
      position2: string;
      rarity: string;
      scoreBoost: string;
      skill: string;
      slot: string;
      stars: string;
      supply: string;
      tier: string;
   };


/**
 * Represents equipment slots for the inventory system.
 *
 * @interface
 * @property {IveEquip} iveEquip - Object containing equipment slot for IVE Cards individual members.
 */
export interface EquipmentSlots {
  IveEquip: IveEquip;
}

/**
 * Represents metadata associated with a card, with URI as the main key.
 *
 * @interface
 * @property {object} uri - Object containing metadata for a card, where the key is the URI.
 * @property {string} uri.name - The name of the card.
 * @property {string} uri.description - The description of the card.
 * @property {string} uri.image - The image URL associated with the card.
 * @property {string} uri.id - The unique identifier of the card.
 * @property {string} uri.boostCount - The boost count of the card.
 * @property {string} uri.breakthrough - The breakthrough status of the card.
 * @property {string} uri.era - The era to which the card belongs.
 * @property {string} uri.experience - The experience of the card.
 * @property {string} uri.experienceRequired - The required experience for the card.
 * @property {string} uri.group - The group to which the card belongs.
 * @property {string} uri.healBoost - The heal boost of the card.
 * @property {string} uri.itemType - The type of item represented by the card.
 * @property {string} uri.level - The level of the card.
 * @property {string} uri.position - The primary position of the card.
 * @property {string} uri.position2 - The secondary position of the card.
 * @property {string} uri.rarity - The rarity of the card.
 * @property {string} uri.scoreBoost - The score boost of the card.
 * @property {string} uri.skill - The skill associated with the card.
 * @property {string} uri.slot - The slot to which the card belongs.
 * @property {string} uri.stars - The star rating of the card.
 * @property {string} uri.supply - The supply count of the card.
 * @property {string} uri.tier - The tier of the card.
 */
export interface CardsData {
  uri: {
    name: string;
    description: string;
    image: string;
    id: string;
    boostCount: string;
    breakthrough: string;
    era: string;
    experience: string;
    experienceRequired: string;
    group: string;
    healBoost: string;
    itemType: string;
    level: string;
    position: string;
    position2: string;
    rarity: string;
    scoreBoost: string;
    skill: string;
    slot: string;
    stars: string;
    supply: string;
    tier: string;
  };
}

export interface SuccessResponse{
  success: string;
};

export interface InventoryCardData{
  slotEquipment: EquipmentSlots;
  inventoryCard: CardInventory;
  cardsData: Record<string, CardsData['uri']>}


export interface BundleRewards {
    tokenReward:  {
      contractAddress: string;
      quantityPerReward: string | number;
  }[]
  cardReWards: {
    tokenId: string | number | bigint;
    contractAddress: string;
    quantityPerReward: string | number | bigint;
}[]

}

export interface ClassicScoreStats {
   username: string
   highscore: boolean
   difficulty: string
   score: number
   finalStats: {
    score: number
    combo: number
    maxCombo: number
    accuracy: number
    map: string
    finished: boolean
    songName: string
   }
   noteStats: {
    perfect: number
    veryGood: number
    good: number
    bad: number
    miss: number
   }

}

/**
 * Represents the statistics for a classic mode score.
 *
 * @interface ClassicScoreStats
 * @property {string} username - The username of the player.
 * @property {boolean} highscore - Indicates whether the score is a highscore.
 * @property {string} difficulty - The difficulty level of the score.
 * @property {number} score - The overall score achieved.
 * @property {Object} finalStats - The final statistics of the score.
 * @property {number} finalStats.score - The score achieved.
 * @property {number} finalStats.combo - The combo achieved.
 * @property {number} finalStats.maxCombo - The maximum combo achieved.
 * @property {number} finalStats.accuracy - The accuracy of the score.
 * @property {string} finalStats.map - The map used for the score.
 * @property {boolean} finalStats.finished - Indicates whether the song was finished.
 * @property {string} finalStats.songName - The name of the song.
 * @property {Object} noteStats - The statistics for each type of note hit.
 * @property {number} noteStats.perfect - The number of perfect notes hit.
 * @property {number} noteStats.veryGood - The number of very good notes hit.
 * @property {number} noteStats.good - The number of good notes hit.
 * @property {number} noteStats.bad - The number of bad notes hit.
 * @property {number} noteStats.miss - The number of missed notes.
 */
export interface ClassicScoreStats {
  username: string;
  highscore: boolean;
  difficulty: string;
  score: number;
  finalStats: {
   score: number;
   combo: number;
   maxCombo: number;
   accuracy: number;
   map: string;
   finished: boolean;
   songName: string;
  };
  noteStats: {
   perfect: number;
   veryGood: number;
   good: number;
   bad: number;
   miss: number;
  };
}

/**
* Represents the request parameters for retrieving classic mode leaderboard.
*
* @interface ClassicLeaderboardRequest
* @property {string} gameMode - The game mode for which the leaderboard is requested.
* @property {string} songName - The name of the song for the leaderboard.
* @property {string} period - The period for which the leaderboard is requested.
* @property {string} difficulty - The difficulty level for the leaderboard.
*/
export interface ClassicLeaderboardRequest {
 gameMode: string;
 songName: string;
 period: string;
 difficulty: string;
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
 * Represents the statistics of a player.
 *
 * @interface PlayerStats
 * @property {number} level - The player's level.
 * @property {number} playerExp - The player's experience points.
 * @property {number} availStatPoints - The available stat points for the player.
 * @property {string} rank - The player's rank.
 * @property {Object} statPointsSaved - The saved stat points for different roles.
 * @property {number} statPointsSaved.mainVocalist - The saved stat points for the main vocalist role.
 * @property {number} statPointsSaved.rapper - The saved stat points for the rapper role.
 * @property {number} statPointsSaved.leadDancer - The saved stat points for the lead dancer role.
 * @property {number} statPointsSaved.leadVocalist - The saved stat points for the lead vocalist role.
 * @property {number} statPointsSaved.mainDancer - The saved stat points for the main dancer role.
 * @property {number} statPointsSaved.visual - The saved stat points for the visual role.
 * @property {number} statPointsSaved.leadRapper - The saved stat points for the lead rapper role.
 */
export interface PlayerStats {
  level: number;
  playerExp: number;
  availStatPoints: number;
  rank: string;
  statPointsSaved: {
    mainVocalist: number;
    rapper: number;
    leadDancer: number;
    leadVocalist: number;
    mainDancer: number;
    visual: number;
    leadRapper: number;
  };
}

export interface LevelUpResult {
  currentLevel: number;
  currentExperience: number;
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
  