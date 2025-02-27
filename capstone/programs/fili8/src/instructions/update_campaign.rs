use anchor_lang::prelude::*;
use url::Url;

use crate::helpers::transfer_sol;
use crate::state::{Campaign, Merchant};
use crate::{errors::Error, state::Config};

#[derive(Accounts)]
#[instruction(seed: u64)]
pub struct UpdateCampaign<'info> {
    #[account(mut)]
    pub signer: Signer<'info>,

    #[account(
        seeds=[b"config"],
        bump=config.bump
    )]
    pub config: Box<Account<'info, Config>>,

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
    pub merchant: Box<Account<'info, Merchant>>,

    #[account(
        mut,
        seeds=[b"campaign", campaign.owner.key().as_ref(), campaign.seed.to_le_bytes().as_ref()],
        bump=campaign.campaign_bump,
        constraint=campaign.owner.key() == merchant.key() @ Error::InvalidCampaignOwner
    )]
    pub campaign: Box<Account<'info, Campaign>>,

    #[account(
        mut,
        seeds=[b"escrow", campaign.key().as_ref()],
        bump
    )]
    pub escrow: SystemAccount<'info>,

    pub system_program: Program<'info, System>,
}

impl<'info> UpdateCampaign<'info> {
    pub fn update_campaign(
        &mut self,
        name: Option<String>,
        description: Option<String>,
        product_uri: Option<String>,
        commission_per_referral: Option<u64>,
        ends_at: Option<i64>,
        additional_budget: Option<u64>,
    ) -> Result<()> {
        require!(!self.campaign.is_closed, Error::CampaignClosed);

        match name {
            Some(name) => {
                require!(name.len() <= 50, Error::NameTooLong);
                require!(name.len() >= 10, Error::NameTooShort);
                self.campaign.name = name;
            }
            None => {}
        }

        match description {
            Some(description) => {
                require!(description.len() <= 100, Error::DescriptionTooLong);
                self.campaign.description = description;
            }
            None => {}
        }

        match product_uri {
            Some(product_uri) => {
                require!(Url::parse(&product_uri).is_ok(), Error::InvalidProductURI);
                self.campaign.product_uri = product_uri;
            }
            None => {}
        }

        match commission_per_referral {
            Some(commission_per_referral) => {
                self.campaign.commission_per_referral = commission_per_referral;
            }
            None => {}
        }

        match ends_at {
            Some(ends_at) => {
                require!(
                    ends_at > Clock::get()?.unix_timestamp,
                    Error::InvalidCampaignPeriod,
                );
                self.campaign.ends_at = Some(ends_at);
            }
            None => {}
        }

        match additional_budget {
            Some(additional_budget) => {
                // Transfer additional budget to escrow.
                transfer_sol(
                    self.signer.to_account_info(),
                    self.escrow.to_account_info(),
                    additional_budget,
                    self.system_program.to_account_info(),
                    None,
                )?;

                // Transfer fee based on the additional budget to treasury.
                let fee = (self.config.campaign_creation_fee as u64)
                    .checked_mul(additional_budget)
                    .unwrap()
                    .checked_div(10000_u64)
                    .unwrap();
                transfer_sol(
                    self.signer.to_account_info(),
                    self.treasury.to_account_info(),
                    fee,
                    self.system_program.to_account_info(),
                    None,
                )?;

                // Update total and available budget.
                self.campaign.total_budget = self
                    .campaign
                    .total_budget
                    .checked_add(additional_budget)
                    .unwrap();
                self.campaign.available_budget = self
                    .campaign
                    .available_budget
                    .checked_add(additional_budget)
                    .unwrap();

                // If the campaign was paused and now has enough budget, unpause it.
                if self.campaign.is_paused
                    && self.campaign.available_budget >= self.campaign.commission_per_referral
                {
                    self.campaign.is_paused = false;
                }
            }
            None => {}
        }

        Ok(())
    }
}
