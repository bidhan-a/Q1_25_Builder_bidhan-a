use anchor_lang::prelude::*;
use url::Url;

use crate::helpers::transfer_sol;
use crate::state::{Campaign, Merchant};
use crate::{errors::Error, state::Config};

#[derive(Accounts)]
#[instruction(seed: u64)]
pub struct CreateCampaign<'info> {
    #[account(mut)]
    pub signer: Signer<'info>,

    #[account(
        seeds=[b"config"],
        bump=config.bump
    )]
    pub config: Account<'info, Config>,

    #[account(
        mut,
        seeds=[b"treasury"],
        bump=config.treasury_bump
    )]
    pub treasury: SystemAccount<'info>,

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
        space=Campaign::INIT_SPACE + 8
    )]
    pub campaign: Account<'info, Campaign>,

    #[account(
        mut,
        seeds=[b"escrow", campaign.key().as_ref()],
        bump
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
            total_budget: budget,
            available_budget: budget,
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
        transfer_sol(
            self.signer.to_account_info(),
            self.escrow.to_account_info(),
            budget,
            self.system_program.to_account_info(),
            None,
        )?;

        // Transfer campaign creation fee to treasury.
        let campaign_creation_fee = (self.config.campaign_creation_fee as u64)
            .checked_mul(budget)
            .unwrap()
            .checked_div(10000_u64)
            .unwrap();
        transfer_sol(
            self.signer.to_account_info(),
            self.treasury.to_account_info(),
            campaign_creation_fee,
            self.system_program.to_account_info(),
            None,
        )?;

        self.merchant.total_campaigns = self.merchant.total_campaigns.checked_add(1).unwrap();
        self.merchant.total_spent = self
            .merchant
            .total_spent
            .checked_add(campaign_creation_fee)
            .unwrap();

        Ok(())
    }
}
