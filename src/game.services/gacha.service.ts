//** MEMGRAPH DRIVER AND TYPES
import { Driver, ManagedTransaction, QueryResult, RecordShape, Session } from "neo4j-driver";

//** THIRDWEB IMPORTS
import { Pack, ThirdwebSDK } from "@thirdweb-dev/sdk";
//** THIRDWEB IMPORT * TYPES
import { LocalWalletNode } from "@thirdweb-dev/wallets/evm/wallets/local-wallet-node";
import { SmartWallet } from "@thirdweb-dev/wallets";


//** VALIDATION ERROR
import ValidationError from "../outputs/validation.error";

//** IMPORTED SERVICES
import { PACK_ADDRESS, SECRET_KEY, CHAIN, SMART_WALLET_CONFIG } from "../config/constants";

//** TYPE INTERFACES
import { BundleRewards, CardInventoryOpen } from "./game.services.interfaces";




class GachaService {
    /**
     * Neo4j driver instance for database interactions.
     * @type {Driver|undefined}
     * @memberof InventoryService
     * @instance
     */
    driver?: Driver;

    /**
     * Creates an instance of InventoryService.
     *
     * @constructor
     * @param {Driver|undefined} driver - The Neo4j driver to be used for database interactions.
     * @memberof InventoryService
     * @instance
     */
    constructor(driver?: Driver) {
        this.driver = driver;
    }


    public async redeemBundle(userName: string, bundleId: number, amount: number = 1): Promise<BundleRewards> {
        try {
            const session: Session | undefined = this.driver?.session();
      
            // Use a Read Transaction and only return the necessary properties
            const result: QueryResult<RecordShape> | undefined = await session?.executeRead(
              (tx: ManagedTransaction) =>
                tx.run(
                  `MATCH (u:User {username: $userName}) 
                  RETURN u.localWallet as localWallet u.localWalletKey as localWalletKey`,
                  { userName }
                )
            );

            // Verify the user exists
            if (result?.records.length === 0) {
                throw new ValidationError(`User with username '${userName}' not found.`, "");
            }
        
            const walletData: RecordShape | undefined = result?.records[0].toObject();

            // Retrieve the required properties directly from the query result
            const { localWallet, localWalletKey } = walletData as CardInventoryOpen;

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
            const reward = await bundleContract.open(bundleId, amount)
            const { erc1155Rewards, erc20Rewards } = reward
        
        //@ts-ignore
        return { erc1155Rewards, erc20Rewards } as BundleRewards
        } catch(error: any) {
          throw error
      }

    }

}

export default GachaService