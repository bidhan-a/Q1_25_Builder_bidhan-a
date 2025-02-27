use anchor_lang::prelude::*;

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
    pub config: Box<Account<'info, Config>>,

    #[account(
        seeds=[b"treasury"],
        bump
    )]
    pub treasury: SystemAccount<'info>,

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
        });

        Ok(())
    }
}
