import { MapPin, Users, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

export function QuickActionButtons() {
  const router = useRouter();
  const canCheckout = true; // Default to true as access is handled in main app

  const handleDirections = () => {
    // Open Google Maps to nearest location
    const salemCoords = "44.9429,-123.0351";
    // Portland coordinates: "45.5152,-122.6784" - available if needed
    window.open(`https://maps.google.com/?q=${salemCoords}`, '_blank');
  };

  const handleJoinWolfpack = () => {
    if (!canCheckout) {
      router.push('/wolfpack/join');
    } else {
      router.push('/wolfpack');
    }
  };

  return (
    <>
      <div className="grid grid-cols-3 gap-4 p-4">
      <Button 
        onClick={handleDirections}
        className="h-20 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white border-0 shadow-lg"
      >
        <div className="text-center">
          <MapPin className="w-6 h-6 mx-auto mb-1" />
          <div className="text-sm font-medium">Directions</div>
          <div className="text-xs opacity-80">Portland/Salem</div>
        </div>
      </Button>


      <Button 
        onClick={handleJoinWolfpack}
        className="h-20 text-white border-0 shadow-lg"
        style={{
          background: `linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--primary-light)) 100%)`,
          color: 'hsl(var(--primary-foreground))'
        }}
      >
        <div className="text-center">
          <Users className="w-6 h-6 mx-auto mb-1" />
          <div className="text-sm font-medium">Join the Wolfpack</div>
          <div className="text-xs opacity-80">Location verification</div>
        </div>
      </Button>

      <Button 
        onClick={() => router.push('/menu')}
        className="h-20 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white border-0 shadow-lg"
      >
        <div className="text-center">
          <Menu className="w-6 h-6 mx-auto mb-1" />
          <div className="text-sm font-medium">Food & Drink Menu</div>
          <div className="text-xs opacity-80">Browse offerings</div>
        </div>
      </Button>
      </div>

    </>
  );
}
