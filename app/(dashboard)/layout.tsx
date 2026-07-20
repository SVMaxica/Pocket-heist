// komponenter
import Navbar from "@/components/Navbar";
import RouteGuard from "@/components/RouteGuard";

export default function HeistsLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <RouteGuard mode="require-authenticated" redirectTo="/login">
      <Navbar />
      <main>{children}</main>
    </RouteGuard>
  );
}
