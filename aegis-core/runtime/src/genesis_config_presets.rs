use alloc::{vec, vec::Vec};
use serde_json::json;
use sp_genesis_builder::PresetId;
use sp_keyring::Sr25519Keyring;
use crate::AccountId;

const TOTAL_SUPPLY: u128 = 1_000_000_000 * 1_000_000_000_000_000_000;

fn aegis_genesis(root: AccountId) -> serde_json::Value {
    json!({
        "balances": {
            "balances": [
                [root.clone(), TOTAL_SUPPLY]
            ]
        },
        "sudo": {
            "key": Some(root)
        }
    })
}

pub fn development_config_genesis() -> serde_json::Value {
    aegis_genesis(
        sp_keyring::Sr25519Keyring::Alice.to_account_id(),
    )
}

pub fn local_config_genesis() -> serde_json::Value {
    aegis_genesis(
        Sr25519Keyring::Alice.to_account_id(),
    )
}

pub fn get_preset(id: &PresetId) -> Option<Vec<u8>> {
    let patch = match id.as_ref() {
        id if id == sp_genesis_builder::DEV_RUNTIME_PRESET.as_bytes() => development_config_genesis(),
        id if id == sp_genesis_builder::LOCAL_TESTNET_RUNTIME_PRESET.as_bytes() => local_config_genesis(),
        _ => return None,
    };
    Some(
        serde_json::to_string(&patch)
            .expect("serialization to json is expected to work. qed.")
            .into_bytes(),
    )
}

pub fn preset_names() -> Vec<PresetId> {
    vec![
        PresetId::from(sp_genesis_builder::DEV_RUNTIME_PRESET),
        PresetId::from(sp_genesis_builder::LOCAL_TESTNET_RUNTIME_PRESET),
    ]
}