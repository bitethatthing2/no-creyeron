/**
 * ValuesHighlight - Factual highlights about Side Hustle
 * Only includes verified information about the business
 */

export function ValuesHighlight() {
  const highlights = [
    {
      title: "Sports Entertainment",
      description: "High-energy sports bar atmosphere with multiple screens for UFC, boxing, and live sports",
      icon: "🏈"
    },
    {
      title: "Mexican Cuisine",
      description: "Authentic Mexican food and drinks served in a vibrant social setting",
      icon: "🌮"
    },
    {
      title: "Two Locations",
      description: "Serving Salem and Portland communities with consistent quality and experience",
      icon: "📍"
    },
    {
      title: "Wolf Pack Community",
      description: "Interactive social app connecting local members and enhancing the experience",
      icon: "🐺"
    }
  ];

  return (
    <section className="py-16 bg-black">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl sm:text-4xl font-bold text-center mb-4 text-white">
          What We Offer
        </h2>
        <p className="text-lg text-gray-400 text-center mb-12 max-w-2xl mx-auto">
          Experience the energy, flavor, and community that makes Side Hustle unique.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {highlights.map((highlight, index) => (
            <div 
              key={index}
              className="bg-gray-900 rounded-lg p-6 text-center border border-red-600/20 hover:border-red-600/40 transition-colors"
            >
              <div className="text-4xl mb-4">{highlight.icon}</div>
              <h3 className="text-xl font-semibold text-white mb-3">
                {highlight.title}
              </h3>
              <p className="text-gray-400 leading-relaxed">
                {highlight.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}