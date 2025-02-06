use anchor_lang::prelude::*;

declare_id!("9AShomzKyEcXCKANqtPgygjRW5ghavpgqvxk8Gocgy81");

mod errors;
mod instructions;
mod state;

pub use instructions::*;

#[program]
pub mod nft_staking {

    use super::*;

    pub fn initialize_config(
        ctx: Context<InitializeConfig>,
        points_per_stake: u8,
        max_stake: u8,
        freeze_period: u32,
    ) -> Result<()> {
        ctx.accounts
            .initialize_config(points_per_stake, max_stake, freeze_period, &ctx.bumps)
    }

    pub fn initialize_user(ctx: Context<InitializeUser>) -> Result<()> {
        ctx.accounts.initialize_user_account(&ctx.bumps)
    }

    pub fn stake(ctx: Context<Stake>) -> Result<()> {
        ctx.accounts.stake(&ctx.bumps)
    }

    pub fn unstake(ctx: Context<Unstake>) -> Result<()> {
        ctx.accounts.unstake()
    }
}
