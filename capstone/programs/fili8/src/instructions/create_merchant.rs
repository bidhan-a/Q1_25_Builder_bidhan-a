use anchor_lang::prelude::*;

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
        space=Merchant::INIT_SPACE
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
