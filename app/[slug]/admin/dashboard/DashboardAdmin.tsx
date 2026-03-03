"use client";

type Props = {
  business: {
    id: string;
  };
};

export const DashboardAdmin = () => {
  return (
    <div>
      <h1>Dashboard</h1>
      <p>
        Bienvenido al panel de administración. Aquí podrás gestionar tu negocio,
        ver estadísticas y configurar tus servicios.
      </p>
    </div>
  );
};

export default DashboardAdmin;
