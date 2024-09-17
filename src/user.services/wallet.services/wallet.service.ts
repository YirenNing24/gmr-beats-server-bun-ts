//** THIRDWEB IMPORT * TYPES
import { Engine } from "@thirdweb-dev/engine";

//** CONFIG IMPORT
import { BEATS_TOKEN, GMR_TOKEN, ENGINE_ACCESS_TOKEN } from "../../config/constants";

//**  TYPE INTERFACE
import { WalletData } from "../user.service.interface";

const engine: Engine = new Engine({
  url: "http://localhost:3005",
  accessToken: ENGINE_ACCESS_TOKEN
});

class WalletService {

  //** Creates a wallet and returns the wallet address.
  public async createWallet(username: string): Promise<string> {
    try {
        // Create a new backend wallet with the player's username as the label
        const wallet = await engine.backendWallet.create({ label: username });

        // Extract the wallet address from the response
        const { walletAddress } = wallet.result;

        return walletAddress as string;
    } catch (error: any) {
        console.error("Error creating player wallet:", error);
        throw error;
    }
  }

  public async getWalletBalance(walletAddress: string) {
    try {
      const chain = "421614" //ARBITRUM SEPOLIA
      const [arbitrumToken, gmrToken, beatsToken] = await Promise.all([
        engine.backendWallet.getBalance(chain, walletAddress),
        engine.erc20.balanceOf(walletAddress, chain, GMR_TOKEN),
        engine.erc20.balanceOf(walletAddress, chain, BEATS_TOKEN)
      ]);

      return {
        smartWalletAddress: walletAddress,
        beatsBalance: beatsToken.result.displayValue,
        gmrBalance: gmrToken.result.displayValue,
        nativeBalance: arbitrumToken.result.displayValue,
      } as WalletData;
    } catch (error: any) {
      throw error;
    }
  }

}

export default WalletService