import RouteGuard from "@/components/RouteGuard";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <main className="public">
      <RouteGuard mode="require-unauthenticated" redirectTo="/heists">
        {children}
      </RouteGuard>
    </main>
  );
}
