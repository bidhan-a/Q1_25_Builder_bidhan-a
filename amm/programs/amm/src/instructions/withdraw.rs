use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token_interface::{
        burn, transfer_checked, Burn, Mint, TokenAccount, TokenInterface, TransferChecked,
    },
};
use constant_product_curve::ConstantProduct;

use crate::state::Config;

#[derive(Accounts)]
pub struct Withdraw<'info> {
    #[account(mut)]
    pub signer: Signer<'info>,

    pub mint_x: InterfaceAccount<'info, Mint>,
    pub mint_y: InterfaceAccount<'info, Mint>,

    #[account(
        mut,
        associated_token::mint=mint_x,
        associated_token::authority=config
    )]
    pub vault_x: InterfaceAccount<'info, TokenAccount>,
    #[account(
        mut,
        associated_token::mint=mint_y,
        associated_token::authority=config
    )]
    pub vault_y: InterfaceAccount<'info, TokenAccount>,

    #[account(
        mut,
        associated_token::mint=mint_x,
        associated_token::authority=config
    )]
    pub user_x: InterfaceAccount<'info, TokenAccount>,

    #[account(
        mut,
        associated_token::mint=mint_y,
        associated_token::authority=config
    )]
    pub user_y: InterfaceAccount<'info, TokenAccount>,

    #[account(
        mut,
        seeds=[b"mint", config.key().as_ref()],
        bump=config.mint_lp_bump,
    )]
    pub mint_lp: InterfaceAccount<'info, Mint>,

    #[account(
        mut,
        associated_token::mint=mint_lp,
        associated_token::authority=signer
    )]
    pub user_lp: InterfaceAccount<'info, TokenAccount>,

    #[account(
        has_one=mint_x,
        has_one=mint_y,
        seeds=[b"config", config.seed.to_le_bytes().as_ref()],
        bump=config.config_bump,
    )]
    pub config: Account<'info, Config>,

    pub associated_token_program: Program<'info, AssociatedToken>,
    pub token_program: Interface<'info, TokenInterface>,
    pub system_program: Program<'info, System>,
}

impl<'info> Withdraw<'info> {
    pub fn withdraw(&mut self, amount: u64, max_x: u64, max_y: u64) -> Result<()> {
        let (x, y) = match self.mint_lp.supply == 0
            && self.vault_x.amount == 0
            && self.vault_y.amount == 0
        {
            true => (max_x, max_y),
            false => {
                let amounts = ConstantProduct::xy_withdraw_amounts_from_l(
                    self.vault_x.amount,
                    self.vault_y.amount,
                    self.mint_lp.supply,
                    amount,
                    6,
                )
                .unwrap();
                (amounts.x, amounts.y)
            }
        };

        self.withdraw_tokens(true, x)?;
        self.withdraw_tokens(false, y)?;

        self.burn_lp_tokens(amount)?;

        Ok(())
    }

    fn withdraw_tokens(&mut self, is_x: bool, amount: u64) -> Result<()> {
        let (from, to, mint) = match is_x {
            true => (&self.vault_x, &self.user_x, &self.mint_x),
            false => (&self.vault_y, &self.user_y, &self.mint_y),
        };

        let accounts = TransferChecked {
            from: from.to_account_info(),
            to: to.to_account_info(),
            mint: mint.to_account_info(),
            authority: self.config.to_account_info(),
        };

        let seeds = &[
            &b"config"[..],
            &self.config.seed.to_le_bytes(),
            &[self.config.config_bump],
        ];
        let signer_seeds = &[&seeds[..]];

        let cpi_context = CpiContext::new_with_signer(
            self.token_program.to_account_info(),
            accounts,
            signer_seeds,
        );
        transfer_checked(cpi_context, amount, mint.decimals)
    }

    fn burn_lp_tokens(&mut self, amount: u64) -> Result<()> {
        let seeds = &[
            &b"config"[..],
            &self.config.seed.to_le_bytes(),
            &[self.config.config_bump],
        ];
        let signer_seeds = &[&seeds[..]];

        let accounts = Burn {
            mint: self.mint_lp.to_account_info(),
            from: self.user_lp.to_account_info(),
            authority: self.signer.to_account_info(),
        };

        let cpi_context = CpiContext::new_with_signer(
            self.token_program.to_account_info(),
            accounts,
            signer_seeds,
        );
        burn(cpi_context, amount)
    }
}
