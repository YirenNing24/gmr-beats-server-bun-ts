//** MEMGRAPH DRIVER AND TYPES
import { Driver, ManagedTransaction, QueryResult, RecordShape, Session } from "neo4j-driver";

//** THIRDWEB IMPORTS
import { Pack, ThirdwebSDK } from "@thirdweb-dev/sdk";

//** THIRDWEB IMPORT * TYPES
import { LocalWalletNode } from "@thirdweb-dev/wallets/evm/wallets/local-wallet-node";
import { SmartWallet } from "@thirdweb-dev/wallets";

//** VALIDATION ERROR
import ValidationError from "../../outputs/validation.error";

//** IMPORTED SERVICES
import { PACK_ADDRESS, SECRET_KEY, CHAIN, SMART_WALLET_CONFIG } from "../../config/constants";
import TokenService from "../../user.services/token.services/token.service";

//** TYPE INTERFACES
import { BundleRewards, RedeemBundle } from "./gacha.interface";
import { UserData } from "../../user.services/user.service.interface";

//** CYPHER IMPORT
import { redeemBundle } from "./gacha.cypher";



class GachaService {
    driver?: Driver;
    constructor(driver?: Driver) {
        this.driver = driver;
    }
    //Redeems a bundle for a user and returns the rewards obtaine
    public async redeemBundle(body: RedeemBundle, token: string): Promise<BundleRewards> {
        try {

            const tokenService: TokenService = new TokenService();
            const userName: string = await tokenService.verifyAccessToken(token);

            const session: Session | undefined = this.driver?.session();
            // Use a Read Transaction and only return the necessary properties
            const result: QueryResult<RecordShape> | undefined = await session?.executeRead(
              (tx: ManagedTransaction) =>
                tx.run(redeemBundle, { userName }
                )
            );

            // Verify the user exists
            if (result?.records.length === 0) {
                throw new ValidationError(`User with username '${userName}' not found.`, "");
            }
        
            const userData: UserData = result?.records[0].get("u");
            const { localWallet, localWalletKey } = userData.properties

            const walletLocal: LocalWalletNode = new LocalWalletNode({ chain: CHAIN });
            await walletLocal.import({
              encryptedJson: localWallet,
              password: localWalletKey,
            });
      
            // Connect the smart wallet
            const smartWallet: SmartWallet = new SmartWallet(SMART_WALLET_CONFIG);
            await smartWallet.connect({
              personalWallet: walletLocal,
            });
      
            // Use the SDK normally
            const sdk: ThirdwebSDK = await ThirdwebSDK.fromWallet(smartWallet, CHAIN, {
              secretKey: SECRET_KEY,
            });

            const bundleContract: Pack = await sdk.getContract(PACK_ADDRESS, "pack")
            const reward = await bundleContract.open(body.bundleId, 1)
            const { erc1155Rewards, erc20Rewards } = reward
        
        //@ts-ignore
        return { erc1155Rewards, erc20Rewards } as BundleRewards
        } catch(error: any) {
          console.error("Error in redeeming bundle: ", error)
          throw error
      }

    }

}

export default GachaService