use anchor_lang::{
    prelude::*,
    system_program::{transfer, Transfer},
};

use crate::state::Campaign;

#[derive(Accounts)]
#[instruction(seed: u64)]
pub struct CreatCampaign<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,

    #[account(
        init,
        payer=payer,
        seeds=[b"campaign", payer.key().as_ref(), seed.to_le_bytes().as_ref()],
        bump,
        space=Campaign::INIT_SPACE
    )]
    pub campaign: Account<'info, Campaign>,

    #[account(
        seeds=[b"vault", campaign.key().as_ref()],
        bump,
    )]
    pub vault: SystemAccount<'info>,

    pub system_program: Program<'info, System>,
}

impl<'info> CreatCampaign<'info> {
    pub fn create_campaign(
        &mut self,
        seed: u64,
        owner: Option<Pubkey>,
        name: String,
        description: String,
        product_uri: String,
        budget: u64,
        commission_per_referral: u64,
        ends_at: Option<i64>,
        bumps: &CreatCampaignBumps,
    ) -> Result<()> {
        let owner = owner.unwrap_or(self.payer.key());

        // TODO: Validations.

        self.campaign.set_inner(Campaign {
            seed,
            owner,
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
            campaign_bump: bumps.campaign,
            vault_bump: bumps.vault,
        });

        // Transfer budget to vault.
        let system_program = self.system_program.to_account_info();
        let accounts = Transfer {
            from: self.payer.to_account_info(),
            to: self.vault.to_account_info(),
        };
        let cpi_context = CpiContext::new(system_program, accounts);
        transfer(cpi_context, budget)?;

        Ok(())
    }
}
