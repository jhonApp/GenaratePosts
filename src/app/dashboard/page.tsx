import { UserButton } from "@clerk/nextjs";

export default function DashboardPage() {
  return (
    <div className="min-h-screen p-8 bg-white">
      <div className="max-w-7xl mx-auto flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard Protegido</h1>
        <UserButton afterSignOutUrl="/" />
      </div>
      <div className="p-6 bg-gray-50 rounded-xl border border-gray-200">
        <p className="text-gray-700">Bem-vindo! Se você está vendo isso, você está autenticado.</p>
      </div>
    </div>
  );
}
