use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace)]
pub struct Merchant {
    #[max_len(50)]
    pub name: String,
    #[max_len(100)]
    pub description: String,
    pub total_campaigns: u32,
    pub total_spent: u64,
    pub bump: u8,
}
