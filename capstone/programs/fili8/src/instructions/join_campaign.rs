use anchor_lang::prelude::*;

use crate::state::{Affiliate, Campaign, CampaignAffiliate};

#[derive(Accounts)]
pub struct JoinCampaign<'info> {
    #[account(mut)]
    pub signer: Signer<'info>,

    #[account(
        mut,
        seeds=[b"campaign", campaign.owner.key().as_ref(), campaign.seed.to_le_bytes().as_ref()],
        bump=campaign.campaign_bump,
    )]
    pub campaign: Account<'info, Campaign>,

    #[account(
        mut,
        seeds=[b"affiliate", signer.key.as_ref()],
        bump=affiliate.bump
    )]
    pub affiliate: Account<'info, Affiliate>,

    #[account(
        init,
        payer=signer,
        seeds=[b"campaign_affiliate", campaign.key().as_ref(), affiliate.key().as_ref()],
        bump,
        space=CampaignAffiliate::INIT_SPACE + 8
    )]
    pub campaign_affiliate: Account<'info, CampaignAffiliate>,
    pub system_program: Program<'info, System>,
}

impl<'info> JoinCampaign<'info> {
    pub fn join_campaign(&mut self, bumps: &JoinCampaignBumps) -> Result<()> {
        self.campaign_affiliate.set_inner(CampaignAffiliate {
            campaign: self.campaign.key(),
            affiliate: self.affiliate.key(),
            successful_referrals: 0,
            total_earned: 0,
            bump: bumps.campaign_affiliate,
        });

        self.campaign.total_affiliates = self.campaign.total_affiliates.checked_add(1).unwrap();
        self.affiliate.total_campaigns = self.affiliate.total_campaigns.checked_add(1).unwrap();

        Ok(())
    }
}
