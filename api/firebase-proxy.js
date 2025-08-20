export default async function handler(req, res) {
  // Configuration Firebase
  const FIREBASE_URL = 'https://testgps-1931a-default-rtdb.europe-west1.firebasedatabase.app';
  const FIREBASE_PATH = '/messages';
  
  // Headers CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  
  try {
    let data = req.body;
    
    if (typeof data === 'string') {
      try {
        data = JSON.parse(data);
      } catch (e) {
        data = { message: data, timestamp: Date.now() };
      }
    }
    
    data.received_at = new Date().toISOString();
    
    // Envoyer vers Firebase
    const firebaseUrl = `${FIREBASE_URL}${FIREBASE_PATH}.json`;
    
    const response = await fetch(firebaseUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    
    if (response.ok) {
      const result = await response.json();
      res.status(200).json({
        success: true,
        firebase_key: result.name
      });
    } else {
      res.status(500).json({ error: 'Firebase error' });
    }
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
