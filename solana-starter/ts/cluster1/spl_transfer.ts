import {
  Commitment,
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
} from "@solana/web3.js";
import wallet from "../dev-wallet.json";
import { getOrCreateAssociatedTokenAccount, transfer } from "@solana/spl-token";

// We're going to import our keypair from the wallet file
const keypair = Keypair.fromSecretKey(new Uint8Array(wallet));

//Create a Solana devnet connection
const commitment: Commitment = "confirmed";
const connection = new Connection("https://api.devnet.solana.com", commitment);

// Mint address
const mint = new PublicKey("8PwTZFDVrZP5CGhYpQf1sJC4dP6cNipQfvkXFx1jb9fs");

// Recipient address
const to = new PublicKey("5j9o8zeZYZ5DdyAW3nbF66m1qmF9mEDYXyP4qSErwKMc");

(async () => {
  try {
    // Get the token account of the fromWallet address, and if it does not exist, create it
    const fromTokenAccount = await getOrCreateAssociatedTokenAccount(
      connection,
      keypair,
      mint,
      keypair.publicKey
    );
    // Get the token account of the toWallet address, and if it does not exist, create it
    const toTokenAccount = await getOrCreateAssociatedTokenAccount(
      connection,
      keypair,
      mint,
      to
    );
    // Transfer the new token to the "toTokenAccount" we just created
    const transferTx = await transfer(
      connection,
      keypair,
      fromTokenAccount.address,
      toTokenAccount.address,
      keypair,
      100000000
    );
    console.log(`Transfer tx: ${transferTx}`); // Transfer tx: 3T8KCry4ii3zHQpJxbU5v2mF4NcZ6uZ42tCFh51gMFUaQjysaba6fqRMZsymRpysHY5pMptBoxDLTswdnrdQCcSD
  } catch (e) {
    console.error(`Oops, something went wrong: ${e}`);
  }
})();
