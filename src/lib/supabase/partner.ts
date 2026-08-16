import { requireSupabase } from "./client";

async function readView<T>(view: string, order?: { column: string; ascending?: boolean }): Promise<T[]> {
  let query = requireSupabase().from(view).select("*");
  if (order) query = query.order(order.column, { ascending: order.ascending ?? true });
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as T[];
}

export const partnerService = {
  async getDashboard() {
    const rows = await readView<Record<string, number>>("partner_report_view");
    return rows[0] ?? { total_students: 0, total_teachers: 0, active_modules: 0, total_attendance: 0, total_present: 0, total_certificates: 0 };
  },
  getStudents: () => readView<any>("partner_student_view", { column: "nom" }),
  getModules: () => readView<any>("partner_module_view", { column: "numero" }),
  getTeachers: () => readView<any>("partner_teacher_view", { column: "nom" }),
  getSchedule: () => readView<any>("partner_schedule_view", { column: "date", ascending: false }),
  getAttendance: () => readView<any>("partner_attendance_view", { column: "date", ascending: false }),
  getCourses: () => readView<any>("partner_course_view", { column: "date_publication", ascending: false }),
  getTests: () => readView<any>("partner_test_view", { column: "date_debut", ascending: false }),
  getGrades: () => readView<any>("partner_grade_view", { column: "date", ascending: false }),
  getCertificates: () => readView<any>("partner_certificate_view", { column: "date", ascending: false }),
  getScholarships: () => readView<any>("partner_scholarship_view", { column: "date", ascending: false }),
  async getProfile() {
    const client = requireSupabase();
    const { data: { user } } = await client.auth.getUser();
    if (!user) throw new Error("Session partenaire requise.");
    const { data, error } = await client.from("partner_users").select("id,poste,contact,scope,statut,date_debut,date_fin,partners_organizations(id,nom,description,site)").eq("user_id", user.id).single();
    if (error) throw error;
    return data;
  },
};