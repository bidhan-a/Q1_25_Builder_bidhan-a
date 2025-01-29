use anchor_lang::prelude::*;

#[account]
pub struct Marketplace {
    pub admin: Pubkey,     // 32
    pub fee: u16,          // 2
    pub bump: u8,          // 1
    pub treasury_bump: u8, // 1
    pub rewards_bump: u8,  // 1
    pub name: String,      // 32 bytes only (4 + 32)
}

impl Space for Marketplace {
    const INIT_SPACE: usize = 8 + 32 + 2 + 1 + 1 + 1 + (4 + 32);
}
