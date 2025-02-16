use anchor_lang::error_code;

#[error_code]
pub enum Error {
    #[msg("The name is too long.")]
    NameTooLong,
    #[msg("The description is too long.")]
    DescriptionTooLong,
}
