//** THIRDWEB IMPORT * TYPES
import { ThirdwebSDK } from "@thirdweb-dev/sdk";
import { LocalWalletNode } from "@thirdweb-dev/wallets/evm/wallets/local-wallet-node";
import { SmartWallet } from "@thirdweb-dev/wallets";


// * CONFIGS
import { CHAIN, BEATS_TOKEN, KMR_TOKEN, THUMP_TOKEN, SECRET_KEY, SMART_WALLET_CONFIG } from "../../config/constants";

//**  TYPE INTERFACE
import { WalletData } from "../user.service.interface";

/**
 * Public class representing a WalletService.
 */
export default class WalletService {

  //** Creates a wallet and returns the wallet data.
  public async createWallet(password: string): Promise<object> {
    try {
      // Local signer
      const newWallet: LocalWalletNode = new LocalWalletNode({ chain: CHAIN });
      await newWallet.generate();
      const localWallet: Object = await newWallet.export({
        strategy: "encryptedJson",
        password: password,
      });

      return localWallet;
    } catch (error) {
      console.error("Something went wrong: ", error);
      throw error;
    }
  }

  //** Imports a wallet using the provided wallet data and password.
  public async importWallet(walletData: string, password: string): Promise<WalletData> {
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
      const [beatsBalance, kmrBalance, thumpBalance, nativeBalance, smartWalletAddress] = await Promise.all([
        sdk.wallet.balance(BEATS_TOKEN),
        sdk.wallet.balance(KMR_TOKEN),
        sdk.wallet.balance(THUMP_TOKEN),
        sdk.wallet.balance(),
        sdk.wallet.getAddress()
      ])

      // Return an object containing the wallet's 0x address and balance information
      return {
        smartWalletAddress,
        beatsBalance: beatsBalance.displayValue,
        kmrBalance: kmrBalance.displayValue,
        thumpBalance: thumpBalance.displayValue,
        nativeBalance: nativeBalance.displayValue,
      } as WalletData
    } catch (error) {
      // If any error occurs during the import process or connecting to the smart wallet,
      // it will be caught here, and an appropriate error message will be thrown.
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


[
  {
    "metadata": {
      "name": "AccountExtension",
      "metadataURI": "ipfs://QmNQ2djT2u4my5xpKPgJMnQEpoNjYZE8ugpLndvgEJBb3X",
      "implementation": "0xCD68591e4F9FA55c4a9938A5574E22517047a055"
    },
    "functions": [
      {
        "functionSelector": "0x4a58db19",
        "functionSignature": "addDeposit()"
      },
      {
        "functionSelector": "0xe8a3d485",
        "functionSignature": "contractURI()"
      },
      {
        "functionSelector": "0xb61d27f6",
        "functionSignature": "execute(address,uint256,bytes)"
      },
      {
        "functionSelector": "0x47e1da2a",
        "functionSignature": "executeBatch(address[],uint256[],bytes[])"
      },
      {
        "functionSelector": "0x8b52d723",
        "functionSignature": "getAllActiveSigners()"
      },
      {
        "functionSelector": "0xe9523c97",
        "functionSignature": "getAllAdmins()"
      },
      {
        "functionSelector": "0xd42f2f35",
        "functionSignature": "getAllSigners()"
      },
      {
        "functionSelector": "0x399b77da",
        "functionSignature": "getMessageHash(bytes32)"
      },
      {
        "functionSelector": "0xf15d424e",
        "functionSignature": "getPermissionsForSigner(address)"
      },
      {
        "functionSelector": "0x7dff5a79",
        "functionSignature": "isActiveSigner(address)"
      },
      {
        "functionSelector": "0x24d7806c",
        "functionSignature": "isAdmin(address)"
      },
      {
        "functionSelector": "0x1626ba7e",
        "functionSignature": "isValidSignature(bytes32,bytes)"
      },
      {
        "functionSelector": "0xbc197c81",
        "functionSignature": "onERC1155BatchReceived(address,address,uint256[],uint256[],bytes)"
      },
      {
        "functionSelector": "0xf23a6e61",
        "functionSignature": "onERC1155Received(address,address,uint256,uint256,bytes)"
      },
      {
        "functionSelector": "0x150b7a02",
        "functionSignature": "onERC721Received(address,address,uint256,bytes)"
      },
      {
        "functionSelector": "0x938e3d7b",
        "functionSignature": "setContractURI(string)"
      },
      {
        "functionSelector": "0x5892e236",
        "functionSignature": "setPermissionsForSigner((address,uint8,address[],uint256,uint128,uint128,uint128,uint128,bytes32),bytes)"
      },
      {
        "functionSelector": "0x01ffc9a7",
        "functionSignature": "supportsInterface(bytes4)"
      },
      {
        "functionSelector": "0xa9082d84",
        "functionSignature": "verifySignerPermissionRequest((address,uint8,address[],uint256,uint128,uint128,uint128,uint128,bytes32),bytes)"
      },
      {
        "functionSelector": "0x4d44560d",
        "functionSignature": "withdrawDepositTo(address,uint256)"
      }
    ]
  }
]