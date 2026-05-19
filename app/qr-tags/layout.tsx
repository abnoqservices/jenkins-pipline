import Link from 'next/link';
import { DashboardLayout } from "@/components/dashboard/layout"
export default function QRTagsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DashboardLayout>
    
        {children}
     
    </DashboardLayout>
  );
}