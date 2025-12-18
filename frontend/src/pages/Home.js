import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

function Home() {
  const activities = [
    {
      image: 'https://www.teriin.org/sites/default/files/2019-11/tg-nov19-og.jpg',
      description: 'E-waste drive in Delhi – 500kg collected!',
      title: 'Delhi E-Waste Drive',
      impact: '500kg Recycled'
    },
    {
      image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSZPkhMe2H5V9mKa0gW8wNCA57g1Z1wtby2DA&s',
      description: 'Awareness camp held at XYZ School.',
      title: 'School Awareness Program',
      impact: '200+ Students Educated'
    },
    {
      image: 'https://salwanpublicschool.com/wp-content/uploads/2022/08/E-Waste-Collection-drive1.jpeg',
      description: 'Partnered with Recycle India Foundation to expand collection centers.',
      title: 'Partnership Expansion',
      impact: '50+ New Centers'
    },
  ];

  const [currentImage, setCurrentImage] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImage((prev) => (prev + 1) % activities.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [activities.length]);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const prevImage = () => {
    setCurrentImage((prev) => (prev - 1 + activities.length) % activities.length);
  };

  const nextImage = () => {
    setCurrentImage((prev) => (prev + 1) % activities.length);
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-green-50 via-white to-blue-50 py-20 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-green-600/5 to-blue-600/5"></div>
        <div className="relative max-w-6xl mx-auto text-center">
          <div className={`transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <h1 className="text-5xl md:text-7xl font-bold text-gray-900 mb-6">
              <span className="text-green-600">Reduce.</span>{' '}
              <span className="text-blue-600">Reuse.</span>{' '}
              <span className="text-purple-600">Recycle.</span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-4xl mx-auto leading-relaxed">
              We are committed to responsible e-waste management and making our planet cleaner. 
              Join us in our mission to give electronic waste a second life.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                to="/pickup" 
                className="bg-green-600 text-white px-8 py-4 rounded-full font-semibold text-lg hover:bg-green-700 transition-all duration-300 transform hover:scale-105 shadow-lg"
              >
                Schedule Pickup
              </Link>
              <Link 
                to="/mission" 
                className="border-2 border-green-600 text-green-600 px-8 py-4 rounded-full font-semibold text-lg hover:bg-green-600 hover:text-white transition-all duration-300"
              >
                Our Mission
              </Link>
              <Link 
                to="/admin/login" 
                className="border-2 border-blue-600 text-blue-600 px-8 py-4 rounded-full font-semibold text-lg hover:bg-blue-600 hover:text-white transition-all duration-300"
              >
                Admin Login
              </Link>
            </div>
          </div>
        </div>
        
        {/* Floating Elements */}
        <div className="absolute top-20 left-10 text-6xl opacity-20 animate-bounce">♻️</div>
        <div className="absolute top-40 right-20 text-4xl opacity-20 animate-pulse">🌱</div>
        <div className="absolute bottom-20 left-20 text-5xl opacity-20 animate-bounce delay-1000">🔋</div>
        <div className="absolute bottom-40 right-10 text-3xl opacity-20 animate-pulse delay-500">💻</div>
      </section>

      {/* Recent Activities Carousel */}
      <section className="py-16 px-4 bg-gradient-to-r from-gray-50 to-gray-100">
        <div className="max-w-7xl mx-auto">
          <h3 className="text-3xl font-bold text-center text-gray-900 mb-12">Recent Activities</h3>
          <div className="relative bg-white rounded-2xl shadow-xl overflow-hidden group">
            <div className="flex flex-col lg:flex-row">
              {/* Image Container */}
              <div className="w-full lg:w-2/3 h-[400px] lg:h-[500px] relative overflow-hidden">
                <img
                  src={activities[currentImage].image}
                  alt="Recent Activity"
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                
                {/* Navigation Buttons */}
                <button
                  onClick={prevImage}
                  className="absolute top-1/2 left-4 transform -translate-y-1/2 bg-white/90 text-green-600 px-4 py-2 rounded-full hover:bg-white transition-all duration-300 shadow-lg hover:scale-110"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button
                  onClick={nextImage}
                  className="absolute top-1/2 right-4 transform -translate-y-1/2 bg-white/90 text-green-600 px-4 py-2 rounded-full hover:bg-white transition-all duration-300 shadow-lg hover:scale-110"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>

                {/* Dots Indicator */}
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
                  {activities.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentImage(index)}
                      className={`w-3 h-3 rounded-full transition-all duration-300 ${
                        index === currentImage ? 'bg-white' : 'bg-white/50'
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* Info Panel */}
              <div className="w-full lg:w-1/3 p-8 flex flex-col justify-center bg-gradient-to-br from-green-50 to-blue-50">
                <div className="space-y-4">
                  <h4 className="text-2xl font-bold text-gray-900">{activities[currentImage].title}</h4>
                  <p className="text-lg text-gray-700 leading-relaxed">{activities[currentImage].description}</p>
                  <div className="inline-block bg-green-600 text-white px-4 py-2 rounded-full text-sm font-semibold">
                    {activities[currentImage].impact}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>


      {/* Why E-Waste Management Matters */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <h3 className="text-3xl font-bold text-center text-gray-900 mb-12">Why E-Waste Management Matters</h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center p-6 rounded-2xl bg-gradient-to-br from-red-50 to-orange-50 hover:shadow-lg transition-all duration-300">
              <div className="text-4xl mb-4">⚠️</div>
              <h4 className="text-lg font-bold text-gray-900 mb-3">Toxic Materials</h4>
              <p className="text-gray-600 text-sm">
                E-waste contains harmful chemicals like lead, cadmium, and mercury that can seep into the environment.
              </p>
            </div>
            <div className="text-center p-6 rounded-2xl bg-gradient-to-br from-yellow-50 to-amber-50 hover:shadow-lg transition-all duration-300">
              <div className="text-4xl mb-4">💎</div>
              <h4 className="text-lg font-bold text-gray-900 mb-3">Valuable Resources</h4>
              <p className="text-gray-600 text-sm">
                Recover precious materials like gold, silver, and copper, reducing the need for mining.
              </p>
            </div>
            <div className="text-center p-6 rounded-2xl bg-gradient-to-br from-green-50 to-emerald-50 hover:shadow-lg transition-all duration-300">
              <div className="text-4xl mb-4">💼</div>
              <h4 className="text-lg font-bold text-gray-900 mb-3">Job Creation</h4>
              <p className="text-gray-600 text-sm">
                Proper disposal creates job opportunities and promotes sustainable economic growth.
              </p>
            </div>
            <div className="text-center p-6 rounded-2xl bg-gradient-to-br from-blue-50 to-cyan-50 hover:shadow-lg transition-all duration-300">
              <div className="text-4xl mb-4">📈</div>
              <h4 className="text-lg font-bold text-gray-900 mb-3">Growing Need</h4>
              <p className="text-gray-600 text-sm">
                Over 50 million metric tons generated globally every year - the need is urgent.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Sections */}
      <section className="py-16 px-4 bg-gradient-to-br from-green-600 to-blue-600">
        <div className="max-w-6xl mx-auto">
          <h3 className="text-3xl font-bold text-center text-white mb-12">📍 E-Waste in India</h3>
          <div className="grid md:grid-cols-3 gap-8 mb-16">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 text-center text-white hover:bg-white/20 transition-all duration-300 transform hover:scale-105">
              <div className="text-5xl font-bold mb-2">3.2M</div>
              <div className="text-green-100 text-lg">Tons generated in 2023</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 text-center text-white hover:bg-white/20 transition-all duration-300 transform hover:scale-105">
              <div className="text-5xl font-bold mb-2">Only 10%</div>
              <div className="text-green-100 text-lg">Properly collected & processed</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 text-center text-white hover:bg-white/20 transition-all duration-300 transform hover:scale-105">
              <div className="text-5xl font-bold mb-2">Top 5</div>
              <div className="text-green-100 text-lg">India ranks among top e-waste producers</div>
            </div>
          </div>

          <h3 className="text-3xl font-bold text-center text-white mb-12">🌍 Global E-Waste Trends</h3>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 text-center text-white hover:bg-white/20 transition-all duration-300 transform hover:scale-105">
              <div className="text-5xl font-bold mb-2">50M+</div>
              <div className="text-green-100 text-lg">Tons generated worldwide (2022)</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 text-center text-white hover:bg-white/20 transition-all duration-300 transform hover:scale-105">
              <div className="text-5xl font-bold mb-2">20%</div>
              <div className="text-green-100 text-lg">Recycled properly worldwide</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 text-center text-white hover:bg-white/20 transition-all duration-300 transform hover:scale-105">
              <div className="text-5xl font-bold mb-2">74M</div>
              <div className="text-green-100 text-lg">Tons expected by 2030</div>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-16 px-4 bg-gradient-to-r from-gray-50 to-gray-100">
        <div className="max-w-4xl mx-auto text-center">
          <h3 className="text-3xl font-bold text-gray-900 mb-6">Ready to Make a Difference?</h3>
          <p className="text-xl text-gray-600 mb-8">
            Join our mission to create a sustainable future through responsible e-waste management.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              to="/pickup" 
              className="bg-green-600 text-white px-8 py-4 rounded-full font-semibold text-lg hover:bg-green-700 transition-all duration-300 transform hover:scale-105 shadow-lg"
            >
              Schedule Pickup Now
            </Link>
            <Link 
              to="/register" 
              className="border-2 border-green-600 text-green-600 px-8 py-4 rounded-full font-semibold text-lg hover:bg-green-600 hover:text-white transition-all duration-300"
            >
              Join Our Community
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Home;
