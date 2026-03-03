"use client";

import { useEffect, useState } from "react";
import { browserSupabase } from "../supabaseBrowser";

export function useRealtimeAppointments(
  businessId: string,
  onNewBooking?: (booking: any) => void,
) {
  const [newAppointmentAlert, setNewAppointmentAlert] = useState<any>(null);

  useEffect(() => {
    if (!businessId) return;
    const channel = browserSupabase
      .channel(`Appointment:${businessId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "Appointment",
          filter: `businessId=eq.${businessId}`,
        },
        async (payload) => {
          try {
            // 🔥 Fetch related service
            const { data: service, error } = await browserSupabase
              .from("Service")
              .select("*")
              .eq("id", payload.new.serviceId)
              .single();

            if (error) {
              console.error("❌ Error fetching service:", error);
            }

            // 🔥 Merge appointment + service
            const enrichedAppointment = {
              ...payload.new,
              service: service ?? null,
            };

            setNewAppointmentAlert(enrichedAppointment);

            // Trigger callback
            onNewBooking?.(enrichedAppointment);
          } catch (err) {
            console.error("❌ Realtime handler error:", err);
          }
        },
      )
      .subscribe((status, err) => {
        console.log("📡 Canal status:", status); // <-- clave
        if (err) console.error("❌ Error canal:", err);
      });

    return () => {
      browserSupabase.removeChannel(channel);
    };
  }, [businessId]);

  return { newAppointmentAlert };
}
