import app from "../app";
import ValidationError from "../errors/validation.error";
import { ThirdwebSDK } from "@thirdweb-dev/sdk";
import { LocalWalletNode } from "@thirdweb-dev/wallets/evm/wallets/local-wallet-node";
import { CHAIN, SMART_WALLET_CONFIG } from "../config/constants";
import { SmartWallet } from "@thirdweb-dev/wallets";
import { CARD_MARKETPLACE } from "../config/constants";
import { Driver } from "neo4j-driver-core";

export default class StoreService {
  driver: Driver;

  constructor(driver: Driver) {
    this.driver = driver;
  }

  async getCards(itemType: string): Promise<any[]> {
    try {
      if (itemType === "cards") {
        const tx = await app.redis.get("cardStore");
        if (tx === null) {
          return [];
        }
        //@ts-ignore
        return tx;
      }
      return [];
    } catch (error) {
      console.error("Error fetching items:", error);
      throw new Error("Failed to fetch items.");
    }
  }

  async buyCard(tokenId: number, cardName: string, username: string): Promise<any> {
    try {
      const session = this.driver.session();
      const res = await session.executeRead((tx) =>
        tx.run("MATCH (u:User {username: $username}) RETURN u", { username })
      );
      await session.close();

      if (res.records.length === 0) {
        throw new ValidationError(`User with username '${username}' not found.`, {});
      }

      const userData = res.records[0].get("u");
      const { localWallet, localWalletKey } = userData.properties;

      const walletLocal = new LocalWalletNode({ chain: CHAIN });
      await walletLocal.import({
        encryptedJson: localWallet,
        password: localWalletKey,
      });

      const smartWallet = new SmartWallet(SMART_WALLET_CONFIG);
      await smartWallet.connect({
        personalWallet: walletLocal,
      });

      const sdk = await ThirdwebSDK.fromWallet(smartWallet, CHAIN);
      const contract = await sdk.getContract(CARD_MARKETPLACE, "marketplace-v3");
      await contract.directListings.buyFromListing(tokenId, 1);

      return { success: "ok" };
    } catch (error) {
      return { error: error };
    }
  }

  async getBundles(itemType: string): Promise<any[]> {
    try {
      if (itemType === "bundles") {
        const tx = await app.redis.get("bundleStore");
        if (tx === null) {
          return [];
        }
        //@ts-ignore
        return tx;
      }
      return [];
    } catch (error) {
      console.error("Error fetching items:", error);
      throw new Error("Failed to fetch items.");
    }
  }
}
