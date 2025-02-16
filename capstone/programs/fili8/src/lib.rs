use anchor_lang::prelude::*;

declare_id!("28f44mAq1ioVtsXnK9QSFjS7iNcq2Vu3cPgrYdqoC9cS");

mod errors;
mod instructions;
mod state;

use instructions::*;

#[program]
pub mod fili8 {
    use super::*;

    pub fn initialize_config(
        ctx: Context<InitializeConfig>,
        admin: Option<Pubkey>,
        fee_basis_points: u16,
    ) -> Result<()> {
        ctx.accounts
            .initialize_config(admin, fee_basis_points, &ctx.bumps)
    }

    pub fn create_campaign(
        ctx: Context<CreatCampaign>,
        seed: u64,
        owner: Option<Pubkey>,
        name: String,
        description: String,
        product_uri: String,
        budget: u64,
        commission_per_referral: u64,
        ends_at: Option<i64>,
    ) -> Result<()> {
        ctx.accounts.create_campaign(
            seed,
            owner,
            name,
            description,
            product_uri,
            budget,
            commission_per_referral,
            ends_at,
            &ctx.bumps,
        )
    }
}
