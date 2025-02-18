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

  const campaignSeed = new anchor.BN(1);

  // Accounts.
  const initializerKeypair = anchor.web3.Keypair.generate();
  const merchantKeypair = anchor.web3.Keypair.generate();
  const affiliateKeypair = anchor.web3.Keypair.generate();

  // PDAs.
  let config: anchor.web3.PublicKey;
  let merchant: anchor.web3.PublicKey;
  let affiliate: anchor.web3.PublicKey;
  let campaign: anchor.web3.PublicKey;

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
    [campaign] = anchor.web3.PublicKey.findProgramAddressSync(
      [
        Buffer.from("campaign"),
        merchant.toBuffer(),
        campaignSeed.toBuffer("le", 8),
      ],
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

  it("[create_merchant] validates merchant name", async () => {
    const merchantName = "Merchant A";
    const merchantDescription = "Test description.";
    const shortMerchantName = "Invalid";
    const longMerchantName = merchantName.repeat(10);

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
  });

  it("[create_merchant] validates merchant description", async () => {
    const merchantName = "Merchant A";
    const merchantDescription = "Test description.";
    const longMerchantDescription = merchantDescription.repeat(10);

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
    const merchantDescription = "Test description.";

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

  it("[create_affiliate] validates affiliate name", async () => {
    const affiliateName = "Affiliate A";
    const affiliateDescription = "Test description.";
    const shortAffiliateName = "Invalid";
    const longAffiliateName = affiliateName.repeat(10);

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
  });

  it("[create_affiliate] validates affiliate description", async () => {
    const affiliateName = "Affiliate A";
    const affiliateDescription = "Test description.";
    const longAffiliateDescription = affiliateDescription.repeat(10);

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
    const affiliateDescription = "Test description.";

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

  it("[create_campaign] validates campaign name", async () => {
    const campaignName = "Campaign A";
    const campaignDescription = "Test description.";
    const productUri = "https://test.store.com/PRODUCT_ID";
    const campaignBudget = new anchor.BN(10 * LAMPORTS_PER_SOL);
    const commissionPerReferral = new anchor.BN(1 * LAMPORTS_PER_SOL);
    const shortCampaignName = "Invalid";
    const longCampaignName = campaignName.repeat(10);

    // Validate short name.
    try {
      await program.methods
        .createCampaign(
          campaignSeed,
          shortCampaignName,
          campaignDescription,
          productUri,
          campaignBudget,
          commissionPerReferral,
          null
        )
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
        .createCampaign(
          campaignSeed,
          longCampaignName,
          campaignDescription,
          productUri,
          campaignBudget,
          commissionPerReferral,
          null
        )
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
  });

  it("[create_campaign] validates campaign description", async () => {
    const campaignName = "Campaign A";
    const campaignDescription = "Test description.";
    const productUri = "https://test.store.com/PRODUCT_ID";
    const campaignBudget = new anchor.BN(10 * LAMPORTS_PER_SOL);
    const commissionPerReferral = new anchor.BN(1 * LAMPORTS_PER_SOL);
    const longCampaignDescription = campaignDescription.repeat(10);

    // Validate long description.
    try {
      await program.methods
        .createCampaign(
          campaignSeed,
          campaignName,
          longCampaignDescription,
          productUri,
          campaignBudget,
          commissionPerReferral,
          null
        )
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

  it("[create_campaign] creates a campaign", async () => {
    const campaignName = "Campaign A";
    const campaignDescription = "Test description.";
    const productUri = "https://test.store.com/PRODUCT_ID";
    const campaignBudget = new anchor.BN(10 * LAMPORTS_PER_SOL);
    const commissionPerReferral = new anchor.BN(1 * LAMPORTS_PER_SOL);

    await program.methods
      .createCampaign(
        campaignSeed,
        campaignName,
        campaignDescription,
        productUri,
        campaignBudget,
        commissionPerReferral,
        null
      )
      .accountsPartial({
        signer: merchantKeypair.publicKey,
        merchant,
        campaign,
        systemProgram: SystemProgram.programId,
      })
      .signers([merchantKeypair])
      .rpc();
  });
});
