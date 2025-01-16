import wallet from "../dev-wallet.json";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import {
  createGenericFile,
  createSignerFromKeypair,
  signerIdentity,
} from "@metaplex-foundation/umi";
import { irysUploader } from "@metaplex-foundation/umi-uploader-irys";

// Create a devnet connection
const umi = createUmi("https://api.devnet.solana.com");

let keypair = umi.eddsa.createKeypairFromSecretKey(new Uint8Array(wallet));
const signer = createSignerFromKeypair(umi, keypair);

umi.use(irysUploader());
umi.use(signerIdentity(signer));

(async () => {
  try {
    // Follow this JSON structure
    // https://docs.metaplex.com/programs/token-metadata/changelog/v1.0#json-structure
    const image =
      "https://devnet.irys.xyz/EKGmwbCHw8QkPzmcgqxMw9jErTGCmcG5uoATZ9y3QsWY";
    const metadata = {
      name: "Rug007",
      symbol: "RUG007",
      description: "Rug 007",
      image,
      attributes: [{ trait_type: "color", value: "green" }],
      properties: {
        files: [
          {
            type: "image/png",
            uri: image,
          },
        ],
      },
      creators: [],
    };
    const myUri = await umi.uploader.uploadJson(metadata);
    console.log("Your metadata URI: ", myUri); // Your metadata URI:  https://arweave.net/CFPbYt7D3gk7LtYMcGdGg3ECj2GMLuwtGKQ6i39rpUeu
  } catch (error) {
    console.log("Oops.. Something went wrong", error);
  }
})();
