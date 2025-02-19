use anchor_lang::prelude::*;

use crate::errors::Error;
use crate::state::Merchant;

#[derive(Accounts)]
pub struct CreateMerchant<'info> {
    #[account(mut)]
    pub signer: Signer<'info>,

    #[account(
        init,
        payer=signer,
        seeds=[b"merchant", signer.key.as_ref()],
        bump,
        space=Merchant::INIT_SPACE + 8
    )]
    pub merchant: Account<'info, Merchant>,

    pub system_program: Program<'info, System>,
}

impl<'info> CreateMerchant<'info> {
    pub fn create_merchant(
        &mut self,
        name: String,
        description: String,
        bumps: &CreateMerchantBumps,
    ) -> Result<()> {
        require!(name.len() <= 50, Error::NameTooLong);
        require!(name.len() >= 10, Error::NameTooShort);
        require!(description.len() <= 100, Error::DescriptionTooLong);

        self.merchant.set_inner(Merchant {
            name,
            description,
            total_campaigns: 0,
            total_spent: 0,
            bump: bumps.merchant,
        });
        Ok(())
    }
}
