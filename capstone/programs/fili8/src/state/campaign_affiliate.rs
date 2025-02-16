use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace)]
pub struct CampaignAffiliate {
    pub campaign: Pubkey,
    pub successful_referrals: u64,
    pub total_earned: u64,
    pub bump: u8,
}
