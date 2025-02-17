import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Fili8 } from "../target/types/fili_8";
import { createMint } from "@solana/spl-token";

describe("fili8", () => {
  // Configure the client to use the local cluster.
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.Fili8 as Program<Fili8>;

  // Accounts.
  const initializer = anchor.web3.Keypair.generate();
  const admin = anchor.web3.Keypair.generate();
  const treasury = anchor.web3.Keypair.generate();

  let config: anchor.web3.PublicKey;
  let rewardMint: anchor.web3.PublicKey;

  before(async () => {
    [config] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("config")],
      program.programId
    );

    rewardMint = await createMint(
      provider.connection,
      initializer,
      initializer.publicKey,
      null,
      6
    );
  });

  it("initialize config", async () => {
    await program.methods
      .initializeConfig(undefined, 1000, 1000)
      .accountsPartial({
        initializer: initializer.publicKey,
        config,
        rewardMint,
        treasury: treasury.publicKey,
      })
      .signers([initializer])
      .rpc();
  });
});
