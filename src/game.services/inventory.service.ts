import { Edition, NFT, ThirdwebSDK } from "@thirdweb-dev/sdk";
import { LocalWalletNode } from "@thirdweb-dev/wallets/evm/wallets/local-wallet-node";
import { CHAIN, EDITION_ADDRESS, SMART_WALLET_CONFIG } from "../config/constants";
import { SmartWallet } from "@thirdweb-dev/wallets";
import ValidationError from "../errors/validation.error";
import { Driver } from "neo4j-driver";


class InventoryService {

driver: Driver;
constructor(driver: Driver) {
    this.driver = driver;
}
  
    async getCards(username: string): Promise<any> {
        try {
          const session = this.driver.session();
          const res = await session.executeRead((tx) =>
            tx.run("MATCH (u:User {username: $username}) RETURN u", { username })
          );
          await session.close();
    
          if (res.records.length === 0) {
            throw new ValidationError(`User with username '${username}' not found.`, '');
          }
    
          const userData = res.records[0].get("u");
          const { localWallet, localWalletKey } = userData.properties;
    
          const walletLocal: LocalWalletNode = new LocalWalletNode({ chain: CHAIN });
          await walletLocal.import({
            encryptedJson: localWallet,
            password: localWalletKey,
          });
    
          const smartWallet: SmartWallet = new SmartWallet(SMART_WALLET_CONFIG);
          await smartWallet.connect({
            personalWallet: walletLocal,
          });
    
          const sdk: ThirdwebSDK = await ThirdwebSDK.fromWallet(smartWallet, CHAIN);
          const contract: Edition = await sdk.getContract(EDITION_ADDRESS, "edition");
          const cards: NFT[] = await contract.getOwned(EDITION_ADDRESS)
    
          return cards;
        } catch (error: any) {
          return { error: error };
        }
      }

}
    //@test

export default  InventoryService