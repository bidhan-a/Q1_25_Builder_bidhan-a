import { Keypair, PublicKey, Connection, Commitment } from "@solana/web3.js";
import { getOrCreateAssociatedTokenAccount, mintTo } from "@solana/spl-token";
import wallet from "../dev-wallet.json";

// Import our keypair from the wallet file
const keypair = Keypair.fromSecretKey(new Uint8Array(wallet));

//Create a Solana devnet connection
const commitment: Commitment = "confirmed";
const connection = new Connection("https://api.devnet.solana.com", commitment);

const token_decimals = 1_00_000_000n;

// Mint address
const mint = new PublicKey("8PwTZFDVrZP5CGhYpQf1sJC4dP6cNipQfvkXFx1jb9fs");

(async () => {
  try {
    // Create an ATA
    const ata = await getOrCreateAssociatedTokenAccount(
      connection,
      keypair,
      mint,
      keypair.publicKey
    );
    console.log(`Your ata is: ${ata.address.toBase58()}`); // Your ata is: BEMrXpAu4YSZBM3UKQkiKdtbWCCBhBG5Jp9m5DyGB7Wm

    // Mint to ATA
    const mintTx = await mintTo(
      connection,
      keypair,
      mint,
      ata.address,
      keypair.publicKey,
      1000 * 100000000
    );
    console.log(`Your mint txid: ${mintTx}`); // Your mint txid: 66ybi3Wm18zkG5ugTiNFh5HaZz6MUigZLSrQV3zDUafcLArfKby9i38veTEtTEmSBX5KpWdb4z2GH28XDQh6FTYW
  } catch (error) {
    console.log(`Oops, something went wrong: ${error}`);
  }
})();
