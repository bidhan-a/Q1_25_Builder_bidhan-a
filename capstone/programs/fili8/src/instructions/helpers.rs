use anchor_lang::{
    prelude::*,
    system_program::{transfer, Transfer},
};

pub fn transfer_sol<'info>(
    from: AccountInfo<'info>,
    to: AccountInfo<'info>,
    amount: u64,
    system_program: AccountInfo<'info>,
) -> Result<()> {
    let cpi_accounts = Transfer { from, to };
    let cpi_context = CpiContext::new(system_program, cpi_accounts);
    transfer(cpi_context, amount)
}
