use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace)]
pub struct Merchant {
    pub name: String,
    pub description: String,
    pub campaigns: Vec<Pubkey>,
    pub bump: u8,
}
