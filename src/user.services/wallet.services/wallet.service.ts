//** THIRDWEB IMPORT * TYPES
import { AccountFactory, ThirdwebSDK } from "@thirdweb-dev/sdk";
import { LocalWalletNode } from "@thirdweb-dev/wallets/evm/wallets/local-wallet-node";
import { SmartWallet } from "@thirdweb-dev/wallets";
import { smartWallet, inAppWallet, Wallet, Account } from "thirdweb/wallets";
import { ThirdwebClient, createThirdwebClient, getContract, defineChain } from "thirdweb";
import { getWalletBalance } from "thirdweb/wallets";

// * CONFIGS
import { CHAIN, BEATS_TOKEN, GMR_TOKEN, SECRET_KEY, SMART_WALLET_CONFIG } from "../../config/constants";

//**  TYPE INTERFACE
import { WalletData } from "../user.service.interface";

/**
 * Public class representing a WalletService.
 */
export default class WalletService {

  //** Creates a wallet and returns the wallet data.
  public async createWallet(password: string): Promise<{ localWallet: string, smartWalletAddress: string }> {
    try {
      const client: ThirdwebClient = createThirdwebClient({ 
        secretKey: SECRET_KEY
       });

      const wallet: Wallet<"inApp"> = inAppWallet();
      //  const personalAccount = wallet.getConfig()
      
       const personalAccount: Account = await wallet.connect({
         client,
         chain: CHAIN,
         strategy: "auth_endpoint",
         payload,
         encryptionKey
       })
      

       const contract = getContract({ 
        client, 
        chain: defineChain(421614), 
        address: "0x514f1d6B8d22911eE84f97eDececE0479e38E1b6",
      });

      const tx = await contract.accountFactory.createAccount(admin, extraData);


      // Local signer
      const newWallet: LocalWalletNode = new LocalWalletNode({ chain: CHAIN });
      await newWallet.generate();
      const localWallet: string = await newWallet.export({
        strategy: "encryptedJson",
        password: password,
      });
      const smartWalletAddress: string = await this.getWalletAddress(localWallet, password);

      return { localWallet, smartWalletAddress }
    } catch (error) {
      console.error("Something went wrong: ", error);
      throw error;
    }
  }

  //** Imports a wallet using the provided wallet data and password.
  public async importWallet(walletData: string, password: string): Promise<WalletData> {
    try {
      const client: ThirdwebClient = createThirdwebClient({ 
        secretKey: SECRET_KEY,
       });

      const wallet: Wallet<"inApp"> = inAppWallet();
      
      const personalAccount: Account = await wallet.connect({
        client,
        chain: CHAIN,
        strategy: "jwt",
        jwt: walletData,
        encryptionKey: password

      })
      // Then, connect the Smart Account
      const walletSmart: Wallet<"smart">= smartWallet(SMART_WALLET_CONFIG);


      walletSmart.connect({ client, personalAccount })
      const smartWalletAddress = walletSmart.getAccount()?.address as string | "" 

      console.log(smartWalletAddress)
      const promises = [
        getWalletBalance({ address: smartWalletAddress, client, chain: CHAIN, tokenAddress: BEATS_TOKEN }),
        getWalletBalance({ address: smartWalletAddress, client, chain: CHAIN, tokenAddress: GMR_TOKEN }),
        getWalletBalance({ address: smartWalletAddress, client, chain: CHAIN })
    ];
    
    // Execute all promises concurrently using Promise.all
    const [beatsBalance, gmrBalance, nativeBalance] = await Promise.all(promises);
      
  
      // Return an object containing the wallet's 0x address and balance information
      return {
        smartWalletAddress,
        beatsBalance: beatsBalance.displayValue,
        gmrBalance: gmrBalance.displayValue,
        nativeBalance: nativeBalance.displayValue,
      } as WalletData
    } catch (error: any) {
      console.error("Something went wrong: ", error);
      throw error;
    }
  }
























  public async getWalletAddress(walletData: string, password: string): Promise<string> {
    try {
      const localWallet: LocalWalletNode = new LocalWalletNode({ chain: CHAIN });
      await localWallet.import({
        encryptedJson: walletData,
        password: password,
      });

      // Connect the smart wallet
      const smartWallet: SmartWallet = new SmartWallet(SMART_WALLET_CONFIG);
      await smartWallet.connect({
        personalWallet: localWallet,
      });

      // Use the SDK normally
      const sdk: ThirdwebSDK = await ThirdwebSDK.fromWallet(smartWallet, CHAIN, {
        secretKey: SECRET_KEY,
      });

      // Fetch token balances using the SDK
      const [smartWalletAddress] = await Promise.all([
        sdk.wallet.getAddress()
      ])

      // Return an object containing the wallet's 0x
      return smartWalletAddress as string
    } catch (error: any) {
      throw error;
    }
  }
}
