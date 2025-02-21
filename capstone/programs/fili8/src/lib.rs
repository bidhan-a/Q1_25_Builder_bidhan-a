use anchor_lang::prelude::*;

declare_id!("28f44mAq1ioVtsXnK9QSFjS7iNcq2Vu3cPgrYdqoC9cS");

mod errors;
mod instructions;
mod state;

use instructions::*;

#[program]
pub mod fili_8 {
    use super::*;

    pub fn initialize_config(
        ctx: Context<InitializeConfig>,
        campaign_creation_fee: u16,
        commission_fee: u16,
    ) -> Result<()> {
        ctx.accounts
            .initialize_config(campaign_creation_fee, commission_fee, &ctx.bumps)
    }

    pub fn create_merchant(
        ctx: Context<CreateMerchant>,
        name: String,
        description: String,
    ) -> Result<()> {
        ctx.accounts.create_merchant(name, description, &ctx.bumps)
    }

    pub fn create_affiliate(
        ctx: Context<CreateAffiliate>,
        name: String,
        description: String,
        payout_address: Pubkey,
    ) -> Result<()> {
        ctx.accounts
            .create_affiliate(name, description, payout_address, &ctx.bumps)
    }

    pub fn create_campaign(
        ctx: Context<CreateCampaign>,
        seed: u64,
        name: String,
        description: String,
        product_uri: String,
        budget: u64,
        commission_per_referral: u64,
        ends_at: Option<i64>,
    ) -> Result<()> {
        ctx.accounts.create_campaign(
            seed,
            name,
            description,
            product_uri,
            budget,
            commission_per_referral,
            ends_at,
            &ctx.bumps,
        )
    }

    pub fn join_campaign(ctx: Context<JoinCampaign>) -> Result<()> {
        ctx.accounts.join_campaign(&ctx.bumps)
    }

    pub fn report_conversion(ctx: Context<ReportConversion>) -> Result<()> {
        ctx.accounts.report_conversion()
    }
}
