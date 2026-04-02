export const sendPushNotification = async ({
  title,
  message,
  url,
  logoUrl,
  collapseId,
}: {
  title: string;
  message: string;
  url?: string;
  logoUrl?: string | null;
  collapseId?: string;
}) => {
  const res = await fetch("https://onesignal.com/api/v1/notifications", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Key ${process.env.ONESIGNAL_REST_API_KEY}`,
    },
    body: JSON.stringify({
      app_id: process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID,
      included_segments: ["All"],
      headings: { en: title },
      contents: { en: message },
      url,
      ...(logoUrl ? { chrome_web_icon: logoUrl } : {}),
      ...(collapseId ? { collapse_id: collapseId } : {}),
      web_buttons: [
        {
          id: "ver-cita",
          text: "Ver cita →",
          url,
        },
      ],
    }),
  });

  if (!res.ok) {
    const data = await res.json();
    console.error("OneSignal error:", data);
  }
};