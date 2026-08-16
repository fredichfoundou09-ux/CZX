# Tests — SENTINELLES NUMÉRIQUES

## Tests d'authentification

- [ ] Connexion avec identifiants valides
- [ ] Connexion avec identifiants invalides
- [ ] Déconnexion propre
- [ ] Session expirée → redirection
- [ ] Changement de mot de passe
- [ ] Réinitialisation du mot de passe
- [ ] Bootstrap Admin Sup unique
- [ ] Tentative de second bootstrap → refus

## Tests RBAC par rôle

- [ ] Super Admin : accès total
- [ ] Admin : gestion complète, pas de suppression Super Admin
- [ ] Teacher : ses modules, ses cours, ses notes
- [ ] Student : ses données uniquement
- [ ] Partner : lecture seule, aucun bouton d'écriture

## Tests Partenaire

- [ ] Lecture → OK
- [ ] Insertion → REFUS
- [ ] Modification → REFUS
- [ ] Suppression → REFUS
- [ ] Paramètres sensibles → REFUS
- [ ] Audit d'accès enregistré

## Tests RLS

- [ ] Student A → Student B : REFUS
- [ ] Teacher hors module → REFUS
- [ ] Partner → données sensibles : REFUS
- [ ] Anonymous → données privées : REFUS

## Tests métier

- [ ] Inscription d'apprenant
- [ ] Création d'enseignant
- [ ] Affectation de module
- [ ] Création de cours
- [ ] Enregistrement de présence
- [ ] Soumission de test
- [ ] Enregistrement de note
- [ ] Paiement et reçu
- [ ] Émission de certificat
- [ ] Attribut de bourse
