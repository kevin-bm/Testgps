// api/firebase-proxy.js
// Webhook Vercel qui redirige HTTP vers Firebase HTTPS

export default async function handler(req, res) {
  // Configuration Firebase
  const FIREBASE_URL = 'https://testgps-1931a-default-rtdb.europe-west1.firebasedatabase.app';
  const FIREBASE_PATH = '/messages';
  
  // Autoriser CORS pour les requêtes externes
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // Gérer les requêtes OPTIONS (preflight)
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  // Ne traiter que les requêtes POST
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed. Use POST.' });
    return;
  }
  
  try {
    // Récupérer les données du SIM7000G
    let data = req.body;
    
    // Si les données sont en string (cas du SIM7000G), parser en JSON
    if (typeof data === 'string') {
      try {
        data = JSON.parse(data);
      } catch (e) {
        // Si ce n'est pas du JSON valide, créer un objet
        data = {
          message: data,
          timestamp: Date.now(),
          source: 'raw_data'
        };
      }
    }
    
    // Ajouter des métadonnées
    data.received_at = new Date().toISOString();
    data.proxy_version = '1.0';
    data.source_ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    
    console.log('Données reçues du SIM7000G:', data);
    
    // Envoyer vers Firebase via HTTPS
    const firebaseUrl = `${FIREBASE_URL}${FIREBASE_PATH}.json`;
    
    const firebaseResponse = await fetch(firebaseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data)
    });
    
    if (firebaseResponse.ok) {
      const firebaseResult = await firebaseResponse.json();
      
      console.log('Succès Firebase:', firebaseResult);
      
      // Répondre au SIM7000G avec succès
      res.status(200).json({
        success: true,
        message: 'Data sent to Firebase successfully',
        firebase_key: firebaseResult.name,
        timestamp: new Date().toISOString()
      });
      
    } else {
      console.error('Erreur Firebase:', firebaseResponse.status, firebaseResponse.statusText);
      
      res.status(500).json({
        success: false,
        error: 'Firebase error',
        status: firebaseResponse.status
      });
    }
    
  } catch (error) {
    console.error('Erreur webhook:', error);
    
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error.message
    });
  }
}

/*
DÉPLOIEMENT SUR VERCEL:

1. Créez un compte sur https://vercel.com
2. Connectez votre GitHub
3. Créez un nouveau repo avec ces fichiers:

Structure du projet:
├── api/
│   └── firebase-proxy.js (ce fichier)
├── package.json
└── vercel.json

4. Déployez sur Vercel
5. Obtenez l'URL: https://votre-projet.vercel.app

CONFIGURATION ARDUINO:
Remplacez dans le code Arduino:
const String PROXY_HOST = "votre-projet.vercel.app";
const String PROXY_PATH = "/api/firebase-proxy";

FONCTIONNEMENT:
1. SIM7000G envoie HTTP POST vers Vercel
2. Vercel reçoit les données
3. Vercel les redirige vers Firebase HTTPS
4. Firebase stocke les données
5. Vercel confirme le succès au SIM7000G

AVANTAGES:
- Gratuit (limite généreuse Vercel)
- Pas de SSL requis côté SIM7000G
- Logs d'erreurs disponibles
- Entièrement contrôlé par vous
*/
