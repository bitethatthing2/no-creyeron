interface MenuLayoutProps {
  children: React.ReactNode;
}

// Menu pages have their own header, so we skip the main header
export default function MenuLayout({ children }: MenuLayoutProps) {
  return children;
}