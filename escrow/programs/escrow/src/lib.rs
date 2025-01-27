use anchor_lang::prelude::*;

declare_id!("DY3vDNvABPVGZZrd2rtbF8bvoJ5woHRgc7SaqsTMqxbR");

pub mod instructions;
pub use instructions::*;

pub mod state;
pub use state::*;

#[program]
pub mod escrow {
    use super::*;

    pub fn make(
        ctx: Context<Make>,
        seed: u64,
        receive_amount: u64,
        deposit_amount: u64,
    ) -> Result<()> {
        ctx.accounts
            .init_escrow_state(seed, receive_amount, ctx.bumps)?;
        ctx.accounts.deposit(deposit_amount)?;
        Ok(())
    }

    pub fn take(ctx: Context<Take>) -> Result<()> {
        ctx.accounts.withdraw()?;
        Ok(())
    }

    pub fn refund(ctx: Context<Refund>) -> Result<()> {
        ctx.accounts.refund()?;
        Ok(())
    }
}
