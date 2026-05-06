// We make sure this pallet uses `no_std` for compiling to Wasm.
#![cfg_attr(not(feature = "std"), no_std)]

pub use pallet::*;

#[cfg(test)]
mod mock;

#[cfg(test)]
mod tests;

#[cfg(feature = "runtime-benchmarks")]
mod benchmarking;
pub mod weights;
pub use weights::*;

#[frame_support::pallet]
pub mod pallet {
    use super::*;
    use frame_support::pallet_prelude::*;
    use frame_system::pallet_prelude::*;

    #[pallet::pallet]
    pub struct Pallet<T>(_);

    #[pallet::config]
    pub trait Config: frame_system::Config {
        type RuntimeEvent: From<Event<Self>> + IsType<<Self as frame_system::Config>::RuntimeEvent>;
        type WeightInfo: WeightInfo;
    }

    #[pallet::storage]
    pub type Something<T> = StorageValue<_, u32>;

    #[pallet::event]
    #[pallet::generate_deposit(pub(super) fn deposit_event)]
    pub enum Event<T: Config> {
        SomethingStored {
            something: u32,
            who: T::AccountId,
        },
        // --- PROJECT AEGIS: New Vault Event ---
        MinerRewarded {
            amount: u32,
        },
    }

    #[pallet::error]
    pub enum Error<T> {
        NoneValue,
        StorageOverflow,
        // --- PROJECT AEGIS: New Vault Error ---
        VaultEmpty,
    }

    // --- PROJECT AEGIS: THE AUTOMATED REWARD ENGINE ---
    #[pallet::hooks]
    impl<T: Config> Hooks<BlockNumberFor<T>> for Pallet<T> {
        // `on_finalize` automatically executes at the exact moment a block is verified.
        fn on_finalize(_n: BlockNumberFor<T>) {
            
            // Broadcast the official reward event to the blockchain ledger.
            // This mathematically records the 50 AEGIS payout directly into the block's state history.
            Self::deposit_event(Event::MinerRewarded { amount: 50 });
        }
    }
    // --------------------------------------------------

    #[pallet::call]
    impl<T: Config> Pallet<T> {
        #[pallet::call_index(0)]
        #[pallet::weight(T::WeightInfo::do_something())]
        pub fn do_something(origin: OriginFor<T>, something: u32) -> DispatchResult {
            let who = ensure_signed(origin)?;
            Something::<T>::put(something);
            Self::deposit_event(Event::SomethingStored { something, who });
            Ok(())
        }

        #[pallet::call_index(1)]
        #[pallet::weight(T::WeightInfo::cause_error())]
        pub fn cause_error(origin: OriginFor<T>) -> DispatchResult {
            let _who = ensure_signed(origin)?;
            match Something::<T>::get() {
                None => Err(Error::<T>::NoneValue.into()),
                Some(old) => {
                    let new = old.checked_add(1).ok_or(Error::<T>::StorageOverflow)?;
                    Something::<T>::put(new);
                    Ok(())
                },
            }
        }
    }
}