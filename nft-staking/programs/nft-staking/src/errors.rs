use anchor_lang::error_code;

#[error_code]
pub enum StakeError {
    #[msg("Max stake reached")]
    MaxStakeReached,

    #[msg("Frezze period not passed")]
    FreezePeriodNotPassed,
}
