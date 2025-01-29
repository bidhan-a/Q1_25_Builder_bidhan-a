use anchor_lang::{
    prelude::*,
    system_program::{transfer, Transfer},
};
use anchor_spl::{
    associated_token::AssociatedToken,
    token_interface::{
        close_account, mint_to, transfer_checked, CloseAccount, Mint, MintTo, TokenAccount,
        TokenInterface, TransferChecked,
    },
};

use crate::state::{Listing, Marketplace};

#[derive(Accounts)]
pub struct Purchase<'info> {
    #[account(mut)]
    pub taker: Signer<'info>,

    #[account(mut)]
    pub maker: SystemAccount<'info>,

    #[account(
        seeds=[b"marketplace", marketplace.name.as_str().as_bytes()],
        bump=marketplace.bump
    )]
    pub marketplace: Account<'info, Marketplace>,

    pub maker_mint: InterfaceAccount<'info, Mint>,
    #[account(
        init_if_needed,
        payer=taker,
        associated_token::mint=maker_mint,
        associated_token::authority=taker
    )]
    pub taker_ata: InterfaceAccount<'info, TokenAccount>,

    #[account(
        mut,
        associated_token::mint=maker_mint,
        associated_token::authority=listing
    )]
    pub vault: InterfaceAccount<'info, TokenAccount>,

    #[account(
        mut,
        seeds=[b"listing", marketplace.key().as_ref(), maker_mint.key().as_ref()],
        bump=listing.bump,
        close=maker
    )]
    pub listing: Account<'info, Listing>,

    #[account(
        seeds=[b"treasury", marketplace.key().as_ref()],
        bump=marketplace.treasury_bump
    )]
    pub treasury: SystemAccount<'info>,

    #[account(
        mut,
        seeds=[b"rewards", marketplace.key().as_ref()],
        bump=marketplace.rewards_bump,
        mint::decimals=6,
        mint::authority=marketplace
    )]
    pub rewards_mint: InterfaceAccount<'info, Mint>,

    #[account(
        init_if_needed,
        payer=maker,
        associated_token::mint=rewards_mint,
        associated_token::authority=taker
    )]
    pub rewards_ata: InterfaceAccount<'info, TokenAccount>,

    pub associated_token_program: Program<'info, AssociatedToken>,
    pub token_program: Interface<'info, TokenInterface>,
    pub system_program: Program<'info, System>,
}

impl<'info> Purchase<'info> {
    // Transfer SOL from taker to maker.
    pub fn transfer_sol(&self) -> Result<()> {
        let marketplace_fee = (self.marketplace.fee as u64)
            .checked_mul(self.listing.price)
            .unwrap()
            .checked_div(10000_u64)
            .unwrap();

        let cpi_program = self.system_program.to_account_info();

        let cpi_accounts = Transfer {
            from: self.taker.to_account_info(),
            to: self.maker.to_account_info(),
        };

        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);

        // Subtract fees from listing price before transferring to maker.
        let amount = self.listing.price.checked_sub(marketplace_fee).unwrap();

        transfer(cpi_ctx, self.listing.price - amount)?;

        Ok(())
    }

    // Transfer NFT from vault to taker.
    pub fn transfer_nft(&self) -> Result<()> {
        let seeds = &[
            b"listing",
            &self.marketplace.key().to_bytes()[..],
            &self.maker_mint.key().to_bytes()[..],
            &[self.listing.bump],
        ];
        let signer_seeds = &[&seeds[..]];

        // Transfer NFT from vault to taker.
        let accounts = TransferChecked {
            from: self.vault.to_account_info(),
            to: self.taker_ata.to_account_info(),
            authority: self.listing.to_account_info(),
            mint: self.maker_mint.to_account_info(),
        };

        let cpi_ctx = CpiContext::new_with_signer(
            self.token_program.to_account_info(),
            accounts,
            signer_seeds,
        );

        transfer_checked(cpi_ctx, 1, self.maker_mint.decimals)?;

        // Reward 1 reward token to the taker.
        // We'll need the marketplace's signature here.
        let seeds = &[
            b"marketplace",
            self.marketplace.name.as_str().as_bytes(),
            &[self.listing.bump],
        ];
        let signer_seeds = &[&seeds[..]];

        let accounts = MintTo {
            mint: self.rewards_mint.to_account_info(),
            to: self.rewards_ata.to_account_info(),
            authority: self.marketplace.to_account_info(),
        };

        let cpi_ctx = CpiContext::new_with_signer(
            self.token_program.to_account_info(),
            accounts,
            signer_seeds,
        );

        mint_to(cpi_ctx, 1)?;

        Ok(())
    }

    pub fn close_vault(&mut self) -> Result<()> {
        let seeds = &[
            b"listing",
            &self.marketplace.key().to_bytes()[..],
            &self.maker_mint.key().to_bytes()[..],
            &[self.listing.bump],
        ];
        let signer_seeds = &[&seeds[..]];

        // Close the vault.
        let accounts = CloseAccount {
            account: self.vault.to_account_info(),
            destination: self.maker.to_account_info(),
            authority: self.listing.to_account_info(),
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
