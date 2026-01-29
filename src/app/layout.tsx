import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ProjectProvider } from "@/contexts/project-context";
import { ProjectSelector } from "@/components/project-selector";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "ConstructFlow",
  description: "Sistema de gestão de obras de construção civil",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className={inter.className}>
        <ProjectProvider>
          <div className="flex flex-col h-screen bg-gray-50">
            {/* Header com Seletor de Obra */}
            <header className="bg-white border-b border-gray-200 px-4 py-3 md:px-6 flex-shrink-0">
              <div className="flex items-center justify-between gap-4">
                {/* Logo/Título */}
                <div className="flex items-center gap-3">
                  <h1 className="text-xl font-semibold text-gray-900">
                    ConstructFlow
                  </h1>
                </div>
                
                {/* Seletor de Obra */}
                <div className="flex-1 md:flex-initial max-w-md">
                  <ProjectSelector />
                </div>
                
                {/* Espaço para futuros elementos */}
                <div className="flex items-center gap-2">
                  {/* Notificações, perfil, etc */}
                </div>
              </div>
            </header>

            {/* Page Content */}
            <main className="flex-1 overflow-y-auto p-4 md:p-6">
              {children}
            </main>
          </div>
        </ProjectProvider>
      </body>
    </html>
  );
}
