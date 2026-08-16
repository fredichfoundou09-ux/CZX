import type { AppRole } from "@/types/rbac";

export type Role = AppRole;
export type Formation = "informatique" | "industriel";

export interface Chapitre {
  id: string;
  titre: string;
  description: string;
}

export interface Module {
  id: string;
  formation: Formation;
  numero: number;
  titre: string;
  icon: string;
  notions: string[];
  // fiche détaillée
  description: string;
  objectifs: string[];
  programme: string;
  chapitres: Chapitre[];
  duree: string;
  image: string;
  extra: string;
}

export interface User {
  id: string;
  username: string;
  password: string;
  role: Role;
  name: string;
  email?: string;
  phone?: string;
  linkedId?: string;
  createdAt: string;
  actif?: boolean;
}

export interface Student {
  id: string;
  nom: string;
  prenom: string;
  dateNaissance: string;
  sexe: "M" | "F";
  telephone: string;
  whatsapp: string;
  email: string;
  adresse: string;
  niveau: string;
  formation: Formation;
  modules: string[];
  photo?: string;
  dateInscription: string;
  statutPaiement: "paye" | "partiel" | "impaye";
  statut: "actif" | "inactif";
  userId?: string;
}

export interface Teacher {
  id: string;
  nom: string;
  prenom: string;
  specialite: string;
  email: string;
  phone: string;
  modules: string[];
  photo?: string;
  infos?: string;
  userId?: string;
}

export interface PreRegistration {
  id: string;
  nom: string;
  prenom: string;
  telephone: string;
  whatsapp: string;
  email: string;
  niveau: string;
  formation: Formation;
  modules: string[];
  montantEstime: number;
  formule: string;
  date: string;
  statut: "en_attente" | "confirmee" | "refusee";
}

export interface Course {
  id: string;
  titre: string;
  description: string;
  moduleId: string;
  teacherId: string;
  type: "cours" | "document" | "devoir";
  content: string;
  date: string;
}

export interface ScheduleItem {
  id: string;
  jour: string;
  heureDebut: string;
  heureFin: string;
  moduleId: string;
  teacherId: string;
  salle: string;
  formation: Formation;
}

export type AttendanceStatus = "present" | "absent" | "retard";

export interface AttendanceRecord {
  id: string;
  studentId: string;
  date: string;
  moduleId: string;
  statut: AttendanceStatus;
  heure: string;
  salle: string;
  teacherId: string;
}

export interface Payment {
  id: string;
  studentId: string;
  type: "inscription" | "formation";
  libelle: string;
  montant: number;
  date: string;
  mode: string;
  statut: "paye" | "partiel" | "impaye";
  reste: number;
}

export interface Question {
  id: string;
  question: string;
  type: "qcm" | "vf" | "courte";
  options?: string[];
  bonneReponse: string;
  points: number;
  explication?: string;
}

export interface Test {
  id: string;
  titre: string;
  moduleId: string;
  chapitre?: string;
  teacherId: string;
  questions: Question[];
  date: string;
  duree: number;
  dateDebut?: string;
  dateFin?: string;
  niveau?: "facile" | "moyen" | "difficile";
  tentativesMax?: number;
  corrections: "immediat" | "apres_validation";
}

export interface TestResult {
  id: string;
  testId: string;
  studentId: string;
  note: number;
  pourcentage: number;
  date: string;
  answers: Record<string, string>;
  reussi: boolean;
  valide: boolean;
}

export interface Grade {
  id: string;
  studentId: string;
  moduleId: string;
  note: number;
  appreciation: string;
  date: string;
}

export interface Message {
  id: string;
  fromId: string;
  fromName: string;
  toId: string;
  subject: string;
  body: string;
  date: string;
  lu: boolean;
}

export interface Notification {
  id: string;
  toId: string;
  title: string;
  body: string;
  date: string;
  lu: boolean;
  type: string;
}

export interface Certificate {
  id: string;
  studentId: string;
  numero: string;
  formation: Formation;
  modules: string[];
  periode: string;
  resultat: string;
  note: number;
  date: string;
}

export type ScholarshipStatus =
  | "en_attente"
  | "test_programme"
  | "test_effectue"
  | "admis"
  | "non_admis"
  | "bourse_attribuee";

export interface Scholarship {
  id: string;
  studentId: string;
  statut: ScholarshipStatus;
  date: string;
}

export interface LogEntry {
  id: string;
  date: string;
  user: string;
  action: string;
}

export interface FeeRow {
  id: string;
  label: string;
  modules: number;
  montant: number;
}

export interface Avantage {
  id: string;
  titre: string;
  description: string;
  explication: string;
  extra: string;
  image: string;
}

export interface Partner {
  id: string;
  nom: string;
  description: string;
  logo: string;
  site: string;
  actif: boolean;
  telephone?: string;
  email?: string;
  ordre?: number;
}

/* ============ MODULE ENIA 2.0 ============ */
export interface EniaFeeRow {
  id: string;
  label: string;
  valeur: string;
}

export interface EniaPieceGroup {
  id: string;
  titre: string;
  items: string[];
  frais?: string;
}

export interface EniaAvantage {
  id: string;
  texte: string;
}

export interface EniaHighlight {
  id: string;
  numero: string;
  texte: string;
}

export interface EniaContent {
  enabled: boolean;
  nom: string;
  sousTitre: string;
  accroche: string;
  presentationTitre: string;
  presentation: string;
  affiche: string;
  afficheTelechargeable: boolean;
  bourse: {
    titre: string;
    intro: string;
    avantages: EniaAvantage[];
    concretementTitre: string;
    concretement: string;
  };
  highlightTitre: string;
  highlights: EniaHighlight[];
  fraisTitre: string;
  frais: EniaFeeRow[];
  piecesTitre: string;
  piecesNote: string;
  pieces: EniaPieceGroup[];
  lien: { nom: string; url: string; description: string; actif: boolean };
}

export interface Announcement {
  id: string;
  titre: string;
  body: string;
  date: string;
  actif: boolean;
  type: "info" | "important" | "offre";
}

export interface SiteContent {
  branding: { name: string; subtitle: string; tagline: string; badge: string };
  hero: {
    responsibleName: string;
    responsibleTitle: string;
    responsibleImage: string;
    highlight: string;
  };
  infos: {
    debut: string;
    lieu: string;
    duree: string;
    whatsapp: string[];
    inscription: string;
  };
  frais: {
    inscription: number;
    informatique: FeeRow[];
    industriel: FeeRow[];
  };
  formations: {
    informatique: { titre: string; description: string };
    industriel: { titre: string; description: string };
  };
  avantages: Avantage[];
  partenaires: Partner[];
  annonces: Announcement[];
  apropos: { titre: string; texte: string };
  enia: EniaContent;
  bourse: { title: string; subtitle: string; button: string };
  preInscription: { enabled: boolean; title: string; description: string };
  contact: { email: string; adresse: string };
}

export interface DB {
  version: number;
  settings: SiteContent;
  modules: Module[];
  users: User[];
  students: Student[];
  teachers: Teacher[];
  registrations: PreRegistration[];
  courses: Course[];
  schedule: ScheduleItem[];
  attendance: AttendanceRecord[];
  payments: Payment[];
  tests: Test[];
  results: TestResult[];
  grades: Grade[];
  messages: Message[];
  notifications: Notification[];
  certificates: Certificate[];
  scholarships: Scholarship[];
  log: LogEntry[];
}
