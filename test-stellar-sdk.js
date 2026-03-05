// Test script to check Stellar SDK exports
import * as StellarSdk from 'stellar-sdk';

console.log('Stellar SDK exports:');
console.log('Server:', typeof StellarSdk.Server);
console.log('Keypair:', typeof StellarSdk.Keypair);
console.log('TransactionBuilder:', typeof StellarSdk.TransactionBuilder);
console.log('Asset:', typeof StellarSdk.Asset);
console.log('Operation:', typeof StellarSdk.Operation);
console.log('Memo:', typeof StellarSdk.Memo);

// Try to access them
if (typeof StellarSdk.Server === 'function') {
  console.log('Server is a function');
} else {
  console.log('Server is not a function, type:', typeof StellarSdk.Server);
}