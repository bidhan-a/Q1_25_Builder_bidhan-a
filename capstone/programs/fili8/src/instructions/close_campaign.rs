use anchor_lang::prelude::*;

use crate::errors::Error;
use crate::helpers::transfer_sol;
use crate::state::{Campaign, Merchant};

#[derive(Accounts)]
pub struct CloseCampaign<'info> {
    #[account(mut)]
    pub signer: Signer<'info>,

    #[account(
        mut,
        seeds=[b"merchant", signer.key.as_ref()],
        bump=merchant.bump,
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
        bump=campaign.escrow_bump,
    )]
    pub escrow: SystemAccount<'info>,

    #[account(mut)]
    pub withdraw_address: SystemAccount<'info>,

    pub system_program: Program<'info, System>,
}

impl<'info> CloseCampaign<'info> {
    pub fn close_campaign(&mut self) -> Result<()> {
        require!(!self.campaign.is_closed, Error::CampaignClosed);

        // Escrow seeds.
        let seeds = &[
            b"escrow",
            self.campaign.to_account_info().key.as_ref(),
            &[self.campaign.escrow_bump],
        ];
        let signer_seeds = &[&seeds[..]];

        // Transfer remaining budget to withdraw address.
        let remaining_amount = self.escrow.to_account_info().lamports();
        transfer_sol(
            self.escrow.to_account_info(),
            self.withdraw_address.to_account_info(),
            remaining_amount,
            self.system_program.to_account_info(),
            Some(signer_seeds),
        )?;

        // Update Campaign state.
        self.campaign.available_budget = 0;
        self.campaign.is_closed = true;

        Ok(())
    }
}
