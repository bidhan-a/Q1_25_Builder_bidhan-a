import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Fili8 } from "../target/types/fili_8";
import { LAMPORTS_PER_SOL, SystemProgram } from "@solana/web3.js";
import { assert } from "chai";

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

describe("fili8", () => {
  // Configure the client to use the local cluster.
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.Fili8 as Program<Fili8>;

  // Accounts.
  const initializerKeypair = anchor.web3.Keypair.generate();
  const merchantKeypair = anchor.web3.Keypair.generate();
  const merchant2Keypair = anchor.web3.Keypair.generate();
  const affiliateKeypair = anchor.web3.Keypair.generate();
  const affiliate2Keypair = anchor.web3.Keypair.generate();
  const affiliate3Keypair = anchor.web3.Keypair.generate();

  // PDAs.
  let config: anchor.web3.PublicKey;
  let treasury: anchor.web3.PublicKey;
  let merchant: anchor.web3.PublicKey;
  let merchant2: anchor.web3.PublicKey;
  let affiliate: anchor.web3.PublicKey;
  let affiliate2: anchor.web3.PublicKey;
  let affiliate3: anchor.web3.PublicKey;
  let campaign: anchor.web3.PublicKey;
  let escrow: anchor.web3.PublicKey;
  let campaignAffiliate: anchor.web3.PublicKey;
  let campaignAffiliate2: anchor.web3.PublicKey;

  // Test values.
  const campaignCreationFee = 100;
  const commissionFee = 50;

  const merchantName = "Merchant A";
  const shortMerchantName = "Invalid";
  const longMerchantName = merchantName.repeat(10);
  const merchantDescription = "Test description.";
  const longMerchantDescription = merchantDescription.repeat(10);

  const affiliateName = "Affiliate A";
  const shortAffiliateName = "Invalid";
  const longAffiliateName = affiliateName.repeat(10);
  const affiliateDescription = "Test description.";
  const longAffiliateDescription = affiliateDescription.repeat(10);

  const campaignSeed = new anchor.BN(1);
  const campaignName = "Campaign A";
  const shortCampaignName = "Invalid";
  const longCampaignName = campaignName.repeat(10);
  const campaignDescription = "Test description.";
  const longCampaignDescription = campaignDescription.repeat(10);
  const productUri = "https://test.store.com/PRODUCT_ID";
  const invalidProductUri = "invalid";
  const campaignBudget = new anchor.BN(10 * LAMPORTS_PER_SOL);
  const commissionPerReferral = new anchor.BN(7 * LAMPORTS_PER_SOL);

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

    const merchant2Airdrop = await provider.connection.requestAirdrop(
      merchant2Keypair.publicKey,
      100 * LAMPORTS_PER_SOL
    );
    await provider.connection.confirmTransaction({
      signature: merchant2Airdrop,
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

    const affiliate2Airdrop = await provider.connection.requestAirdrop(
      affiliate2Keypair.publicKey,
      100 * LAMPORTS_PER_SOL
    );
    await provider.connection.confirmTransaction({
      signature: affiliate2Airdrop,
      blockhash: latestBlockhash.blockhash,
      lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
    });

    const affiliate3Airdrop = await provider.connection.requestAirdrop(
      affiliate3Keypair.publicKey,
      100 * LAMPORTS_PER_SOL
    );
    await provider.connection.confirmTransaction({
      signature: affiliate3Airdrop,
      blockhash: latestBlockhash.blockhash,
      lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
    });

    [config] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("config")],
      program.programId
    );
    [treasury] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("treasury")],
      program.programId
    );
    [merchant] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("merchant"), merchantKeypair.publicKey.toBuffer()],
      program.programId
    );
    [merchant2] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("merchant"), merchant2Keypair.publicKey.toBuffer()],
      program.programId
    );
    [affiliate] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("affiliate"), affiliateKeypair.publicKey.toBuffer()],
      program.programId
    );
    [affiliate2] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("affiliate"), affiliate2Keypair.publicKey.toBuffer()],
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
    [escrow] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("escrow"), campaign.toBuffer()],
      program.programId
    );
    [campaignAffiliate] = anchor.web3.PublicKey.findProgramAddressSync(
      [
        Buffer.from("campaign_affiliate"),
        campaign.toBuffer(),
        affiliate.toBuffer(),
      ],
      program.programId
    );
    [campaignAffiliate2] = anchor.web3.PublicKey.findProgramAddressSync(
      [
        Buffer.from("campaign_affiliate"),
        campaign.toBuffer(),
        affiliate2.toBuffer(),
      ],
      program.programId
    );
  });

  it("[initialize_config] initializes config", async () => {
    await program.methods
      .initializeConfig(campaignCreationFee, commissionFee)
      .accountsPartial({
        signer: initializerKeypair.publicKey,
        config,
        systemProgram: SystemProgram.programId,
      })
      .signers([initializerKeypair])
      .rpc();

    const configAccount = await program.account.config.fetch(config);
    assert.ok(configAccount.admin.equals(initializerKeypair.publicKey));
    assert.ok(configAccount.campaignCreationFee === campaignCreationFee);
    assert.ok(configAccount.commissionFee === commissionFee);
  });

  it("[create_merchant] validates merchant name", async () => {
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
    assert.ok(
      merchantAccount.owner.toString() === merchantKeypair.publicKey.toString()
    );
    assert.ok(merchantAccount.name === merchantName);
    assert.ok(merchantAccount.description === merchantDescription);
    assert.ok(merchantAccount.totalCampaigns === 0);
    assert.ok(merchantAccount.totalSpent.eq(new anchor.BN(0)));
  });

  it("[update_merchant] validates merchant name", async () => {
    // Validate short name.
    try {
      await program.methods
        .updateMerchant(shortMerchantName, null)
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
        .updateMerchant(longMerchantName, null)
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

  it("[update_merchant] validates merchant description", async () => {
    // Validate long description.
    try {
      await program.methods
        .updateMerchant(null, longMerchantDescription)
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

  it("[update_merchant] updates merchant", async () => {
    const newMerchantName = `${merchantName} (New)`;
    const newMerchantDescription = `${merchantDescription} (New)`;

    await program.methods
      .updateMerchant(newMerchantName, newMerchantDescription)
      .accountsPartial({
        signer: merchantKeypair.publicKey,
        merchant,
        systemProgram: SystemProgram.programId,
      })
      .signers([merchantKeypair])
      .rpc();

    const merchantAccount = await program.account.merchant.fetch(merchant);
    assert.ok(
      merchantAccount.owner.toString() === merchantKeypair.publicKey.toString()
    );
    assert.ok(merchantAccount.name === newMerchantName);
    assert.ok(merchantAccount.description === newMerchantDescription);
  });

  it("[create_affiliate] validates affiliate name", async () => {
    // Validate short name.
    try {
      await program.methods
        .createAffiliate(
          shortAffiliateName,
          affiliateDescription,
          affiliateKeypair.publicKey
        )
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
        .createAffiliate(
          longAffiliateName,
          affiliateDescription,
          affiliateKeypair.publicKey
        )
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
    // Validate long description.
    try {
      await program.methods
        .createAffiliate(
          affiliateName,
          longAffiliateDescription,
          affiliateKeypair.publicKey
        )
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
    await program.methods
      .createAffiliate(
        affiliateName,
        affiliateDescription,
        affiliateKeypair.publicKey
      )
      .accountsPartial({
        signer: affiliateKeypair.publicKey,
        affiliate,
        systemProgram: SystemProgram.programId,
      })
      .signers([affiliateKeypair])
      .rpc();

    const affiliateAccount = await program.account.affiliate.fetch(affiliate);
    assert.ok(
      affiliateAccount.owner.toString() ===
        affiliateKeypair.publicKey.toString()
    );
    assert.ok(affiliateAccount.name === affiliateName);
    assert.ok(affiliateAccount.description === affiliateDescription);
    assert.ok(affiliateAccount.totalCampaigns === 0);
    assert.ok(affiliateAccount.totalEarned.eq(new anchor.BN(0)));
  });

  it("[update_affiliate] validates affiliate name", async () => {
    // Validate short name.
    try {
      await program.methods
        .updateAffiliate(shortAffiliateName, null, null)
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
        .updateAffiliate(longAffiliateName, null, null)
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

  it("[update_affiliate] validates affiliate description", async () => {
    // Validate long description.
    try {
      await program.methods
        .updateAffiliate(null, longAffiliateDescription, null)
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

  it("[update_affiliate] updates affiliate", async () => {
    const newAffiliateName = `${affiliateName} (New)`;
    const newAffiliateDescription = `${affiliateDescription} (New)`;

    await program.methods
      .updateAffiliate(newAffiliateName, newAffiliateDescription, null)
      .accountsPartial({
        signer: affiliateKeypair.publicKey,
        affiliate,
        systemProgram: SystemProgram.programId,
      })
      .signers([affiliateKeypair])
      .rpc();

    const affiliateAccount = await program.account.affiliate.fetch(affiliate);
    assert.ok(affiliateAccount.name === newAffiliateName);
    assert.ok(affiliateAccount.description === newAffiliateDescription);
  });

  it("[create_campaign] validates campaign name", async () => {
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

  it("[create_campaign] validates campaign product_uri", async () => {
    // Validate long description.
    try {
      await program.methods
        .createCampaign(
          campaignSeed,
          campaignName,
          campaignDescription,
          invalidProductUri,
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
      assert.match(err.toString(), /InvalidProductURI/);
    }
  });

  it("[create_campaign] validates campaign end_date", async () => {
    const endDate = Math.floor(Date.now() / 1000) - 10; // 10 seconds ago.
    try {
      await program.methods
        .createCampaign(
          campaignSeed,
          campaignName,
          campaignDescription,
          productUri,
          campaignBudget,
          commissionPerReferral,
          new anchor.BN(endDate)
        )
        .accountsPartial({
          signer: merchantKeypair.publicKey,
          merchant,
          systemProgram: SystemProgram.programId,
        })
        .signers([merchantKeypair])
        .rpc();
    } catch (err) {
      assert.match(err.toString(), /InvalidCampaignPeriod/);
    }
  });

  it("[create_campaign] merchant creates a campaign", async () => {
    const treasuryBalanceBefore = new anchor.BN(
      await provider.connection.getBalance(treasury)
    );
    const escrowBalanceBefore = new anchor.BN(
      await provider.connection.getBalance(escrow)
    );

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

    const treasuryBalanceAfter = new anchor.BN(
      await provider.connection.getBalance(treasury)
    );
    const escrowBalanceAfter = new anchor.BN(
      await provider.connection.getBalance(escrow)
    );

    const campaignAccount = await program.account.campaign.fetch(campaign);
    assert.ok(campaignAccount.seed.eq(campaignSeed));
    assert.ok(campaignAccount.owner.toString() === merchant.toString());
    assert.ok(campaignAccount.name === campaignName);
    assert.ok(campaignAccount.description === campaignDescription);
    assert.ok(campaignAccount.productUri === productUri);
    assert.ok(campaignAccount.totalBudget.eq(campaignBudget));
    assert.ok(campaignAccount.availableBudget.eq(campaignBudget));
    assert.ok(campaignAccount.commissionPerReferral.eq(commissionPerReferral));
    assert.ok(campaignAccount.successfulReferrals === 0);
    assert.exists(campaignAccount.createdAt);
    assert.isNull(campaignAccount.endsAt);
    assert.isFalse(campaignAccount.isPaused);
    assert.ok(campaignAccount.totalAffiliates === 0);

    // Check if the budget was transferred to the escrow and the fees
    // were transferred to the treasury.
    const feeAmount = new anchor.BN(campaignCreationFee)
      .mul(campaignBudget)
      .div(new anchor.BN(10000));
    assert.ok(treasuryBalanceAfter.eq(treasuryBalanceBefore.add(feeAmount)));
    assert.ok(escrowBalanceAfter.eq(escrowBalanceBefore.add(campaignBudget)));
  });

  it("[join_campaign] affiliate joins a campaign", async () => {
    await program.methods
      .joinCampaign()
      .accountsPartial({
        signer: affiliateKeypair.publicKey,
        affiliate,
        campaign,
        campaignAffiliate,
        systemProgram: SystemProgram.programId,
      })
      .signers([affiliateKeypair])
      .rpc();

    const campaignAccount = await program.account.campaign.fetch(campaign);
    const affiliateAccount = await program.account.affiliate.fetch(affiliate);
    const campaignAffiliateAccount =
      await program.account.campaignAffiliate.fetch(campaignAffiliate);

    assert.ok(campaignAccount.totalAffiliates === 1);
    assert.ok(affiliateAccount.totalCampaigns === 1);
    assert.ok(
      campaignAffiliateAccount.campaign.toString() === campaign.toString()
    );
    assert.ok(
      campaignAffiliateAccount.affiliate.toString() === affiliate.toString()
    );
    assert.ok(campaignAffiliateAccount.successfulReferrals === 0);
    assert.ok(campaignAffiliateAccount.totalEarned.eq(new anchor.BN(0)));
    assert.ok(affiliateAccount.totalCampaigns === 1);
  });

  it("[report_conversion] validates campaign owner", async () => {
    try {
      // Create a second merchant.
      await program.methods
        .createMerchant(merchantName, merchantDescription)
        .accountsPartial({
          signer: merchant2Keypair.publicKey,
          merchant: merchant2,
          systemProgram: SystemProgram.programId,
        })
        .signers([merchant2Keypair])
        .rpc();

      // Merchant tries to report conversion for a campaign that they don't own.
      await program.methods
        .reportConversion()
        .accountsPartial({
          signer: merchant2Keypair.publicKey,
          merchant: merchant2,
          campaign,
          affiliate,
          payoutAddress: affiliateKeypair.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([merchant2Keypair])
        .rpc();
    } catch (err) {
      assert.match(err.toString(), /InvalidCampaignOwner/);
    }
  });

  it("[report_conversion] validates payout address", async () => {
    try {
      const randomKeypair = anchor.web3.Keypair.generate();
      await program.methods
        .reportConversion()
        .accountsPartial({
          signer: merchantKeypair.publicKey,
          merchant: merchant,
          campaign,
          affiliate,
          payoutAddress: randomKeypair.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([merchantKeypair])
        .rpc();
    } catch (err) {
      assert.match(err.toString(), /InvalidPayoutAddress/);
    }
  });

  it("[report_conversion] merchant reports a conversion", async () => {
    const treasuryBalanceBefore = new anchor.BN(
      await provider.connection.getBalance(treasury)
    );
    const escrowBalanceBefore = new anchor.BN(
      await provider.connection.getBalance(escrow)
    );
    const affiliatePayoutAddressBalanceBefore = new anchor.BN(
      await provider.connection.getBalance(affiliateKeypair.publicKey)
    );

    const merchantAccountBefore = await program.account.merchant.fetch(
      merchant
    );
    const affiliateAccountBefore = await program.account.affiliate.fetch(
      affiliate
    );
    const campaignAccountBefore = await program.account.campaign.fetch(
      campaign
    );
    const campaignAffiliateAccountBefore =
      await program.account.campaignAffiliate.fetch(campaignAffiliate);

    await program.methods
      .reportConversion()
      .accountsPartial({
        signer: merchantKeypair.publicKey,
        merchant: merchant,
        campaign,
        affiliate,
        payoutAddress: affiliateKeypair.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([merchantKeypair])
      .rpc();

    const treasuryBalanceAfter = new anchor.BN(
      await provider.connection.getBalance(treasury)
    );
    const escrowBalanceAfter = new anchor.BN(
      await provider.connection.getBalance(escrow)
    );
    const affiliatePayoutAddressBalanceAfter = new anchor.BN(
      await provider.connection.getBalance(affiliateKeypair.publicKey)
    );

    const merchantAccountAfter = await program.account.merchant.fetch(merchant);
    const affiliateAccountAfter = await program.account.affiliate.fetch(
      affiliate
    );
    const campaignAccountAfter = await program.account.campaign.fetch(campaign);
    const campaignAffiliateAccountAfter =
      await program.account.campaignAffiliate.fetch(campaignAffiliate);

    // Check if commission has been deducted from the escrow.
    assert.ok(
      escrowBalanceAfter.eq(escrowBalanceBefore.sub(commissionPerReferral))
    );

    // Check if commission fee has been transferred to the treasury.
    const feeAmount = new anchor.BN(commissionFee)
      .mul(commissionPerReferral)
      .div(new anchor.BN(10000));
    assert.ok(treasuryBalanceAfter.eq(treasuryBalanceBefore.add(feeAmount)));

    // Check if commission minus fee has been transferred to the affiliate's payout address.
    const commissionMinusFee = commissionPerReferral.sub(feeAmount);
    assert.ok(
      affiliatePayoutAddressBalanceAfter.eq(
        affiliatePayoutAddressBalanceBefore.add(commissionMinusFee)
      )
    );

    // Check state.

    // Merchant.
    assert.ok(
      merchantAccountAfter.totalSpent.eq(
        merchantAccountBefore.totalSpent.add(commissionPerReferral)
      )
    );

    // Affiliate.
    assert.ok(
      affiliateAccountAfter.totalEarned.eq(
        affiliateAccountBefore.totalEarned.add(commissionPerReferral)
      )
    );

    // Campaign.
    assert.ok(
      campaignAccountAfter.availableBudget.eq(
        campaignAccountBefore.availableBudget.sub(commissionPerReferral)
      )
    );
    assert.ok(
      campaignAccountAfter.successfulReferrals ===
        campaignAccountBefore.successfulReferrals + 1
    );
    // NOTE: The campaign should be paused because the available budget is
    // less than the commission per referral now.
    assert.ok(campaignAccountAfter.isPaused);

    // CampaignAffiliate.
    assert.ok(
      campaignAffiliateAccountAfter.successfulReferrals ===
        campaignAffiliateAccountBefore.successfulReferrals + 1
    );
    assert.ok(
      campaignAffiliateAccountAfter.totalEarned.eq(
        campaignAffiliateAccountBefore.totalEarned.add(commissionPerReferral)
      )
    );
  });

  it("[join_campaign] affiliate cannot join a paused campaign", async () => {
    // Create a second affiliate.
    await program.methods
      .createAffiliate(
        affiliateName,
        affiliateDescription,
        affiliate2Keypair.publicKey
      )
      .accountsPartial({
        signer: affiliate2Keypair.publicKey,
        affiliate: affiliate2,
        systemProgram: SystemProgram.programId,
      })
      .signers([affiliate2Keypair])
      .rpc();

    try {
      await program.methods
        .joinCampaign()
        .accountsPartial({
          signer: affiliate2Keypair.publicKey,
          affiliate: affiliate2,
          campaign,
          systemProgram: SystemProgram.programId,
        })
        .signers([affiliate2Keypair])
        .rpc();
    } catch (err) {
      assert.match(err.toString(), /CampaignPaused/);
    }
  });

  it("[update_campaign] validates campaign name", async () => {
    // Validate short name.
    try {
      await program.methods
        .updateCampaign(shortCampaignName, null, null, null, null, null)
        .accountsPartial({
          signer: merchantKeypair.publicKey,
          merchant,
          campaign,
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
        .updateCampaign(longCampaignName, null, null, null, null, null)
        .accountsPartial({
          signer: merchantKeypair.publicKey,
          merchant,
          campaign,
          systemProgram: SystemProgram.programId,
        })
        .signers([merchantKeypair])
        .rpc();
    } catch (err) {
      assert.match(err.toString(), /NameTooLong/);
    }
  });

  it("[update_campaign] validates campaign description", async () => {
    // Validate long description.
    try {
      await program.methods
        .updateCampaign(null, longCampaignDescription, null, null, null, null)
        .accountsPartial({
          signer: merchantKeypair.publicKey,
          merchant,
          campaign,
          systemProgram: SystemProgram.programId,
        })
        .signers([merchantKeypair])
        .rpc();
    } catch (err) {
      assert.match(err.toString(), /DescriptionTooLong/);
    }
  });

  it("[update_campaign] validates campaign product_uri", async () => {
    try {
      await program.methods
        .updateCampaign(null, null, invalidProductUri, null, null, null)
        .accountsPartial({
          signer: merchantKeypair.publicKey,
          merchant,
          campaign,
          systemProgram: SystemProgram.programId,
        })
        .signers([merchantKeypair])
        .rpc();
    } catch (err) {
      assert.match(err.toString(), /InvalidProductURI/);
    }
  });

  it("[update_campaign] validates campaign end_date", async () => {
    const endDate = Math.floor(Date.now() / 1000) - 10; // 10 seconds ago.
    try {
      await program.methods
        .updateCampaign(null, null, null, null, new anchor.BN(endDate), null)
        .accountsPartial({
          signer: merchantKeypair.publicKey,
          merchant,
          campaign,
          systemProgram: SystemProgram.programId,
        })
        .signers([merchantKeypair])
        .rpc();
    } catch (err) {
      assert.match(err.toString(), /InvalidCampaignPeriod/);
    }
  });

  it("[update_campaign] merchant updates a campaign", async () => {
    const newCampaignName = `${campaignName} (New)`;
    const newCampaignDescription = `${campaignDescription} (New)`;
    const newCampaignProductUri = `${productUri}/new`;
    const newCommissionPerReferral = new anchor.BN(5 * LAMPORTS_PER_SOL);

    await program.methods
      .updateCampaign(
        newCampaignName,
        newCampaignDescription,
        newCampaignProductUri,
        newCommissionPerReferral,
        null,
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

    const campaignAccount = await program.account.campaign.fetch(campaign);
    assert.ok(campaignAccount.name === newCampaignName);
    assert.ok(campaignAccount.description === newCampaignDescription);
    assert.ok(campaignAccount.productUri === newCampaignProductUri);
    assert.ok(
      campaignAccount.commissionPerReferral.eq(newCommissionPerReferral)
    );
  });

  it("[update_campaign] merchant adds more budget to the campaign", async () => {
    const treasuryBalanceBefore = new anchor.BN(
      await provider.connection.getBalance(treasury)
    );
    const escrowBalanceBefore = new anchor.BN(
      await provider.connection.getBalance(escrow)
    );

    const campaignAdditionalBudget = new anchor.BN(10 * LAMPORTS_PER_SOL);

    await program.methods
      .updateCampaign(null, null, null, null, null, campaignAdditionalBudget)
      .accountsPartial({
        signer: merchantKeypair.publicKey,
        merchant,
        campaign,
        systemProgram: SystemProgram.programId,
      })
      .signers([merchantKeypair])
      .rpc();

    const treasuryBalanceAfter = new anchor.BN(
      await provider.connection.getBalance(treasury)
    );
    const escrowBalanceAfter = new anchor.BN(
      await provider.connection.getBalance(escrow)
    );

    const campaignAccount = await program.account.campaign.fetch(campaign);

    // Check if the additonal budget was transferred to the escrow
    // and the fees were transferred to the treasury.
    const feeAmount = new anchor.BN(campaignCreationFee)
      .mul(campaignAdditionalBudget)
      .div(new anchor.BN(10000));
    assert.ok(treasuryBalanceAfter.eq(treasuryBalanceBefore.add(feeAmount)));
    assert.ok(
      escrowBalanceAfter.eq(escrowBalanceBefore.add(campaignAdditionalBudget))
    );

    // Now that the campaign has enough budget, it shouldn't be paused anymore.
    assert.ok(!campaignAccount.isPaused);
  });

  it("[join_campaign] affiliate can join a previously paused (now unpaused) campaign", async () => {
    await program.methods
      .joinCampaign()
      .accountsPartial({
        signer: affiliate2Keypair.publicKey,
        affiliate: affiliate2,
        campaign,
        systemProgram: SystemProgram.programId,
      })
      .signers([affiliate2Keypair])
      .rpc();

    const campaignAccount = await program.account.campaign.fetch(campaign);
    const affiliate2Account = await program.account.affiliate.fetch(affiliate2);
    const campaignAffiliate2Account =
      await program.account.campaignAffiliate.fetch(campaignAffiliate2);

    assert.ok(campaignAccount.totalAffiliates === 2);
    assert.ok(affiliate2Account.totalCampaigns === 1);
    assert.ok(
      campaignAffiliate2Account.campaign.toString() === campaign.toString()
    );
    assert.ok(
      campaignAffiliate2Account.affiliate.toString() === affiliate2.toString()
    );
    assert.ok(campaignAffiliate2Account.successfulReferrals === 0);
    assert.ok(campaignAffiliate2Account.totalEarned.eq(new anchor.BN(0)));
    assert.ok(affiliate2Account.totalCampaigns === 1);
  });

  it("[join_campaign] affiliate cannot join an expired campaign", async () => {
    // Update the end date so that it expires in 1 second from now.
    const newEndDate = new anchor.BN(Math.floor(Date.now() / 1000) + 1);
    await program.methods
      .updateCampaign(null, null, null, null, newEndDate, null)
      .accountsPartial({
        signer: merchantKeypair.publicKey,
        merchant,
        campaign,
        systemProgram: SystemProgram.programId,
      })
      .signers([merchantKeypair])
      .rpc();

    // Wait for campaign to expire.
    await delay(1000);

    // Create a third affiliate.
    await program.methods
      .createAffiliate(
        affiliateName,
        affiliateDescription,
        affiliate3Keypair.publicKey
      )
      .accountsPartial({
        signer: affiliate3Keypair.publicKey,
        affiliate: affiliate3,
        systemProgram: SystemProgram.programId,
      })
      .signers([affiliate3Keypair])
      .rpc();

    try {
      await program.methods
        .joinCampaign()
        .accountsPartial({
          signer: affiliate3Keypair.publicKey,
          affiliate: affiliate3,
          campaign,
          systemProgram: SystemProgram.programId,
        })
        .signers([affiliate3Keypair])
        .rpc();
    } catch (err) {
      assert.match(err.toString(), /CampaignExpired/);
    }
  });

  it("[close_campaign] validates campaign owner", async () => {
    try {
      // Merchant tries to close a campaign that they don't own.
      await program.methods
        .closeCampaign()
        .accountsPartial({
          signer: merchant2Keypair.publicKey,
          merchant: merchant2,
          campaign,
          withdrawAddress: merchant2Keypair.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([merchant2Keypair])
        .rpc();
    } catch (err) {
      assert.match(err.toString(), /InvalidCampaignOwner/);
    }
  });

  it("[close_campaign] merchant closes a campaign", async () => {
    const escrowBalanceBefore = new anchor.BN(
      await provider.connection.getBalance(escrow)
    );
    const merchantWithdrawAddressBalanceBefore = new anchor.BN(
      await provider.connection.getBalance(merchantKeypair.publicKey)
    );

    await program.methods
      .closeCampaign()
      .accountsPartial({
        signer: merchantKeypair.publicKey,
        merchant,
        campaign,
        withdrawAddress: merchantKeypair.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([merchantKeypair])
      .rpc();

    const merchantWithdrawAddressBalanceAfter = new anchor.BN(
      await provider.connection.getBalance(merchantKeypair.publicKey)
    );
    const campaignAccountAfter = await program.account.campaign.fetch(campaign);

    // Check if the remaining budget was transferred to the withdraw address.
    assert.ok(
      merchantWithdrawAddressBalanceAfter.eq(
        merchantWithdrawAddressBalanceBefore.add(escrowBalanceBefore)
      )
    );

    assert.ok(campaignAccountAfter.isClosed);
    assert.ok(campaignAccountAfter.availableBudget.eq(new anchor.BN(0)));
  });

  it("[join_campaign] affiliate cannot join a closed campaign", async () => {
    try {
      await program.methods
        .joinCampaign()
        .accountsPartial({
          signer: affiliate3Keypair.publicKey,
          affiliate: affiliate3,
          campaign,
          systemProgram: SystemProgram.programId,
        })
        .signers([affiliate3Keypair])
        .rpc();
    } catch (err) {
      assert.match(err.toString(), /CampaignClosed/);
    }
  });

  it("[close_campaign] merchant cannot close an already closed campaign", async () => {
    try {
      await program.methods
        .closeCampaign()
        .accountsPartial({
          signer: merchantKeypair.publicKey,
          merchant,
          campaign,
          withdrawAddress: merchantKeypair.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([merchantKeypair])
        .rpc();
    } catch (err) {
      assert.match(err.toString(), /CampaignClosed/);
    }
  });
});
