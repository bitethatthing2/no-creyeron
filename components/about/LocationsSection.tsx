/**
 * LocationsSection - Real location information for Side Hustle
 * Uses only verified addresses and hours
 */

import Image from 'next/image';

export function LocationsSection() {
  const locations = [
    {
      name: "Salem",
      address: "145 Liberty St NE Suite #101",
      city: "Salem, OR 97301",
      phone: "503-585-7827",
      image: "/icons/salem-location.jpg",
      hours: {
        "Monday - Wednesday": "10:00 AM - 11:00 PM",
        "Thursday": "Closed",
        "Friday": "10:00 AM - 12:00 AM",
        "Saturday - Sunday": "10:00 AM - 2:00 AM"
      },
      status: "Open"
    },
    {
      name: "Portland",
      address: "327 SW Morrison St",
      city: "Portland, OR 97204",
      phone: "503-XXX-XXXX", // Update when available
      image: "/icons/portland-side-hustle.jpg",
      hours: {
        "Monday - Wednesday": "10:00 AM - 11:00 PM",
        "Thursday": "10:00 AM - 1:00 AM",
        "Friday - Saturday": "10:00 AM - 2:30 AM",
        "Sunday": "10:00 AM - 12:00 AM"
      },
      status: "Open"
    }
  ];

  return (
    <section className="py-16 bg-gray-900">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl sm:text-4xl font-bold text-center mb-4 text-white">
          Our Locations
        </h2>
        <p className="text-lg text-gray-400 text-center mb-12 max-w-2xl mx-auto">
          Find us in Salem and Portland, Oregon.
        </p>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {locations.map((location, index) => (
            <div key={index} className="bg-black rounded-lg overflow-hidden border border-red-600/20">
              {/* Location Image */}
              <div className="relative h-64">
                <Image
                  src={location.image}
                  alt={`Side Hustle ${location.name} Location`}
                  fill
                  className="object-cover"
                />
                <div className="absolute top-4 right-4">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    location.status === 'Open' 
                      ? 'bg-green-600 text-white' 
                      : 'bg-yellow-600 text-black'
                  }`}>
                    {location.status}
                  </span>
                </div>
              </div>
              
              {/* Location Details */}
              <div className="p-6">
                <h3 className="text-2xl font-bold text-white mb-4">
                  Side Hustle {location.name}
                </h3>
                
                {/* Address */}
                <div className="mb-4">
                  <p className="text-gray-300">{location.address}</p>
                  <p className="text-gray-300">{location.city}</p>
                  <p className="text-red-400 font-medium mt-1">{location.phone}</p>
                </div>
                
                {/* Hours */}
                <div>
                  <h4 className="text-lg font-semibold text-white mb-3">Hours</h4>
                  <div className="space-y-2">
                    {Object.entries(location.hours).map(([days, hours]) => (
                      <div key={days} className="flex justify-between">
                        <span className="text-gray-400">{days}</span>
                        <span className="text-gray-300">{hours}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}