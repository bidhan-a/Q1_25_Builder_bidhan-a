import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Fili8 } from "../target/types/fili_8";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { LAMPORTS_PER_SOL, SystemProgram } from "@solana/web3.js";
import { assert } from "chai";

describe("fili8", () => {
  // Configure the client to use the local cluster.
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.Fili8 as Program<Fili8>;

  // Accounts.
  const initializerKeypair = anchor.web3.Keypair.generate();
  const merchantKeypair = anchor.web3.Keypair.generate();
  const affiliateKeypair = anchor.web3.Keypair.generate();

  // PDAs.
  let config: anchor.web3.PublicKey;
  let merchant: anchor.web3.PublicKey;
  let affiliate: anchor.web3.PublicKey;

  before(async () => {
    const latestBlockhash = await provider.connection.getLatestBlockhash();

    const initializerAirdrop = await provider.connection.requestAirdrop(
      initializerKeypair.publicKey,
      100 * LAMPORTS_PER_SOL
    );
    await provider.connection.confirmTransaction({
      signature: initializerAirdrop,
      blockhash: latestBlockhash.blockhash,
      lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
    });

    const merchantAirdrop = await provider.connection.requestAirdrop(
      merchantKeypair.publicKey,
      100 * LAMPORTS_PER_SOL
    );
    await provider.connection.confirmTransaction({
      signature: merchantAirdrop,
      blockhash: latestBlockhash.blockhash,
      lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
    });

    const affiliateAirdrop = await provider.connection.requestAirdrop(
      affiliateKeypair.publicKey,
      100 * LAMPORTS_PER_SOL
    );
    await provider.connection.confirmTransaction({
      signature: affiliateAirdrop,
      blockhash: latestBlockhash.blockhash,
      lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
    });

    [config] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("config")],
      program.programId
    );
    [merchant] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("merchant"), merchantKeypair.publicKey.toBuffer()],
      program.programId
    );
    [affiliate] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("affiliate"), affiliateKeypair.publicKey.toBuffer()],
      program.programId
    );
  });

  it("[initialize_config] initializes config", async () => {
    await program.methods
      .initializeConfig(100, 50)
      .accountsPartial({
        signer: initializerKeypair.publicKey,
        config,
        systemProgram: SystemProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .signers([initializerKeypair])
      .rpc();

    const configAccount = await program.account.config.fetch(config);
    assert.ok(configAccount.admin.equals(initializerKeypair.publicKey));
    assert.ok(configAccount.campaignCreationFee === 100);
    assert.ok(configAccount.commissionFee === 50);
  });

  it("[create_merchant] validates merchant name and description", async () => {
    const merchantName = "Merchant A";
    const merchantDescription = "Test description";
    const shortMerchantName = "Invalid";
    const longMerchantName = merchantName.repeat(10);
    const longMerchantDescription = merchantDescription.repeat(10);

    // Validate short name.
    try {
      await program.methods
        .createMerchant(shortMerchantName, merchantDescription)
        .accountsPartial({
          signer: merchantKeypair.publicKey,
          merchant,
          systemProgram: SystemProgram.programId,
        })
        .signers([merchantKeypair])
        .rpc();
    } catch (err) {
      assert.match(err.toString(), /NameTooShort/);
    }

    // Validate long name.
    try {
      await program.methods
        .createMerchant(longMerchantName, merchantDescription)
        .accountsPartial({
          signer: merchantKeypair.publicKey,
          merchant,
          systemProgram: SystemProgram.programId,
        })
        .signers([merchantKeypair])
        .rpc();
    } catch (err) {
      assert.match(err.toString(), /NameTooLong/);
    }

    // Validate long description.
    try {
      await program.methods
        .createMerchant(merchantName, longMerchantDescription)
        .accountsPartial({
          signer: merchantKeypair.publicKey,
          merchant,
          systemProgram: SystemProgram.programId,
        })
        .signers([merchantKeypair])
        .rpc();
    } catch (err) {
      assert.match(err.toString(), /DescriptionTooLong/);
    }
  });

  it("[create_merchant] creates merchant", async () => {
    const merchantName = "Merchant A";
    const merchantDescription = "I am a cool merchant.";

    await program.methods
      .createMerchant(merchantName, merchantDescription)
      .accountsPartial({
        signer: merchantKeypair.publicKey,
        merchant,
        systemProgram: SystemProgram.programId,
      })
      .signers([merchantKeypair])
      .rpc();

    const merchantAccount = await program.account.merchant.fetch(merchant);
    assert.ok(merchantAccount.name === merchantName);
    assert.ok(merchantAccount.description === merchantDescription);
    assert.ok(merchantAccount.totalCampaigns === 0);
    assert.ok(merchantAccount.totalSpent.eq(new anchor.BN(0)));
  });

  it("[create_affiliate] validates affiliate name and description", async () => {
    const affiliateName = "Affiliate A";
    const affiliateDescription = "Test description";
    const shortAffiliateName = "Invalid";
    const longAffiliateName = affiliateName.repeat(10);
    const longAffiliateDescription = affiliateDescription.repeat(10);

    // Validate short name.
    try {
      await program.methods
        .createAffiliate(shortAffiliateName, affiliateDescription)
        .accountsPartial({
          signer: affiliateKeypair.publicKey,
          affiliate,
          systemProgram: SystemProgram.programId,
        })
        .signers([affiliateKeypair])
        .rpc();
    } catch (err) {
      assert.match(err.toString(), /NameTooShort/);
    }

    // Validate long name.
    try {
      await program.methods
        .createAffiliate(longAffiliateName, affiliateDescription)
        .accountsPartial({
          signer: affiliateKeypair.publicKey,
          affiliate,
          systemProgram: SystemProgram.programId,
        })
        .signers([affiliateKeypair])
        .rpc();
    } catch (err) {
      assert.match(err.toString(), /NameTooLong/);
    }

    // Validate long description.
    try {
      await program.methods
        .createAffiliate(affiliateName, longAffiliateDescription)
        .accountsPartial({
          signer: affiliateKeypair.publicKey,
          affiliate,
          systemProgram: SystemProgram.programId,
        })
        .signers([affiliateKeypair])
        .rpc();
    } catch (err) {
      assert.match(err.toString(), /DescriptionTooLong/);
    }
  });

  it("[create_affiliate] creates affiliate", async () => {
    const affiliateName = "Affiliate A";
    const affiliateDescription = "I am a cool affiliate.";

    await program.methods
      .createAffiliate(affiliateName, affiliateDescription)
      .accountsPartial({
        signer: affiliateKeypair.publicKey,
        affiliate,
        systemProgram: SystemProgram.programId,
      })
      .signers([affiliateKeypair])
      .rpc();

    const affiliateAccount = await program.account.affiliate.fetch(affiliate);
    assert.ok(affiliateAccount.name === affiliateName);
    assert.ok(affiliateAccount.description === affiliateDescription);
    assert.ok(affiliateAccount.totalCampaigns === 0);
    assert.ok(affiliateAccount.totalEarned.eq(new anchor.BN(0)));
  });
});
