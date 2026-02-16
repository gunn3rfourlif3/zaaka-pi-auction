import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { paymentId } = req.body;
  
  // You would typically call the Pi Server API here to verify
  // For now, we return 200 to let the wallet proceed
  console.log(`Approving Payment: ${paymentId}`);
  return res.status(200).json({ message: "Approved" });
}