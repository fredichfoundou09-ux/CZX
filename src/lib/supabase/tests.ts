import { requireSupabase } from "./client";

export async function getStudentTest(testId: string) {
  const { data, error } = await requireSupabase().rpc("get_student_test", { p_test_id: testId });
  if (error) throw error;
  return data;
}

export async function submitStudentTest(testId: string, answers: Record<string, string>) {
  const { data, error } = await requireSupabase().functions.invoke("submit-test", { body: { testId, answers } });
  if (error) throw error;
  if (data?.error) throw new Error(data.error);
  return data;
}