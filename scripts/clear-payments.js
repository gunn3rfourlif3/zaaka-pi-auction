const axios = require('axios');

// Replace this with your actual API Key from the Pi Developer Dashboard
const PI_API_KEY = "jmeafs86gkrxxi5q8vku2j2zqgbj6r4abedtdo8swmrq636ey7fcva66zjo1wz0q"; 

async function clearPending() {
  console.log('--- Starting Payment Cleanup ---');
  
  try {
    // 1. Fetch incomplete payments specifically
    // Note: The Pi API sometimes requires full qualification or specific filters
    const res = await axios.get('https://api.minepi.com/v2/payments/incomplete', {
      headers: { Authorization: `Key ${PI_API_KEY}` }
    });

    const incompletePayments = res.data.incomplete_payments || [];

    if (incompletePayments.length === 0) {
      console.log('No incomplete payments found on the server.');
      return;
    }

    console.log(`Found ${incompletePayments.length} incomplete payments.`);

    for (const payment of incompletePayments) {
      const paymentId = payment.identifier;
      const txid = payment.transaction?.txid;

      if (!txid) {
        console.log(`⚠️ Payment ${paymentId} has no transaction ID yet. You may need to cancel it instead.`);
        continue;
      }

      console.log(`Attempting to complete: ${paymentId}`);
      
      // 2. Complete the payment
      await axios.post(`https://api.minepi.com/v2/payments/${paymentId}/complete`, 
        { txid: txid },
        { headers: { Authorization: `Key ${PI_API_KEY}` }}
      );
      
      console.log(`✅ Successfully completed ${paymentId}`);
    }
  } catch (err) {
    if (err.response) {
      console.error("Pi API Error:", err.response.status, err.response.data);
    } else {
      console.error("Connection Error:", err.message);
    }
  }
}

clearPending();