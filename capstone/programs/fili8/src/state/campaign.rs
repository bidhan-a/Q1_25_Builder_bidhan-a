use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace)]
pub struct Campaign {
    pub seed: u64,
    pub owner: Pubkey,

    #[max_len(50)]
    pub name: String,
    #[max_len(100)]
    pub description: String,
    #[max_len(100)]
    pub product_uri: String, // Product URI which should be promoted by affiliates.

    pub total_budget: u64,
    pub available_budget: u64,
    pub commission_per_referral: u64,
    pub successful_referrals: u32,
    pub created_at: i64,
    pub ends_at: Option<i64>,
    pub is_paused: bool,
    pub is_closed: bool,
    pub total_affiliates: u32,
    pub campaign_bump: u8,
    pub escrow_bump: u8,
}
