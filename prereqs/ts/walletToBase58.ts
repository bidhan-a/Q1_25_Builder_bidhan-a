import bs58 from "bs58";
import promptSync from "prompt-sync";

const prompt = promptSync();

(async () => {
  // Accept wallet.
  const wallet = prompt("Enter wallet: ");
  // Get private key.
  const privateKey = bs58.encode(Buffer.from(JSON.parse(wallet as string)));
  // Print private key.
  console.log(`Private key: ${privateKey}`);
})();
