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
    sold: true;
    pricePerToken?: number
    currencyName?: string
}

export interface BuyCardData {
    uri: string;
    listingId: number
}