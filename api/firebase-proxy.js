export default async function handler(req, res) {
  // Force accepter HTTP sans redirection
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // Accepter toutes les méthodes pour debug
  if (req.method === 'GET') {
    res.status(200).json({ status: 'Webhook ready', method: req.method });
    return;
  }
  
  if (req.method === 'POST') {
    try {
      console.log('Données reçues:', req.body);
      
      // Firebase config
      const FIREBASE_URL = 'https://testgps-1931a-default-rtdb.europe-west1.firebasedatabase.app';
      
      let data = req.body;
      if (typeof data === 'string') {
        data = JSON.parse(data);
      }
      
      data.received_at = new Date().toISOString();
      
      const response = await fetch(`${FIREBASE_URL}/messages.json`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      
      if (response.ok) {
        const result = await response.json();
        res.status(200).json({ success: true, firebase_key: result.name });
      } else {
        res.status(500).json({ error: 'Firebase failed' });
      }
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}
