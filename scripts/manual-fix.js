const axios = require('axios');

const PI_API_KEY = "jmeafs86gkrxxi5q8vku2j2zqgbj6r4abedtdo8swmrq636ey7fcva66zjo1wz0q"; // From Pi Dev Dashboard
const PAYMENT_ID = "Bep0vOBcpYXwf7tWG7NcddBCnX4T";

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