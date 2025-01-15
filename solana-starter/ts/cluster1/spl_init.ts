import { Keypair, Connection, Commitment } from "@solana/web3.js";
import { createMint } from "@solana/spl-token";
import wallet from "../dev-wallet.json";

// Import our keypair from the wallet file
const keypair = Keypair.fromSecretKey(new Uint8Array(wallet));

//Create a Solana devnet connection
const commitment: Commitment = "confirmed";
const connection = new Connection("https://api.devnet.solana.com", commitment);

(async () => {
  try {
    // Start here
    const mint = await createMint(
      connection, // connection
      keypair, // fee payer
      keypair.publicKey, // mint authority
      keypair.publicKey, // freeze authority (you can use `null` to disable it. when you disable it, you can't turn it on again)
      8 // decimals
    );
    console.log(`mint: ${mint.toBase58()}`); // mint: 8PwTZFDVrZP5CGhYpQf1sJC4dP6cNipQfvkXFx1jb9fs
  } catch (error) {
    console.log(`Oops, something went wrong: ${error}`);
  }
})();
