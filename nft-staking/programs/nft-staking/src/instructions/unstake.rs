use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    metadata::{
        mpl_token_metadata::instructions::{
            ThawDelegatedAccountCpi, ThawDelegatedAccountCpiAccounts,
        },
        MasterEditionAccount, Metadata, MetadataAccount,
    },
    token_interface::{revoke, Mint, Revoke, TokenAccount, TokenInterface},
};

use crate::errors::StakeError;
use crate::state::{StakeAccount, StakeConfig, UserAccount};

#[derive(Accounts)]
pub struct Unstake<'info> {
    #[account(mut)]
    pub user: Signer<'info>,

    pub mint: InterfaceAccount<'info, Mint>,
    #[account(
        mut,
        associated_token::mint=mint,
        associated_token::authority=user
    )]
    pub mint_ata: InterfaceAccount<'info, TokenAccount>,

    pub collection_mint: InterfaceAccount<'info, Mint>,

    #[account(
        seeds=[b"metadata", metadata_program.key().as_ref(), mint.key().as_ref()],
        seeds::program=metadata_program.key(),
        bump,
        constraint=metadata.collection.as_ref().unwrap().key.as_ref() == collection_mint.key().as_ref(),
        constraint=metadata.collection.as_ref().unwrap().verified == true
    )]
    pub metadata: Account<'info, MetadataAccount>,

    #[account(
        seeds=[b"metadata", metadata_program.key().as_ref(), mint.key().as_ref(), b"edition"],
        seeds::program=metadata_program.key(),
        bump,
    )]
    pub master_edition: Account<'info, MasterEditionAccount>,

    #[account(
        seeds=[b"config"],
        bump=config_account.bump
    )]
    pub config_account: Account<'info, StakeConfig>,

    #[account(
        init,
        payer=user,
        seeds=[b"stake", config_account.key().as_ref(), mint.key().as_ref()],
        bump,
        space=StakeAccount::INIT_SPACE
    )]
    pub stake_account: Account<'info, StakeAccount>,

    #[account(
        mut,
        seeds=[b"user", user.key().as_ref()],
        bump=user_account.bump
    )]
    pub user_account: Account<'info, UserAccount>,

    pub metadata_program: Program<'info, Metadata>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub token_program: Interface<'info, TokenInterface>,
    pub system_program: Program<'info, System>,
}

impl<'info> Unstake<'info> {
    pub fn unstake(&mut self) -> Result<()> {
        let time_elapsed =
            ((Clock::get()?.unix_timestamp - self.stake_account.staked_at) / 86400) as u32;

        require!(
            time_elapsed >= self.config_account.freeze_period,
            StakeError::FreezePeriodNotPassed
        );

        self.user_account.points +=
            time_elapsed as u32 * self.config_account.points_per_stake as u32;

        // Unfreeze/thaw NFT.
        let seeds = &[
            b"stake",
            self.config_account.to_account_info().key.as_ref(),
            self.mint.to_account_info().key.as_ref(),
            &[self.stake_account.bump],
        ];
        let signer_seeds = &[&seeds[..]];

        ThawDelegatedAccountCpi::new(
            &self.metadata.to_account_info(),
            ThawDelegatedAccountCpiAccounts {
                delegate: &self.stake_account.to_account_info(),
                token_account: &self.mint_ata.to_account_info(),
                edition: &self.master_edition.to_account_info(),
                mint: &self.mint.to_account_info(),
                token_program: &self.token_program.to_account_info(),
            },
        )
        .invoke_signed(signer_seeds)?;

        // Revoke authority.
        let cpi_program = self.token_program.to_account_info();
        let cpi_accounts = Revoke {
            source: self.mint_ata.to_account_info(),
            authority: self.user.to_account_info(),
        };
        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);

        revoke(cpi_ctx)?;

        self.user_account.amount_staked -= 1;

        Ok(())
    }
}
