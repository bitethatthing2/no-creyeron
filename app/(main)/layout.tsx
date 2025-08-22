interface MainLayoutProps {
  children: React.ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  // AppHeader removed - using BottomNav from root layout instead
  return children;
}