use anchor_lang::{
    prelude::*,
    system_program::{transfer, Transfer},
};
use url::Url;

use crate::errors::Error;
use crate::state::{Campaign, Merchant};

#[derive(Accounts)]
#[instruction(seed: u64)]
pub struct CreateCampaign<'info> {
    #[account(mut)]
    pub signer: Signer<'info>,

    #[account(
        mut,
        seeds=[b"merchant", signer.key.as_ref()],
        bump=merchant.bump
    )]
    pub merchant: Account<'info, Merchant>,

    #[account(
        init,
        payer=signer,
        seeds=[b"campaign", merchant.key().as_ref(), seed.to_le_bytes().as_ref()],
        bump,
        space=Campaign::INIT_SPACE
    )]
    pub campaign: Account<'info, Campaign>,

    #[account(
        seeds=[b"escrow", campaign.key().as_ref()],
        bump,
    )]
    pub escrow: SystemAccount<'info>,

    pub system_program: Program<'info, System>,
}

impl<'info> CreateCampaign<'info> {
    pub fn create_campaign(
        &mut self,
        seed: u64,
        name: String,
        description: String,
        product_uri: String,
        budget: u64,
        commission_per_referral: u64,
        ends_at: Option<i64>,
        bumps: &CreateCampaignBumps,
    ) -> Result<()> {
        require!(name.len() <= 50, Error::NameTooLong);
        require!(name.len() >= 10, Error::NameTooShort);
        require!(description.len() <= 100, Error::DescriptionTooLong);
        require!(Url::parse(&product_uri).is_ok(), Error::InvalidProductURI);

        self.campaign.set_inner(Campaign {
            seed,
            owner: self.merchant.key(),
            name,
            description,
            product_uri,
            budget,
            commission_per_referral,
            successful_referrals: 0,
            created_at: Clock::get()?.unix_timestamp,
            ends_at,
            is_cancelled: false,
            is_paused: false,
            total_affiliates: 0,
            campaign_bump: bumps.campaign,
            escrow_bump: bumps.escrow,
        });

        // Transfer budget to escrow.
        let system_program = self.system_program.to_account_info();
        let accounts = Transfer {
            from: self.signer.to_account_info(),
            to: self.escrow.to_account_info(),
        };
        let cpi_context = CpiContext::new(system_program, accounts);
        transfer(cpi_context, budget)?;

        Ok(())
    }
}
