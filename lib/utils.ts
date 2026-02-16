export function getWhatsAppLink(phone: string, message: string) {
  // Limpia el teléfono: solo números
  const cleanPhone = phone.replace(/\D/g, "");
  // Si el número no tiene código de país, podrías agregarlo aquí (ej. "52" para México)
  // const finalPhone = cleanPhone.startsWith('52') ? cleanPhone : `52${cleanPhone}`;
  
  const encodedMessage = encodeURIComponent(message);
  return `https://wa.me/${cleanPhone}?text=${encodedMessage}`;
}