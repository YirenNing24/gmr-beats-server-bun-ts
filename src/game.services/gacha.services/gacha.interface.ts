/**
 * Represents the data required to redeem a bundle.
 *
 * @interface RedeemBundle
 * @property {number} bundleId - The ID of the bundle to be redeemed.
 * @property {number} amount - The amount of the bundle to be redeemed.
 */
export interface RedeemBundle {
    bundleId: number;
    amount: number;
}

/**
 * Represents the rewards obtained from redeeming a bundle.
 *
 * @interface BundleRewards
 * @property {Object[]} tokenReward - An array of token rewards.
 * @property {string} tokenReward[].contractAddress - The contract address of the token reward.
 * @property {string | number} tokenReward[].quantityPerReward - The quantity of tokens per reward.
 * @property {Object[]} cardRewards - An array of card rewards.
 * @property {string | number | bigint} cardRewards[].tokenId - The token ID of the card reward.
 * @property {string} cardRewards[].contractAddress - The contract address of the card reward.
 * @property {string | number | bigint} cardRewards[].quantityPerReward - The quantity of cards per reward.
 */
export interface BundleRewards {
    tokenReward: {
        contractAddress: string;
        quantityPerReward: string | number;
    }[];
    cardRewards: {
        tokenId: string | number | bigint;
        contractAddress: string;
        quantityPerReward: string | number | bigint;
    }[];
}

