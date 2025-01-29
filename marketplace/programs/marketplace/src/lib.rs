use anchor_lang::prelude::*;

declare_id!("3E2FszhTgmzqxJzYHJpKJBvHxhftzvE3fYNpn1bTiw4a");

mod contexts;
mod errors;
mod state;

use contexts::*;

#[program]
pub mod marketplace {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>, name: String, fee: u16) -> Result<()> {
        ctx.accounts.init(name, fee, &ctx.bumps)?;
        Ok(())
    }

    pub fn list(ctx: Context<List>, price: u64) -> Result<()> {
        ctx.accounts.create_listing(price, &ctx.bumps)?;
        ctx.accounts.deposit_nft()?;
        Ok(())
    }

    pub fn delist(ctx: Context<Delist>) -> Result<()> {
        ctx.accounts.withdraw_nft()?;
        ctx.accounts.close_vault()?;
        Ok(())
    }

    pub fn purchase(ctx: Context<Purchase>) -> Result<()> {
        ctx.accounts.transfer_sol()?;
        ctx.accounts.transfer_nft()?;
        ctx.accounts.close_vault()?;
        Ok(())
    }
}
