use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace)]
pub struct CampaignAffiliate {
    pub campaign: Pubkey,
    pub affiliate: Pubkey,
    pub successful_referrals: u32,
    pub total_earned: u64,
    pub bump: u8,
}
