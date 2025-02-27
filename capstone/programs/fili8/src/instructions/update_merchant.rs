use anchor_lang::prelude::*;

use crate::errors::Error;
use crate::state::Merchant;

#[derive(Accounts)]
pub struct UpdateMerchant<'info> {
    #[account(mut)]
    pub signer: Signer<'info>,

    #[account(
        mut,
        seeds=[b"merchant", signer.key.as_ref()],
        bump=merchant.bump,
    )]
    pub merchant: Box<Account<'info, Merchant>>,

    pub system_program: Program<'info, System>,
}

impl<'info> UpdateMerchant<'info> {
    pub fn update_merchant(
        &mut self,
        name: Option<String>,
        description: Option<String>,
    ) -> Result<()> {
        match name {
            Some(name) => {
                require!(name.len() <= 50, Error::NameTooLong);
                require!(name.len() >= 10, Error::NameTooShort);
                self.merchant.name = name;
            }
            None => {}
        }

        match description {
            Some(description) => {
                require!(description.len() <= 100, Error::DescriptionTooLong);
                self.merchant.description = description;
            }
            None => {}
        }

        Ok(())
    }
}
