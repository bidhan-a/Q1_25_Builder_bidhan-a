use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token_interface::{transfer_checked, Mint, TokenAccount, TokenInterface, TransferChecked},
};
use constant_product_curve::{ConstantProduct, LiquidityPair};

use crate::state::Config;

#[derive(Accounts)]
pub struct Swap<'info> {
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

impl<'info> Swap<'info> {
    pub fn swap(&mut self, is_x: bool, amount: u64, min: u64) -> Result<()> {
        let mut curve = ConstantProduct::init(
            self.vault_x.amount,
            self.vault_y.amount,
            self.vault_x.amount,
            self.config.fee,
            None,
        )
        .unwrap();

        let p = match is_x {
            true => LiquidityPair::X,
            false => LiquidityPair::Y,
        };

        let res = curve.swap(p, amount, min).unwrap();

        self.deposit_tokens(is_x, res.deposit)?;
        self.withdraw_tokens(is_x, res.withdraw)?;

        Ok(())
    }

    fn deposit_tokens(&mut self, is_x: bool, amount: u64) -> Result<()> {
        let (from, to, mint) = match is_x {
            true => (&self.user_x, &self.vault_x, &self.mint_x),
            false => (&self.user_y, &self.vault_y, &self.mint_y),
        };

        let accounts = TransferChecked {
            from: from.to_account_info(),
            to: to.to_account_info(),
            mint: mint.to_account_info(),
            authority: self.signer.to_account_info(),
        };

        let cpi_context = CpiContext::new(self.token_program.to_account_info(), accounts);
        transfer_checked(cpi_context, amount, mint.decimals)
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
}
