use anchor_lang::error_code;

#[error_code]
pub enum Error {
    #[msg("The given name is too long")]
    CampaignNameTooLong,
}
