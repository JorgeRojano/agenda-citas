export type AppointmentItem = {
  type: "appointment";
  id: string;
  start: Date;
  end: Date;
  clientName: string;
  service: string;
  status: string;
  phone: string;
  assignedTo: string | null;
};