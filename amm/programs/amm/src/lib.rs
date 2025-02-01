use anchor_lang::prelude::*;

declare_id!("79pHagCGJvjR9snFr5YAYitGpMun6abyzD8jmoCCBrTQ");

mod instructions;
mod state;

use instructions::*;

#[program]
pub mod amm {
    use super::*;

    pub fn initialize(
        ctx: Context<Initialize>,
        seed: u64,
        authority: Option<Pubkey>,
        fee: u16,
    ) -> Result<()> {
        ctx.accounts.initialize(seed, authority, fee, &ctx.bumps)
    }

    pub fn deposit(ctx: Context<Deposit>, amount: u64, max_x: u64, max_y: u64) -> Result<()> {
        ctx.accounts.deposit(amount, max_x, max_y)
    }

    pub fn swap(ctx: Context<Swap>, is_x: bool, amount: u64, min: u64) -> Result<()> {
        ctx.accounts.swap(is_x, amount, min)
    }
}
