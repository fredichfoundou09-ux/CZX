# QR Scanner — Architecture sécurisée

## Token QR

Le QR Code contient un token signé et temporaire :

```json
{
  "student_id": "SN-2026-00001",
  "session_id": "uuid_schedule",
  "issued_at": "2026-08-15T09:00:00Z",
  "expires_at": "2026-08-15T09:30:00Z",
  "signature": "hmac-sha256"
}
```

## Flux de scan

```text
Caméra
   ↓
Scan QR
   ↓
Extraction token
   ↓
Vérification serveur
   ├── Token valide ?
   ├── Non expiré ?
   ├── Étudiant reconnu ?
   ├── Séance correspondante ?
   └── Pas de doublon ?
   ↓
Présence enregistrée
   ↓
Audit log
```

## Anti-fraude

- Token signé HMAC
- Expiration automatique (durée de la séance)
- Vérification anti-doublon
- Horodatage serveur

## Mode offline

```text
Scan → IndexedDB → Queue → Connexion → Sync
```

Vérification des conflits avec idempotency key.
