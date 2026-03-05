// Test script to check Stellar SDK Horizon/RPC classes
import * as StellarSdk from 'stellar-sdk';

console.log('Horizon/RPC classes:');
console.log('Horizon:', typeof StellarSdk.Horizon);
console.log('rpc:', typeof StellarSdk.rpc);

// Check if there's a Server class in Horizon
if (StellarSdk.Horizon) {
  console.log('Horizon properties:', Object.keys(StellarSdk.Horizon));
}

if (StellarSdk.rpc) {
  console.log('RPC properties:', Object.keys(StellarSdk.rpc));
}