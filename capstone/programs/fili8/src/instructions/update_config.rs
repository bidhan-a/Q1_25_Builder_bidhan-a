use anchor_lang::prelude::*;

use crate::errors::Error;
use crate::state::Config;

#[derive(Accounts)]
pub struct UpdateConfig<'info> {
    #[account(mut)]
    pub signer: Signer<'info>,

    #[account(
        mut,
        seeds=[b"config"],
        bump=config.bump,
        constraint=config.admin.key() == signer.key() @ Error::InvalidAdmin
    )]
    pub config: Box<Account<'info, Config>>,

    pub system_program: Program<'info, System>,
}

impl<'info> UpdateConfig<'info> {
    pub fn update_config(
        &mut self,
        campaign_creation_fee: Option<u16>,
        commission_fee: Option<u16>,
    ) -> Result<()> {
        match campaign_creation_fee {
            Some(campaign_creation_fee) => {
                self.config.campaign_creation_fee = campaign_creation_fee;
            }
            None => {}
        }
        match commission_fee {
            Some(commission_fee) => {
                self.config.commission_fee = commission_fee;
            }
            None => {}
        }

        Ok(())
    }
}
