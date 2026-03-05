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
            // 1. Fetch current payment state from Pi Server to retrieve the TXID
            let paymentData;
            try {
                const response = await axiosClient.get(`/payments/${paymentId}`);
                paymentData = response.data;
            } catch (fetchError: any) {
                // Handle payment_not_found gracefully
                const errorMsg = fetchError.response?.data?.error_message || fetchError.message;
                if (errorMsg && errorMsg.includes('payment_not_found')) {
                    console.warn(`⚠️ Payment ${paymentId} not found on Pi Network. May have been settled already or created in different environment.`);
                    return { 
                        status: 'SETTLED', 
                        txid: 'NOT_FOUND_BUT_ASSUMED_SETTLED' 
                    };
                }
                // Re-throw other errors
                throw fetchError;
            }

            // IDEMPOTENCY CHECK: If already settled, don't error out
            if (paymentData.status === 'COMPLETED' || paymentData.status === 'SETTLED') {
                console.log(`ℹ️ Payment ${paymentId} already settled on Pi Network.`);
                return { 
                    status: 'SETTLED', 
                    txid: paymentData.transaction?.txid || 'EXISTING_TXID' 
                };
            }

            const txid = paymentData.transaction?.txid;

            if (!txid) {
                console.error(`❌ PiAPI Error: Payment ${paymentId} has no associated transaction ID.`);
                throw new Error("No TXID found for this payment.");
            }

            // 2. Complete the payment on Pi servers using the retrieved TXID
            const response = await axiosClient.post(`/payments/${paymentId}/complete`, {
                txid: txid 
            });

            return {
                status: 'SETTLED',
                txid: response.data.transaction?.txid || txid
            };
        } catch (error: any) {
            const errorMsg = error.response?.data?.error_message || error.message;
            
            // IDEMPOTENCY CATCH: If the server says it's already completed, treat as success
            if (errorMsg && (errorMsg.includes('already completed') || errorMsg.includes('already settled'))) {
                console.log(`ℹ️ Payment ${paymentId} was already completed (caught in error handler).`);
                return { 
                   status: 'SETTLED', 
                   txid: 'EXISTING_TXID_RECOVERED' 
               };
           }

            // Handle payment_not_found gracefully
            if (errorMsg && errorMsg.includes('payment_not_found')) {
                console.warn(`⚠️ Payment ${paymentId} not found on Pi Network. May have been settled already or created in different environment.`);
                return { 
                   status: 'SETTLED', 
                   txid: 'NOT_FOUND_BUT_ASSUMED_SETTLED' 
               };
           }

            console.error("Pi Settlement Error:", error.response?.data || error.message);
            throw new Error(`Failed to settle Pi payment: ${errorMsg}`);
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
            const server = new StellarSdk.Horizon.Server(HORIZON_URL);
            const sourceKeypair = StellarSdk.Keypair.fromSecret(WALLET_PRIVATE_SEED!);
            const sourceAccount = await server.loadAccount(sourceKeypair.publicKey());

            const transaction = new StellarSdk.TransactionBuilder(sourceAccount, {
                fee: (await server.fetchBaseFee()).toString(),
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