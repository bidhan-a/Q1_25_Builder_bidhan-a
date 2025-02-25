use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace)]
pub struct Config {
    pub admin: Pubkey,
    pub campaign_creation_fee: u16,
    pub commission_fee: u16,
    pub bump: u8,
    pub treasury_bump: u8,
}
