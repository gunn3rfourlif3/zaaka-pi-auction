const axios = require('axios');

const PI_API_KEY = "2dpdlrlgtczswfe7akru61b61ssnyqgwhsow0d5efhw7e1jrmdnxibdx4e5txejz"; // From Pi Dev Dashboard
const PAYMENT_ID = "JJQgUsj28fFtHkHR1GukEVABfwKu";

async function fix() {
  try {
    // 1. Get the transaction ID (txid) first
    const res = await axios.get(`https://api.minepi.com/v2/payments/${PAYMENT_ID}`, {
      headers: { Authorization: `Key ${PI_API_KEY}` }
    });

    const txid = res.data.transaction.txid;
    console.log(`Found Transaction ID: ${txid}`);

    // 2. Tell Pi Network to complete it
    await axios.post(`https://api.minepi.com/v2/payments/${PAYMENT_ID}/complete`, 
      { txid: txid },
      { headers: { Authorization: `Key ${PI_API_KEY}` }}
    );

    console.log("✅ Success! Payment cleared. You can now bid again.");
  } catch (err) {
    console.error("Error:", err.response?.data || err.message);
  }
}

fix();