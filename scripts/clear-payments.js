const axios = require('axios');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const PI_API_KEY = process.env.PI_API_KEY;
// Check if --execute was passed in the terminal
const IS_DRY_RUN = !process.argv.includes('--execute');

async function clearPending() {
  console.log('--- 🛡️ Pi Payment Cleanup Tool ---');
  if (IS_DRY_RUN) {
    console.log('🧪 MODE: DRY RUN (No changes will be made. Use --execute to commit)');
  } else {
    console.log('⚠️ MODE: LIVE EXECUTION (Changes will be written to Pi Network)');
  }
  
  if (!PI_API_KEY) {
    console.error("❌ Error: PI_API_KEY is missing in .env");
    return;
  }
  console.log(`Using API Key starting with: ${PI_API_KEY.trim().substring(0, 8)}...`);

  try {
    const res = await axios.get('https://api.minepi.com/v2/payments/incomplete', {
      headers: { 
        'Authorization': `Key ${PI_API_KEY.trim()}`,
        'Content-Type': 'application/json'
      }
    });

    const incompletePayments = res.data.incomplete_payments || [];

    if (incompletePayments.length === 0) {
      console.log('✅ No incomplete payments found on the server.');
      return;
    }

    console.log(`🔍 Found ${incompletePayments.length} incomplete payments.`);

    for (const payment of incompletePayments) {
      const paymentId = payment.identifier;
      const txid = payment.transaction?.txid;
      const amount = payment.amount;

      if (!txid) {
        console.log(`[${paymentId}] ⚠️ No TXID. Action: CANCEL (${amount} Pi)`);
        if (!IS_DRY_RUN) {
          await axios.post(`https://api.minepi.com/v2/payments/${paymentId}/cancel`, {}, {
            headers: { 'Authorization': `Key ${PI_API_KEY.trim()}` }
          });
          console.log(`   ✅ Cancelled successfully.`);
        }
      } else {
        console.log(`[${paymentId}] 🚀 Found TXID. Action: COMPLETE (${amount} Pi)`);
        if (!IS_DRY_RUN) {
          await axios.post(`https://api.minepi.com/v2/payments/${paymentId}/complete`, { txid }, {
            headers: { 'Authorization': `Key ${PI_API_KEY.trim()}` }
          });
          console.log(`   ✅ Completed successfully.`);
        }
      }
    }
  } catch (err) {
    console.error("❌ Pi API Error:", err.response?.status, err.response?.data || err.message);
  }
}

clearPending();
