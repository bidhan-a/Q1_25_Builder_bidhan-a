use anchor_lang::prelude::*;

declare_id!("79pHagCGJvjR9snFr5YAYitGpMun6abyzD8jmoCCBrTQ");

mod instructions;
mod state;

use instructions::*;

#[program]
pub mod amm {
    use super::*;

    pub fn initialize(
        ctx: Context<Initialize>,
        seed: u64,
        authority: Option<Pubkey>,
        fee: u16,
    ) -> Result<()> {
        ctx.accounts.initialize(seed, authority, fee, &ctx.bumps)
    }
}
