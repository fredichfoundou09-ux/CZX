import { ReactNode } from "react";
import { HashRouter, Routes, Route, Navigate } from "react-router-dom";
import { StoreProvider, useStore } from "@/lib/store";
import PublicLayout from "@/layouts/PublicLayout";
import DashboardLayout from "@/layouts/DashboardLayout";
import Home from "@/pages/public/Home";
import { FormationsPage, TarifsPage, PreInscriptionPage } from "@/pages/public/PublicPages";
import LoginPage from "@/pages/public/LoginPage";
import VerifyCertificate from "@/pages/public/VerifyCertificate";
import { AdminDashboard, JournalPage, ParametresPage } from "@/pages/admin/Dashboard";
import { StudentsPage, TeachersPage, UsersPage } from "@/pages/admin/People";
import {
  ModulesPage, SchedulePage, AttendancePage, CoursesPage, TestsPage, GradesPage,
  PaymentsPage, CertificatesPage, ScholarshipsPage,
} from "@/pages/admin/Operations";
import { ContentEditor } from "@/pages/admin/ContentEditor";
import { TeacherDashboard, TeacherClasses, TeacherStudents } from "@/pages/teacher/TeacherPages";
import {
  StudentDashboard, StudentProfile, MyFormation, MyModules, MySchedule, MyCourses,
  MyDocuments, MyAttendance, MyGrades, MyPayments, MyCertificate, MyScholarship,
} from "@/pages/student/StudentPages";
import PartnerPortal from "@/pages/partner/PartnerPortal";
import PartnerStudents from "@/pages/partner/PartnerStudents";
import PartnerTeachers from "@/pages/partner/PartnerTeachers";
import {
  PartnerFormations, PartnerSchedule, PartnerAttendance,
  PartnerCourses, PartnerTests, PartnerGrades,
  PartnerCertificates, PartnerScholarships, PartnerReports, PartnerEnya, PartnerProfile,
} from "@/pages/partner/PartnerPages";
import { MessageCenter, NotificationsPage } from "@/pages/shared/Communication";
import { EniaPage } from "@/pages/shared/Enia";
import SecurityPage from "@/pages/shared/SecurityPage";
import { EniaAdmin } from "@/pages/admin/EniaAdmin";
import { ShieldCheck } from "lucide-react";

function Gate({ roles, children }: { roles: string[]; children: ReactNode }) {
  const { user, authReady } = useStore();
  if (!authReady) return <div className="flex min-h-screen items-center justify-center text-sm text-cyan-300">Vérification de la session...</div>;
  if (!user) return <Navigate to="/connexion" replace />;
  if (!roles.includes(user.role)) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-red-500/30 bg-red-500/10">
          <ShieldCheck size={28} className="text-red-400" />
        </div>
        <h2 className="font-display text-xl font-black text-white">Accès non autorisé</h2>
        <p className="mt-2 max-w-sm text-sm text-slate-400">
          Votre rôle ne vous permet pas d'accéder à cette section. Contactez l'administration si vous pensez qu'il s'agit d'une erreur.
        </p>
      </div>
    );
  }
  return <>{children}</>;
}

function RoleDashboard() {
  const { user } = useStore();
  if (user?.role === "teacher") return <TeacherDashboard />;
  if (user?.role === "student") return <StudentDashboard />;
  if (user?.role === "partner" || user?.role === "partner_admin") return <PartnerPortal />;
  return <AdminDashboard />;
}

/** Empêche l'écran blanc si la fiche apprenant n'est pas encore disponible. */
function StudentGuard({ children }: { children: ReactNode }) {
  const { db, user } = useStore();
  const student = db.students.find((s) => s.userId === user?.id);
  if (!student) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-amber-400/30 bg-amber-400/10">
          <ShieldCheck size={28} className="text-amber-300" />
        </div>
        <h2 className="font-display text-xl font-black text-white">Fiche apprenant indisponible</h2>
        <p className="mt-2 max-w-sm text-sm text-slate-400">
          Votre compte est authentifié mais aucune fiche apprenant n'y est encore rattachée.
          Contactez l'administration pour finaliser votre inscription.
        </p>
      </div>
    );
  }
  return <>{children}</>;
}

/** Même protection pour les écrans formateur. */
function TeacherGuard({ children }: { children: ReactNode }) {
  const { db, user } = useStore();
  const teacher = db.teachers.find((t) => t.userId === user?.id);
  if (!teacher) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-amber-400/30 bg-amber-400/10">
          <ShieldCheck size={28} className="text-amber-300" />
        </div>
        <h2 className="font-display text-xl font-black text-white">Fiche formateur indisponible</h2>
        <p className="mt-2 max-w-sm text-sm text-slate-400">
          Votre compte est authentifié mais aucune fiche formateur n'y est encore rattachée.
          Contactez l'administration.
        </p>
      </div>
    );
  }
  return <>{children}</>;
}

function MyCoursesRoute() {
  const { user } = useStore();
  return user?.role === "student"
    ? <StudentGuard><MyCourses /></StudentGuard>
    : <CoursesPage />;
}

function ScheduleRoute() {
  const { user } = useStore();
  return user?.role === "student"
    ? <StudentGuard><MySchedule /></StudentGuard>
    : <SchedulePage />;
}

export default function App() {
  return (
    <StoreProvider>
      <HashRouter>
        <Routes>
          {/* Public */}
          <Route element={<PublicLayout />}>
            <Route path="/" element={<Home />} />
            <Route path="/formations" element={<FormationsPage />} />
            <Route path="/tarifs" element={<TarifsPage />} />
            <Route path="/pre-inscription" element={<PreInscriptionPage />} />
            <Route path="/connexion" element={<LoginPage />} />
            <Route path="/certificat/:numero?" element={<VerifyCertificate />} />
          </Route>

          {/* App */}
          <Route
            path="/app"
            element={
              <Gate roles={["superadmin", "admin", "teacher", "student", "partner", "partner_admin"]}>
                <DashboardLayout />
              </Gate>
            }
          >
            <Route path="dashboard" element={<RoleDashboard />} />
            <Route path="etudiants" element={<Gate roles={["superadmin", "admin"]}><StudentsPage /></Gate>} />
            <Route path="enseignants" element={<Gate roles={["superadmin", "admin"]}><TeachersPage /></Gate>} />
            <Route path="modules" element={<Gate roles={["superadmin", "admin"]}><ModulesPage /></Gate>} />
            <Route path="emploi-du-temps" element={<ScheduleRoute />} />
            <Route path="presences" element={<Gate roles={["superadmin", "admin", "teacher"]}><AttendancePage /></Gate>} />
            <Route path="cours" element={<Gate roles={["superadmin", "admin", "teacher"]}><CoursesPage /></Gate>} />
            <Route path="mes-cours" element={<Gate roles={["teacher", "student"]}><MyCoursesRoute /></Gate>} />
            <Route path="tests" element={<Gate roles={["superadmin", "admin", "teacher"]}><TestsPage /></Gate>} />
            <Route path="notes" element={<Gate roles={["superadmin", "admin", "teacher"]}><GradesPage /></Gate>} />
            <Route path="paiements" element={<Gate roles={["superadmin", "admin"]}><PaymentsPage /></Gate>} />
            <Route path="certificats" element={<Gate roles={["superadmin", "admin"]}><CertificatesPage /></Gate>} />
            <Route path="bourses" element={<Gate roles={["superadmin", "admin"]}><ScholarshipsPage /></Gate>} />
            <Route path="enia" element={<EniaPage />} />
            <Route path="enia-admin" element={<Gate roles={["superadmin", "admin"]}><EniaAdmin /></Gate>} />
            <Route path="messages" element={<MessageCenter />} />
            <Route path="notifications" element={<NotificationsPage />} />
            <Route path="securite" element={<SecurityPage />} />
            {/* Partner routes — lecture seule */}
            <Route path="partner/students" element={<Gate roles={["partner", "partner_admin", "superadmin", "admin"]}><PartnerStudents /></Gate>} />
            <Route path="partner/teachers" element={<Gate roles={["partner", "partner_admin", "superadmin", "admin"]}><PartnerTeachers /></Gate>} />
            <Route path="partner/formations" element={<Gate roles={["partner", "partner_admin", "superadmin", "admin"]}><PartnerFormations /></Gate>} />
            <Route path="partner/schedule" element={<Gate roles={["partner", "partner_admin", "superadmin", "admin"]}><PartnerSchedule /></Gate>} />
            <Route path="partner/attendance" element={<Gate roles={["partner", "partner_admin", "superadmin", "admin"]}><PartnerAttendance /></Gate>} />
            <Route path="partner/courses" element={<Gate roles={["partner", "partner_admin", "superadmin", "admin"]}><PartnerCourses /></Gate>} />
            <Route path="partner/tests" element={<Gate roles={["partner", "partner_admin", "superadmin", "admin"]}><PartnerTests /></Gate>} />
            <Route path="partner/grades" element={<Gate roles={["partner", "partner_admin", "superadmin", "admin"]}><PartnerGrades /></Gate>} />
            <Route path="partner/certificates" element={<Gate roles={["partner", "partner_admin", "superadmin", "admin"]}><PartnerCertificates /></Gate>} />
            <Route path="partner/scholarships" element={<Gate roles={["partner", "partner_admin", "superadmin", "admin"]}><PartnerScholarships /></Gate>} />
            <Route path="partner/reports" element={<Gate roles={["partner", "partner_admin", "superadmin", "admin"]}><PartnerReports /></Gate>} />
            <Route path="partner/enya" element={<Gate roles={["partner", "partner_admin", "superadmin", "admin"]}><PartnerEnya /></Gate>} />
            <Route path="partner/profile" element={<Gate roles={["partner", "partner_admin", "superadmin", "admin"]}><PartnerProfile /></Gate>} />
            <Route path="utilisateurs" element={<Gate roles={["superadmin"]}><UsersPage /></Gate>} />
            <Route path="contenu" element={<Gate roles={["superadmin", "admin"]}><ContentEditor /></Gate>} />
            <Route path="journal" element={<Gate roles={["superadmin", "admin"]}><JournalPage /></Gate>} />
            <Route path="parametres" element={<Gate roles={["superadmin", "admin"]}><ParametresPage /></Gate>} />
            <Route path="mes-classes" element={<Gate roles={["teacher"]}><TeacherGuard><TeacherClasses /></TeacherGuard></Gate>} />
            <Route path="mes-apprenants" element={<Gate roles={["teacher"]}><TeacherGuard><TeacherStudents /></TeacherGuard></Gate>} />
            <Route path="mon-profil" element={<Gate roles={["student"]}><StudentGuard><StudentProfile /></StudentGuard></Gate>} />
            <Route path="ma-formation" element={<Gate roles={["student"]}><StudentGuard><MyFormation /></StudentGuard></Gate>} />
            <Route path="mes-modules" element={<Gate roles={["student"]}><StudentGuard><MyModules /></StudentGuard></Gate>} />
            <Route path="mes-documents" element={<Gate roles={["student"]}><StudentGuard><MyDocuments /></StudentGuard></Gate>} />
            <Route path="mes-presences" element={<Gate roles={["student"]}><StudentGuard><MyAttendance /></StudentGuard></Gate>} />
            <Route path="mes-notes" element={<Gate roles={["student"]}><StudentGuard><MyGrades /></StudentGuard></Gate>} />
            <Route path="mes-paiements" element={<Gate roles={["student"]}><StudentGuard><MyPayments /></StudentGuard></Gate>} />
            <Route path="mon-certificat" element={<Gate roles={["student"]}><StudentGuard><MyCertificate /></StudentGuard></Gate>} />
            <Route path="ma-bourse" element={<Gate roles={["student"]}><StudentGuard><MyScholarship /></StudentGuard></Gate>} />
            <Route index element={<Navigate to="dashboard" replace />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </HashRouter>
    </StoreProvider>
  );
}
