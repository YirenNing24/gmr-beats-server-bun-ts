import { ThirdwebSDK } from "@thirdweb-dev/sdk";
import { LocalWalletNode } from "@thirdweb-dev/wallets/evm/wallets/local-wallet-node";
import { CHAIN, FACTORIES, BEATS_TOKEN, KMR_TOKEN, THUMP_TOKEN, SECRET_KEY, SMART_WALLET_CONFIG} from "../config/constants";
import { SmartWallet } from "@thirdweb-dev/wallets";

/**
 * Public class representing a WalletService.
 */
export default class WalletService {
  /**
   * Creates a wallet and returns the wallet data.
   * @param {string} password - The password for encrypting the wallet data.
   * @returns {Promise<object>} - The wallet data.
   */
  async createWallet(password: string): Promise<object> {
    try {
      const factoryAddress = FACTORIES[CHAIN.chainId];
      // Local signer
      const newWallet = new LocalWalletNode({ chain: CHAIN });
      console.log("Running on", CHAIN.slug, "with factory", factoryAddress);
      await newWallet.generate();
      const localWallet:Object = await newWallet.export({
        strategy: "encryptedJson",
        password: password,
      });

      return localWallet;
    } catch (error) {
      console.error("Something went wrong: ", error);
      throw error;
    }
  }

  /**
   * Imports a wallet using the provided wallet data and password.
   *
   * @param {string} walletData - The encrypted wallet data.
   * @param {string} password - The password for decrypting the wallet data.
   *
   * @returns {Object} An object containing the local wallet's 0x address and balance information.
   */
  async importWallet(walletData: string, password: string): Promise<object> {
    
    try {
      const localWallet = new LocalWalletNode({ chain: CHAIN });
      await localWallet.import({
        encryptedJson: walletData,
        password: password,
      });

      // Connect the smart wallet
      const smartWallet = new SmartWallet(SMART_WALLET_CONFIG);

      await smartWallet.connect({
        personalWallet: localWallet,
      });

      // Use the SDK normally
      const sdk = await ThirdwebSDK.fromWallet(smartWallet, CHAIN, {
        secretKey: SECRET_KEY,
      });

      // Fetch token balances using the SDK
      const [beatsBalance, kmrBalance, thumpBalance, nativeBalance, smartWalletAddress] = await Promise.all([
        sdk.wallet.balance(BEATS_TOKEN),
        sdk.wallet.balance(KMR_TOKEN),
        sdk.wallet.balance(THUMP_TOKEN),
        sdk.wallet.balance(),
        sdk.wallet.getAddress()
      ]);

      // Return an object containing the wallet's 0x address and balance information
      return {
        smartWalletAddress,
        beatsBalance: beatsBalance.displayValue,
        kmrBalance: kmrBalance.displayValue,
        thumpBalance: thumpBalance.displayValue,
        nativeBalance: nativeBalance.displayValue,
      };
    } catch (error) {
      // If any error occurs during the import process or connecting to the smart wallet,
      // it will be caught here, and an appropriate error message will be thrown.
      console.error("Something went wrong: ", error);
      throw error;
    }
  }
}
