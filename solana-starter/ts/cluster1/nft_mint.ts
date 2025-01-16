import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import {
  createSignerFromKeypair,
  signerIdentity,
  generateSigner,
  percentAmount,
} from "@metaplex-foundation/umi";
import {
  createNft,
  mplTokenMetadata,
} from "@metaplex-foundation/mpl-token-metadata";

import wallet from "../dev-wallet.json";
import base58 from "bs58";

const RPC_ENDPOINT = "https://api.devnet.solana.com";
const umi = createUmi(RPC_ENDPOINT);

let keypair = umi.eddsa.createKeypairFromSecretKey(new Uint8Array(wallet));
const myKeypairSigner = createSignerFromKeypair(umi, keypair);
umi.use(signerIdentity(myKeypairSigner));
umi.use(mplTokenMetadata());

const mint = generateSigner(umi);

(async () => {
  let tx = createNft(umi, {
    mint,
    name: "Rug007",
    symbol: "RUG007",
    uri: "https://devnet.irys.xyz/CFPbYt7D3gk7LtYMcGdGg3ECj2GMLuwtGKQ6i39rpUeu",
    sellerFeeBasisPoints: percentAmount(10),
  });
  let result = await tx.sendAndConfirm(umi);
  const signature = base58.encode(result.signature);

  console.log(
    `Succesfully Minted! Check out your TX here:\nhttps://explorer.solana.com/tx/${signature}?cluster=devnet`
  );

  console.log("Mint Address: ", mint.publicKey);

  // https://explorer.solana.com/tx/3UPhugwddsLNZeSJoAjo4fhYKkdoJbUp5v1iUYrmhEH5xpQfrSqSKgte8y3bM85fdT7UVTZ4imWwF8pqvrzZN8iM?cluster=devnet
  // Mint Address: JDbHd4mTiqzv6eqvXJFan23qRzg1CNv6dochbvwQx9vq
})();
