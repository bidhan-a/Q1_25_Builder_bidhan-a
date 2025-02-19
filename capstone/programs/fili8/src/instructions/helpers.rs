use anchor_lang::{
    prelude::*,
    system_program::{transfer, Transfer},
};

pub fn transfer_sol<'info>(
    from: AccountInfo<'info>,
    to: AccountInfo<'info>,
    amount: u64,
    system_program: AccountInfo<'info>,
    signer_seeds: Option<&[&[&[u8]]; 1]>,
) -> Result<()> {
    let cpi_accounts = Transfer { from, to };
    match signer_seeds {
        Some(seeds) => {
            let cpi_context =
                CpiContext::new_with_signer(system_program, cpi_accounts, seeds).with_signer(seeds);
            transfer(cpi_context, amount)
        }
        None => {
            let cpi_context = CpiContext::new(system_program, cpi_accounts);
            transfer(cpi_context, amount)
        }
    }
}
