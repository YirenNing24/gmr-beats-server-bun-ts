/**
 * Interface for storing card data.
 */
export interface StoreCardData {
    /** Name of the card. */
    name: string;
    /** Description of the card. */
    description: string;
    /** Group to which the card belongs. */
    group: string;
    /** Era of the card. */
    era: string;
    /** Score boost of the card. */
    scoreBoost: string;
    /** Heal boost of the card. */
    healBoost: string;
    /** Skill of the card. */
    skill: string;
    /** Number of stars on the card. */
    stars: string;
    /** Slot of the card. */
    slot: string;
    /** Tier of the card. */
    tier: string;
    /** Number of boost counts. */
    boostCount: string;
    /** Number of awaken counts. */
    awakenCount: string;
    /** Indicates if the card has undergone breakthrough. */
    breakthrough: boolean;
    /** Artist of the card. */
    artist: string; 
    /** Position of the card. */
    position: string;
    /** Secondary position of the card. */
    position2: string;
    /** Rarity of the card. */
    rarity: string;
    /** Level of the card. */
    level: string;
    /** Experience of the card. */
    experience: string;
    /** URL of the image of the card. */
    image: string;
    /** Image data in bytes. */
    imageByte: string;

    /** URI of the card. */
    uri: string;
    /** Owner of the card. */
    owner: string;
    /** Token ID of the card. */
    tokenId: string
    /** Unique ID of the card. */
    id: string;
    /** Listing ID of the card. */
    listingId: number;
    /** Address of the card. */
    cardAddress: string;
    /** Uploader of the card. */
    uploader: string;
    /** Total supply of the card. */
    supply: string;
    /** Quantity of the card. */
    quantity: 1
    /** Quantity owned of the card. */
    quantityOwned: string
    /** Start time of the listing. */
    startTime?: string;
    /** End time of the listing. */
    endTime?: string;
    /** Lister of the card. */
    lister?: string;
    /** Indicates if the card is sold. */
    sold: true;
    /** Price per token of the card. */
    pricePerToken?: number
    /** Name of the currency. */
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
