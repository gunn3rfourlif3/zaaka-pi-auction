import axios from 'axios';
import * as StellarSdk from 'stellar-sdk';

const PI_API_URL = "https://api.minepi.com/v2";
const PI_API_KEY = process.env.PI_API_KEY;
const WALLET_PRIVATE_SEED = process.env.PI_WALLET_SEED;
const NETWORK = process.env.NODE_ENV === 'production' ? 'Pi Network' : 'Pi Testnet';
const HORIZON_URL = process.env.NODE_ENV === 'production' 
    ? 'https://api.mainnet.minepi.com' 
    : 'https://api.testnet.minepi.com';

const axiosClient = axios.create({
    baseURL: PI_API_URL,
    timeout: 20000,
    headers: { 'Authorization': `Key ${PI_API_KEY}`, 'Content-Type': 'application/json' }
});

export const PiAPI = {
    /**
     * SETTLE PAYMENT (U2A)
     * Moves Pi from Buyer to Platform Wallet
     */
    settlePayment: async (paymentId: string) => {
        // --- MOCK BYPASS ---
        if (paymentId.startsWith('pay_mock')) {
            console.log(`🛠️ PiAPI: Simulating Settlement for Mock ID: ${paymentId}`);
            return { status: 'SETTLED', txid: `mock_settle_tx_${Math.random().toString(36).substring(7)}` };
        }

        try {
            const response = await axiosClient.post(`/payments/${paymentId}/complete`, {
                txid: null 
            });
            return {
                status: 'SETTLED',
                txid: response.data.transaction?.txid || 'internal_settlement'
            };
        } catch (error: any) {
            console.error("Pi Settlement Error:", error.response?.data || error.message);
            throw new Error("Failed to settle Pi payment.");
        }
    },

    /**
     * SUBMIT PAYOUT (A2U)
     * Moves Pi from Platform Wallet to Seller
     */
    submitPayout: async (uid: string, amount: number) => {
        // --- MOCK BYPASS ---
        if (uid.includes('mock') || uid.includes('pioneer')) {
            console.log(`🛠️ PiAPI: Simulating Payout for Mock UID: ${uid}`);
            return { 
                status: 'COMPLETED', 
                txid: `mock_payout_tx_${Math.random().toString(36).substring(7)}` 
            };
        }

        try {
            // 1. Create Payment on Pi Servers
            const paymentBody = {
                amount,
                memo: "Zaaka Auction Payout",
                metadata: { type: "escrow_release" },
                uid: uid
            };
            const { data: payment } = await axiosClient.post('/payments', paymentBody);
            const paymentId = payment.identifier;
            const recipientAddress = payment.recipient_address;

            // 2. Build Blockchain Transaction
            const server = new StellarSdk.Server(HORIZON_URL);
            const sourceKeypair = StellarSdk.Keypair.fromSecret(WALLET_PRIVATE_SEED!);
            const sourceAccount = await server.loadAccount(sourceKeypair.publicKey());

            const transaction = new StellarSdk.TransactionBuilder(sourceAccount, {
                fee: await server.fetchBaseFee(),
                networkPassphrase: NETWORK,
                timebounds: await server.fetchTimebounds(180)
            })
            .addOperation(StellarSdk.Operation.payment({
                destination: recipientAddress,
                asset: StellarSdk.Asset.native(),
                amount: amount.toString()
            }))
            .addMemo(StellarSdk.Memo.text(paymentId))
            .setTimeout(180)
            .build();

            // 3. Sign and Submit
            transaction.sign(sourceKeypair);
            const { hash: txid } = await server.submitTransaction(transaction);

            // 4. Finalize on Pi Servers
            await axiosClient.post(`/payments/${paymentId}/complete`, { txid });

            return { status: 'COMPLETED', txid };
        } catch (error: any) {
            console.error("Pi Payout Error:", error.response?.data || error.message);
            throw new Error("A2U Payout failed.");
        }
    }
};