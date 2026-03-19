import { createBrowserSupabaseClient } from "./supabaseBrowser";

export async function getBusinessSchedule(businessId: string) {
  const browserSupabase = createBrowserSupabaseClient();
  const { data, error } = await browserSupabase
    .from("BusinessTimeSlot")
    .select("dayOfWeek")
    .eq("businessId", businessId);

  if (error) {
    console.error("Error fetching schedule:", error);
    return null;
  }

  if (!data) return null;

  // Días que SÍ tienen al menos un slot
  const openDays = [...new Set(data.map((d) => d.dayOfWeek))];

  // Todos los días posibles (0-6)
  const allDays = [0, 1, 2, 3, 4, 5, 6];

  // Los que NO están en openDays → están cerrados
  const closedDays = allDays.filter((day) => !openDays.includes(day));

  return {
    closedDays,
  };
}