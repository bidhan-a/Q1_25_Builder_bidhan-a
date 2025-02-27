use anchor_lang::prelude::*;

use crate::errors::Error;
use crate::helpers::transfer_sol;
use crate::state::Config;

#[derive(Accounts)]
pub struct WithdrawFees<'info> {
    #[account(mut)]
    pub signer: Signer<'info>,

    #[account(
        seeds=[b"config"],
        bump=config.bump,
        constraint=config.admin.key() == signer.key() @ Error::InvalidAdmin
    )]
    pub config: Box<Account<'info, Config>>,

    #[account(
        mut,
        seeds=[b"treasury"],
        bump=config.treasury_bump
    )]
    pub treasury: SystemAccount<'info>,

    #[account(mut)]
    pub withdraw_address: SystemAccount<'info>,

    pub system_program: Program<'info, System>,
}

impl<'info> WithdrawFees<'info> {
    pub fn withdraw_fees(&mut self) -> Result<()> {
        // Treasury seeds.
        let seeds: &[&[u8]] = &[b"treasury", &[self.config.treasury_bump]];
        let signer_seeds = &[&seeds[..]];

        let amount = self.treasury.to_account_info().lamports();
        if amount > 0 {
            transfer_sol(
                self.treasury.to_account_info(),
                self.withdraw_address.to_account_info(),
                amount,
                self.system_program.to_account_info(),
                Some(signer_seeds),
            )?;
        }

        Ok(())
    }
}
