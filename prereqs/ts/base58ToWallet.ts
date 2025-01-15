import bs58 from "bs58";
import promptSync from "prompt-sync";

const prompt = promptSync();

(async () => {
  // Accept privateKey.
  const privateKey = prompt("Enter private key: ");
  // Get wallet.
  const wallet = bs58.decode(privateKey);
  // Print wallet.
  console.log(`Wallet: ${wallet}`);
})();
