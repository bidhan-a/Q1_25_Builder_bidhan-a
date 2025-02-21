use anchor_lang::prelude::*;

use crate::errors::Error;
use crate::helpers::transfer_sol;
use crate::state::{Affiliate, Campaign, CampaignAffiliate, Config, Merchant};

#[derive(Accounts)]
pub struct ReportConversion<'info> {
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
        bump=merchant.bump,
    )]
    pub merchant: Account<'info, Merchant>,

    #[account(
        mut,
        seeds=[b"campaign", campaign.owner.key().as_ref(), campaign.seed.to_le_bytes().as_ref()],
        bump=campaign.campaign_bump,
        constraint=campaign.owner.key() == merchant.key() @ Error::InvalidCampaignOwner
    )]
    pub campaign: Account<'info, Campaign>,

    #[account(
        mut,
        seeds=[b"escrow", campaign.key().as_ref()],
        bump=campaign.escrow_bump
    )]
    pub escrow: SystemAccount<'info>,

    #[account(
        mut,
        seeds=[b"affiliate", affiliate.owner.key().as_ref()],
        bump=affiliate.bump
    )]
    pub affiliate: Account<'info, Affiliate>,

    #[account(
        mut,
        seeds=[b"campaign_affiliate", campaign.key().as_ref(), affiliate.key().as_ref()],
        bump=campaign_affiliate.bump,
    )]
    pub campaign_affiliate: Account<'info, CampaignAffiliate>,

    #[account(
        mut,
        constraint=affiliate.payout_address.key() == payout_address.key() @ Error::InvalidPayoutAddress
    )]
    pub payout_address: SystemAccount<'info>,

    pub system_program: Program<'info, System>,
}

impl<'info> ReportConversion<'info> {
    pub fn report_conversion(&mut self) -> Result<()> {
        // Subtract fees from commission.
        let commission_fee = (self.config.commission_fee as u64)
            .checked_mul(self.campaign.commission_per_referral)
            .unwrap()
            .checked_div(10000_u64)
            .unwrap();
        let commission_minus_fee = self
            .campaign
            .commission_per_referral
            .checked_sub(commission_fee)
            .unwrap();

        // Escrow seeds.
        let seeds = &[
            b"escrow",
            self.campaign.to_account_info().key.as_ref(),
            &[self.campaign.escrow_bump],
        ];
        let signer_seeds = &[&seeds[..]];

        // Transfer fee from escrow to treasury.
        transfer_sol(
            self.escrow.to_account_info(),
            self.treasury.to_account_info(),
            commission_fee,
            self.system_program.to_account_info(),
            Some(signer_seeds),
        )?;

        // Transfer commission minus fees to payout address.
        transfer_sol(
            self.escrow.to_account_info(),
            self.payout_address.to_account_info(),
            commission_minus_fee,
            self.system_program.to_account_info(),
            Some(signer_seeds),
        )?;

        // Update Campaign state.
        let available_budget = self
            .campaign
            .available_budget
            .checked_sub(self.campaign.commission_per_referral)
            .unwrap();
        self.campaign.available_budget = available_budget;
        self.campaign.successful_referrals =
            self.campaign.successful_referrals.checked_add(1).unwrap();

        // Check if the campaign has enough budget for the next payout.
        // If not, mark the campaign as paused.
        if available_budget < self.campaign.commission_per_referral {
            self.campaign.is_paused = true;
        }

        // Update Merchant state.
        self.merchant.total_spent = self
            .merchant
            .total_spent
            .checked_add(self.campaign.commission_per_referral)
            .unwrap();

        // Update Affiliate state.
        self.affiliate.total_earned = self
            .affiliate
            .total_earned
            .checked_add(self.campaign.commission_per_referral)
            .unwrap();

        // Update CampaignAffiliate state.
        self.campaign_affiliate.successful_referrals = self
            .campaign_affiliate
            .successful_referrals
            .checked_add(1)
            .unwrap();
        self.campaign_affiliate.total_earned = self
            .campaign_affiliate
            .total_earned
            .checked_add(self.campaign.commission_per_referral)
            .unwrap();

        Ok(())
    }
}
