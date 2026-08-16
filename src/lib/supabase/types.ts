import type { AppRole } from "@/types/rbac";

export type Role = AppRole;

export interface Profile { id: string; username: string; name: string; email: string | null; phone: string | null; role: Role; active: boolean; avatar_path: string | null; must_change_password?: boolean; created_at: string; updated_at: string; }
export interface FormationRow { id: string; code: string; name: string; description: string; active: boolean; }
export interface ModuleRow { id: string; formation_id: string; numero: number; titre: string; icon: string; description: string; objectifs: string[]; programme: string; duree: string; extra: string; image_path: string | null; active: boolean; }
export interface StudentRow { id: string; user_id: string | null; formation_id: string; group_id: string | null; nom: string; prenom: string; date_naissance: string | null; sexe: string | null; telephone: string; whatsapp: string; email: string; adresse: string; niveau: string; photo_path: string | null; date_inscription: string; statut: "actif" | "inactif" | "bloque"; }
export interface TeacherRow { id: string; user_id: string | null; nom: string; prenom: string; specialite: string; email: string; phone: string; photo_path: string | null; infos_pro: string; diplomes: string; type_contrat: string; tarif_horaire: number; heures_prevues: number; active: boolean; }
export interface CourseRow { id: string; titre: string; description: string; module_id: string; teacher_id: string; formation_id: string | null; group_id: string | null; type: "cours" | "document" | "devoir"; content: string; audience: "module" | "group" | "custom"; publie: boolean; date_publication: string | null; created_at: string; }
export interface EniaContentRow { id: boolean; visible: boolean; nom: string; sous_titre: string; accroche: string; presentation_titre: string; presentation: string; affiche_path: string | null; allow_download_affiche: boolean; bourse_titre: string; bourse_intro: string; bourse_concretement: string; highlight_titre: string; lien_nom: string; lien_url: string; lien_description: string; lien_actif: boolean; }
