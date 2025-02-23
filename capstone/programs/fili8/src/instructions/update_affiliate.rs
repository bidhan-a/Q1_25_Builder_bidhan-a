use anchor_lang::prelude::*;

use crate::errors::Error;
use crate::state::Affiliate;

#[derive(Accounts)]
pub struct UpdateAffiliate<'info> {
    #[account(mut)]
    pub signer: Signer<'info>,

    #[account(
        mut,
        seeds=[b"affiliate", signer.key.as_ref()],
        bump=affiliate.bump,
    )]
    pub affiliate: Account<'info, Affiliate>,

    pub system_program: Program<'info, System>,
}

impl<'info> UpdateAffiliate<'info> {
    pub fn update_affiliate(
        &mut self,
        name: Option<String>,
        description: Option<String>,
        payout_address: Option<Pubkey>,
    ) -> Result<()> {
        match name {
            Some(name) => {
                require!(name.len() <= 50, Error::NameTooLong);
                require!(name.len() >= 10, Error::NameTooShort);
                self.affiliate.name = name;
            }
            None => {}
        }

        match description {
            Some(description) => {
                require!(description.len() <= 100, Error::DescriptionTooLong);
                self.affiliate.description = description;
            }
            None => {}
        }

        match payout_address {
            Some(payout_address) => {
                self.affiliate.payout_address = payout_address;
            }
            None => {}
        }

        Ok(())
    }
}
