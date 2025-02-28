# fili8

## Overview  
fili8 is a decentralized affiliate marketing platform built on Solana. By leveraging blockchain technology, fili8 eliminates intermediaries and enables direct collaboration between affiliates and advertisers. Campaigns are managed via smart contracts, and referral metrics like conversions and payouts are tracked immutably on-chain. Metrics related to an affiliate’s participation and performance are also stored on-chain, showcasing their work and building a reputation in the platform.

---

## Deployed Links  

- **Solana Program ID**: https://explorer.solana.com/address/79jtSwKgEBHQBeamoBbbTifFHFFutapofAoYV9TtPCjf?cluster=devnet

---

## Features  
- Allows merchants to create and manage affiliate marketing campaigns.
- Allows affiliate marketers to join campaigns.
- Allows merchants to report conversions.
- Releases payout from escrow to affiliates after a successful conversion.
- Stores platform fees in treasury which can be withdrawn by the admin.
---

## Architecture Diagram

![Architecture Diagram](https://raw.githubusercontent.com/bidhan-a/Q1_25_Builder_bidhan-a/refs/heads/main/capstone/documents/Architecture_Diagram.png)

---


## Getting Started  

### Prerequisites  
Ensure you have the following installed:  
- Rust
- Solana CLI
- Anchor CLI
- Node.js and npm

---

### Build and Test the Anchor Program locally

1. **Clone the repository**  
   ```bash
   git clone <repository-url>
   cd capstone
   ```
   
2. **Build anchor program**
    ```bash
    cd anchor
    anchor build
    ```

3. **Deploy program**
Deploy the program locally or to devnet
   ```bash
   anchor deploy --provider.cluster localnet
   ```

4. **Run tests**
Execute Anchor's testing suite:
    ```bash
    anchor test
    ```