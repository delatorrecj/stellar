remember these three things:
cd contract
cargo clean
stellar contract build

stellar contract deploy `  --wasm target/wasm32v1-none/release/stella.wasm`
--source my-key `
--network testnet

note: according to the organizers it is a must to have 5 successful deployments to fully test the system integrity
