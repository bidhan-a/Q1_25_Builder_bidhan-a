import wallet from "../dev-wallet.json";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import {
  createGenericFile,
  createSignerFromKeypair,
  signerIdentity,
} from "@metaplex-foundation/umi";
import { irysUploader } from "@metaplex-foundation/umi-uploader-irys";
import { readFile } from "fs/promises";

// Create a devnet connection
const umi = createUmi("https://api.devnet.solana.com");

let keypair = umi.eddsa.createKeypairFromSecretKey(new Uint8Array(wallet));
const signer = createSignerFromKeypair(umi, keypair);

umi.use(irysUploader());
umi.use(signerIdentity(signer));

(async () => {
  try {
    //1. Load image
    const image = await readFile("images/generug.png");

    //2. Convert image to generic file.
    const nft_image = createGenericFile(image, "generug", {
      contentType: "image/png",
    });

    //3. Upload image
    const [myUri] = await umi.uploader.upload([nft_image]);
    console.log("Your image URI: ", myUri); // Your image URI:  https://arweave.net/EKGmwbCHw8QkPzmcgqxMw9jErTGCmcG5uoATZ9y3QsWY
  } catch (error) {
    console.log("Oops.. Something went wrong", error);
  }
})();
