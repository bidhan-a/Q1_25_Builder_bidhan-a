use anchor_lang::prelude::*;
use anchor_spl::token_interface::{Mint, TokenInterface};

use crate::state::Config;

#[derive(Accounts)]
pub struct InitializeConfig<'info> {
    #[account(mut)]
    pub signer: Signer<'info>,

    #[account(
        init,
        payer=signer,
        seeds=[b"config"],
        bump,
        space=Config::INIT_SPACE + 8
    )]
    pub config: Account<'info, Config>,

    #[account(
        init,
        payer=signer,
        seeds=[b"reward_mint"],
        bump,
        mint::decimals=6,
        mint::authority=config
    )]
    pub reward_mint: InterfaceAccount<'info, Mint>,

    #[account(
        seeds=[b"treasury"],
        bump
    )]
    pub treasury: SystemAccount<'info>,

    pub token_program: Interface<'info, TokenInterface>,
    pub system_program: Program<'info, System>,
}

impl<'info> InitializeConfig<'info> {
    pub fn initialize_config(
        &mut self,
        campaign_creation_fee: u16,
        commission_fee: u16,
        bumps: &InitializeConfigBumps,
    ) -> Result<()> {
        self.config.set_inner(Config {
            admin: self.signer.key(),
            campaign_creation_fee,
            commission_fee,
            bump: bumps.config,
            treasury_bump: bumps.treasury,
            reward_mint_bump: bumps.reward_mint,
        });

        Ok(())
    }
}
