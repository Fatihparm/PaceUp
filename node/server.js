const express = require('express');
const jwt = require('jsonwebtoken');
const { Buffer } = require('buffer');
const Cosmos = require('@keplr-wallet/cosmos');
const cors = require('cors'); 
require("dotenv").config();

const app = express();
app.use(express.json());
app.use(cors()); 

const SECRET_KEY = process.env.JWT_SECRET_KEY;


// Auth Endpoint
app.post('/auth', (req, res) => {
    const { walletAddress, signature, publicKeyBase64, message } = req.body;

    if (!walletAddress || !signature || !publicKeyBase64 || !message) {
        return res.status(400).json({ error: "Eksik veri gönderildi." });
    }

    const prefix = "celestia";

    // Convert signature and public key to Uint8Array
    const uint8Signature = new Uint8Array(Buffer.from(signature, 'base64'));
    const pubKeyUint8Array = new Uint8Array(Buffer.from(publicKeyBase64, 'base64'));

    // Verify the signature
    const isValid = Cosmos.verifyADR36Amino(prefix, walletAddress, message, pubKeyUint8Array, uint8Signature);

    if (!isValid) {
        return res.status(401).json({ error: "Geçersiz imza!" });
    }

    const authToken = jwt.sign(
        { sub: walletAddress, walletAddress },
        SECRET_KEY,
        { expiresIn: '1h' }
    );

    res.json({ auth_token: authToken });
});

// Verify Endpoint
app.post('/verify', (req, res) => {
    const { auth_token } = req.body;

    if (!auth_token) {
        return res.status(400).json({ error: "Token eksik!" });
    }

    jwt.verify(auth_token, SECRET_KEY, (err, decoded) => {
        if (err) {
            return res.status(401).json({ error: "Geçersiz veya süresi dolmuş token!" });
        }
        res.json({ walletAddress: decoded.walletAddress, message: "Token geçerli!" });
    });
});

// Start the server
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Auth API çalışıyor: http://localhost:${PORT}`);
});
