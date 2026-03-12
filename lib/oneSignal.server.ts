export const sendPushNotification = async ({
  title,
  message,
  url,
}: {
  title: string;
  message: string;
  url?: string;
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
      collapse_id: `appointment-${Date.now()}`,
      web_buttons: [
        {
          id: "ver-cita",
          text: "Ver cita →",
          url,
        },
      ],
    }),
  });

  const data = await res.json();

  if (!res.ok) {
    console.error("OneSignal error:", await res.text());
  }
};