use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token::{close_account, CloseAccount},
    token_interface::{Mint, TokenAccount, TokenInterface},
};

use crate::EscrowState;

#[derive(Accounts)]
#[instruction(seed: u8)]
pub struct Refund<'info> {
    #[account(mut)]
    pub maker: Signer<'info>,

    pub mint_a: InterfaceAccount<'info, Mint>,
    pub mint_b: InterfaceAccount<'info, Mint>,

    #[account(
        mut,
        associated_token::mint = mint_a,
        associated_token::authority = maker,
    )]
    pub maker_mint_a_ata: InterfaceAccount<'info, TokenAccount>,

    #[account(
        mut,
        close=maker,
        seeds=[b"escrow", maker.key().as_ref(), seed.to_le_bytes().as_ref()],
        bump=escrow.bump
    )]
    pub escrow: Account<'info, EscrowState>,

    #[account(
        init,
        associated_token::mint=mint_a,
        associated_token::authority=escrow,
        payer=maker
    )]
    pub vault: InterfaceAccount<'info, TokenAccount>,

    pub system_program: Program<'info, System>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub token_program: Interface<'info, TokenInterface>,
}

impl<'info> Refund<'info> {
    pub fn refund(&mut self) -> Result<()> {
        // Close the vault
        let seeds = &[
            b"escrow",
            self.maker.to_account_info().key.as_ref(),
            &self.escrow.seed.to_le_bytes()[..],
            &[self.escrow.bump],
        ];
        let signer_seeds = &[&seeds[..]];

        let accounts = CloseAccount {
            account: self.vault.to_account_info(),
            destination: self.maker.to_account_info(),
            authority: self.escrow.to_account_info(),
        };

        let cpi_context = CpiContext::new_with_signer(
            self.token_program.to_account_info(),
            accounts,
            signer_seeds,
        );

        close_account(cpi_context)?;
        Ok(())
    }
}
