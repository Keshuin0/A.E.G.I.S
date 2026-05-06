use subxt::{OnlineClient, PolkadotConfig};
use subxt_signer::sr25519::dev;

#[subxt::subxt(runtime_metadata_path = "metadata.scale")]
pub mod aegis {}

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    println!("🛡️ AEGIS WALLET CLI v1.0");
    
    let api = OnlineClient::<PolkadotConfig>::from_url("ws://127.0.0.1:9944").await?;
    println!("✅ Connected to Project AEGIS Network!");

    // 1. Load Alice's Private Development Key (The Signer)
    let alice_signer = dev::alice();
    
    // 2. Load Bob's Public Address (The Destination)
    let bob_address = subxt::utils::AccountId32::from(dev::bob().public_key());
    let destination = subxt::utils::MultiAddress::Id(bob_address);
    
    // 3. Set the Amount: 500 AEGIS (Multiply by 10^12 for Substrate's Planck decimals)
    let amount = 500_000_000_000_000;
    
    println!("🚀 Initiating secure transfer of 500 AEGIS from Alice to Bob...");
    
    // 4. Construct the Extrinsic (Transaction) using the metadata
    let tx = aegis::tx().balances().transfer_allow_death(destination, amount);
    
    println!("⏳ Transaction submitted. Waiting for Node 2 and the RTX 5090 to verify and finalize...");

    // 5. Sign and Submit
    let events = api
        .tx()
        .sign_and_submit_then_watch_default(&tx, &alice_signer)
        .await?
        .wait_for_finalized_success()
        .await?;
        
    println!("🎉 SUCCESS! Transaction Finalized in the Ledger.");
    println!("📄 Cryptographic Hash: {:?}", events.extrinsic_hash());
    
    Ok(())
}