import { browserSupabase } from "./supabaseBrowser";

export async function getBusinessSchedule(businessId: string) {
  const { data, error } = await browserSupabase
    .from("BusinessSchedule")
    .select("closedDays, openTime, closeTime")
    .eq("businessId", businessId)
    .single();

  if (error) {
    console.error("Error fetching schedule:", error);
    return null;
  }

  return data;
}