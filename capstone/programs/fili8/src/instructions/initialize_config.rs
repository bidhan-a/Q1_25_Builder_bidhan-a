use anchor_lang::prelude::*;
use anchor_spl::token_interface::{Mint, TokenInterface};

use crate::state::Config;

#[derive(Accounts)]
pub struct InitializeConfig<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,

    #[account(
        init,
        payer=payer,
        seeds=[b"config"],
        bump,
        space=Config::INIT_SPACE + 8
    )]
    pub config: Account<'info, Config>,

    #[account(
        init,
        payer=payer,
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
        admin: Option<Pubkey>,
        fee_basis_points: u16,
        bumps: &InitializeConfigBumps,
    ) -> Result<()> {
        // If admin is not provided, set the signer/payer as the admin.
        let admin = admin.unwrap_or(self.payer.key());

        self.config.set_inner(Config {
            admin,
            fee_basis_points,
            bump: bumps.config,
            treasury_bump: bumps.treasury,
            reward_mint_bump: bumps.reward_mint,
        });

        Ok(())
    }
}
