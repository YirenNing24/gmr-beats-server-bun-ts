/**
 * Represents data of a card in the store.
 *
 * @interface StoreCardData
 * @property {string} name - Name of the card.
 * @property {string} description - Description of the card.
 * @property {string} group - Group to which the card belongs.
 * @property {string} era - Era of the card.
 * @property {string} scoreBoost - Score boost of the card.
 * @property {string} healBoost - Heal boost of the card.
 * @property {string} skill - Skill of the card.
 * @property {string} stars - Number of stars on the card.
 * @property {string} slot - Slot of the card.
 * @property {string} tier - Tier of the card.
 * @property {string} boostCount - Number of boost counts.
 * @property {string} awakenCount - Number of awaken counts.
 * @property {boolean} breakthrough - Indicates if the card has undergone breakthrough.
 * @property {string} artist - Artist of the card.
 * @property {string} position - Position of the card.
 * @property {string} position2 - Secondary position of the card.
 * @property {string} rarity - Rarity of the card.
 * @property {string} level - Level of the card.
 * @property {string} experience - Experience of the card.
 * @property {string} image - URL of the image of the card.
 * @property {string} uri - URI of the card.
 * @property {string} owner - Owner of the card.
 * @property {string} tokenId - Token ID of the card.
 * @property {string} id - Unique ID of the card.
 * @property {number} listingId - Listing ID of the card.
 * @property {string} cardAddress - Address of the card.
 * @property {string} uploader - Uploader of the card.
 * @property {string} supply - Total supply of the card.
 * @property {string} quantity - Quantity of the card.
 * @property {string} quantityOwned - Quantity owned of the card.
 * @property {string} startTime - Start time of the listing.
 * @property {string} endTime - End time of the listing.
 * @property {string} lister - Lister of the card.
 * @property {boolean} sold - Indicates if the card is sold.
 * @property {number} pricePerToken - Price per token of the card.
 * @property {string} currencyName - Name of the currency.
 */
export interface StoreCardData {
    name: string;
    description: string;
    group: string;
    era: string;
    scoreBoost: string;
    healBoost: string;
    skill: string;
    stars: string;
    slot: string;
    tier: string;
    boostCount: string;
    awakenCount: string;
    breakthrough: boolean;
    artist: string; 
    position: string;
    position2: string;
    rarity: string;
    level: string;
    experience: string;
    image: string;
    imageByte: string;
    uri: string;
    owner: string;
    tokenId: string
    id: string;
    listingId: number;
    cardAddress: string;
    uploader: string;
    supply: string;
    quantity: 1
    quantityOwned: string
    startTime?: string;
    endTime?: string;
    lister?: string;
    pricePerToken?: number
    currencyName?: string
}

/**
 * Interface for buying card data.
 */
export interface BuyCardData {
    /** URI of the card. */
    uri: string;
    /** Listing ID of the card. */
    listingId: number
}
