export function getWhatsAppLink(phone: string, message: string) {
  // Limpia el teléfono: solo números
  const cleanPhone = phone.replace(/\D/g, "");
  // Si el número no tiene código de país, podrías agregarlo aquí (ej. "52" para México)
  const finalPhone = cleanPhone.startsWith('52') ? cleanPhone : `52${cleanPhone}`;

  const encodedMessage = encodeURIComponent(message);
  return `https://wa.me/${finalPhone}?text=${encodedMessage}`;
}

export function formatDateTimeMexico(selectedTime: string) {
  const dt = new Date(selectedTime);
  // use Mexico City timezone
  const optsDate: Intl.DateTimeFormatOptions = {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "America/Mexico_City",
  };
  const optsTime: Intl.DateTimeFormatOptions = {
    hour: "numeric",
    minute: undefined,
    hour12: true,
    timeZone: "America/Mexico_City",
  };
  const datePart = dt.toLocaleDateString("es-MX", optsDate);
  const timePart = dt.toLocaleTimeString("es-MX", optsTime);
  // datePart comes like "martes, 25 de febrero de 2026"
  // we want "Martes 25 de febrero a las 10 AM"
  // remove year and commas
  const withoutYear = datePart.replace(/,?\s*\d{4}/, "");
  // remove trailing ' de'
  const displayDateTime = `${withoutYear} a las ${timePart}`;
  return displayDateTime;
}

export function formatDateTimeForInput(selectedTime: string | Date) {
  if (typeof selectedTime === "string") {
    selectedTime = new Date(selectedTime);
  }

  const date = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Mexico_City",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(selectedTime);

  return date;
}

export function formatDateTimetoDisplay(selectedTime: string | Date) {
  if (typeof selectedTime === "string") {
    selectedTime = new Date(selectedTime);
  }

  const formattedDate = new Intl.DateTimeFormat("es-MX", {
    timeZone: "America/Mexico_City",
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(selectedTime);

  return formattedDate;
}
