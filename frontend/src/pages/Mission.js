import React from 'react';
import { Link } from 'react-router-dom';

function Mission() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-100">
      {/* Hero Section */}
      <section className="relative py-20 px-4 text-center">
        <div className="absolute inset-0 bg-gradient-to-r from-green-600/10 to-blue-600/10"></div>
        <div className="relative max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            Our <span className="text-green-600">Mission</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 leading-relaxed">
            Transforming e-waste into opportunities for a sustainable future
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              to="/our-mission" 
              className="bg-green-600 text-white px-8 py-3 rounded-full font-semibold hover:bg-green-700 transition-all duration-300 transform hover:scale-105"
            >
              Learn More
            </Link>
            <Link 
              to="/register" 
              className="border-2 border-green-600 text-green-600 px-8 py-3 rounded-full font-semibold hover:bg-green-600 hover:text-white transition-all duration-300"
            >
              Join Us
            </Link>
          </div>
        </div>
      </section>

      {/* Mission Cards */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">Our Core Values</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2">
              <div className="text-4xl mb-4">🌱</div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Environmental Impact</h3>
              <p className="text-gray-600">
                Reducing e-waste pollution and promoting sustainable practices for a cleaner planet.
              </p>
            </div>
            <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2">
              <div className="text-4xl mb-4">♻️</div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Circular Economy</h3>
              <p className="text-gray-600">
                Creating a closed-loop system where electronic waste becomes valuable resources.
              </p>
            </div>
            <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2">
              <div className="text-4xl mb-4">🤝</div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Community Engagement</h3>
              <p className="text-gray-600">
                Empowering communities through education and accessible e-waste management solutions.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-green-600 py-16 px-4">
        <div className="max-w-4xl mx-auto text-center text-white">
          <h2 className="text-3xl font-bold mb-12">Making a Difference</h2>
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="text-4xl font-bold mb-2">50K+</div>
              <div className="text-green-100">Devices Recycled</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">25K+</div>
              <div className="text-green-100">Happy Users</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">100+</div>
              <div className="text-green-100">Cities Covered</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">95%</div>
              <div className="text-green-100">Satisfaction Rate</div>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">Ready to Make a Change?</h2>
          <p className="text-xl text-gray-600 mb-8">
            Join thousands of people who are already making a positive impact on the environment.
          </p>
          <Link 
            to="/pickup" 
            className="inline-block bg-green-600 text-white px-8 py-4 rounded-full font-semibold text-lg hover:bg-green-700 transition-all duration-300 transform hover:scale-105 shadow-lg"
          >
            Schedule Your Pickup
          </Link>
        </div>
      </section>
    </div>
  );
}

export default Mission;
