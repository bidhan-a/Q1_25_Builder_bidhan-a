use anchor_lang::error_code;

#[error_code]
pub enum Error {
    #[msg("The name is too long.")]
    NameTooLong,
    #[msg("The name is too short.")]
    NameTooShort,
    #[msg("The description is too long.")]
    DescriptionTooLong,
    #[msg("The product URI is invalid.")]
    InvalidProductURI,
}
