import React from 'react';

function OurMission() {
  return (
    <div className="bg-gray-50 text-gray-800 font-sans">
      {/* Header */}
      <header className="bg-green-700 text-white py-12 text-center">
        <h1 className="text-4xl font-bold mb-2">🌍 Our Mission: A Greener Tomorrow</h1>
        <p className="text-lg max-w-2xl mx-auto">
          Together, we tackle e-waste challenges in India and across the globe by enabling smarter, safer, and sustainable disposal of electronics.
        </p>
      </header>

      {/* What We Do */}
      <section className="py-12 px-6 md:px-20 bg-white">
        <h2 className="text-3xl font-bold mb-6 text-center text-green-700">What Are We Doing?</h2>
        <div className="grid md:grid-cols-2 gap-10 items-center">
          <img src="https://github.com/Ankatkd/EwasteMgt/raw/main/frontend/public/What.jpeg" alt="What we do" className="w-[600px] h-[453px] object-contain rounded-lg shadow-md" />
          <div>
            <p className="text-lg mb-4">
              We’re creating an ecosystem where disposing of e-waste is easy, transparent, and environmentally responsible. From urban tech parks to rural communities, our services are inclusive and accessible.
            </p>
            <p className="text-lg mb-4">
              Our platform allows users to schedule pickups, get eco-rewards, track item lifecycles, and even donate old electronics to charities. We collaborate with certified recyclers to ensure ethical processing.
            </p>
            <p className="text-lg">
              We are also educating the public about the hidden dangers of hoarding or trashing electronics, and encouraging circular economy practices.
            </p>
          </div>
        </div>
      </section>

      {/* Why We Do It */}
      <section className="py-12 px-6 md:px-20 bg-gray-100">
        <h2 className="text-3xl font-bold mb-6 text-center text-green-700">Why Are We Doing This?</h2>
        <div className="grid md:grid-cols-2 gap-10 items-center">
          <div>
            <p className="text-lg mb-4">
              India ranks among the top five e-waste generators globally. Yet over <strong>90%</strong> of our e-waste is handled by the informal sector with no regard for safety, leading to toxic pollution and loss of valuable materials.
            </p>
            <p className="text-lg mb-4">
              E-waste contains more gold per ton than gold ore, yet millions of tons are lost every year to unscientific disposal methods. Children and workers in informal units are exposed to cancerous toxins daily.
            </p>
            <p className="text-lg">
              Our mission is to reverse this — by creating awareness, empowering communities, introducing smart technology, and ensuring that no device harms the planet after its life is over.
            </p>
          </div>
          <img src="https://github.com/Ankatkd/EwasteMgt/raw/main/frontend/public/Why.jpeg" alt="Why we do it" className="rounded-lg shadow-md" />
        </div>
      </section>

      {/* When We Started */}
      <section className="py-12 px-6 md:px-20 bg-white">
        <h2 className="text-3xl font-bold mb-6 text-center text-green-700">When Did We Start?</h2>
        <div className="grid md:grid-cols-2 gap-10 items-center">
          <img src="https://github.com/Ankatkd/EwasteMgt/raw/main/frontend/public/when.jpeg" alt="Our timeline" className="rounded-lg shadow-md" />
          <div>
            <p className="text-lg mb-4">
              Our journey began in <strong>2025</strong> — a year when global e-waste exceeded <strong>60 million metric tons</strong>. We were motivated by the urgent need to innovate solutions that could scale and inspire.
            </p>
            <p className="text-lg mb-4">
              Initially launched in a few Indian cities, our project quickly gained traction thanks to enthusiastic support from local communities, sustainability advocates, and environmental startups.
            </p>
            <p className="text-lg">
              Today, we are scaling across regions with a focus on local engagement, school outreach, and support from green-tech initiatives. Every pickup counts in this mission.
            </p>
          </div>
        </div>
      </section>

      {/* Future of E-Waste */}
      <section className="py-12 px-6 md:px-20 bg-gray-100">
        <h2 className="text-3xl font-bold mb-6 text-center text-green-700">Future of E-Waste Management</h2>
        <div className="grid md:grid-cols-2 gap-10 items-center">
          <div>
            <p className="text-lg mb-4">
              The future of e-waste isn’t bleak — it’s full of opportunity. As AI, IoT, and smart logistics evolve, they’ll reshape how electronics are tracked, repaired, and repurposed.
            </p>
            <p className="text-lg mb-4">
              By 2030, the e-waste recycling industry is expected to become a <strong>$100 billion</strong> market. Countries are moving towards Extended Producer Responsibility (EPR) laws, ensuring brands take accountability for waste.
            </p>
            <p className="text-lg mb-4">
              We’re building toward a decentralized model where individuals can deposit e-waste at smart bins, track the recycling journey via apps, and earn digital green credits.
            </p>
            <p className="text-lg">
              The future is circular, and with the right tools, India can lead the green revolution by turning waste into wealth.
            </p>
          </div>
          <img src="https://github.com/Ankatkd/EwasteMgt/raw/main/frontend/public/future.jpeg" alt="Upcoming stats and impact" className="rounded-lg shadow-md max-w-full h-auto" />
        </div>
      </section>

      {/* Join Us */}
      <section className="bg-green-50 py-12 px-6 md:px-20 text-center">
        <h3 className="text-2xl font-bold text-green-800 mb-4">🌱 Want to Join the Movement?</h3>
        <p className="text-lg mb-4">Whether you're an individual, organization, recycler, or volunteer — your role matters in building a circular future.</p>
        <p className="text-lg mb-4">
          Start today by scheduling your first pickup, spreading the message, or collaborating with us for educational events and community drives.
        </p>
        <a href="/Register" className="inline-block bg-green-700 text-white px-6 py-3 rounded hover:bg-green-800 transition">
          Schedule a Pickup Now
        </a>
      </section>

      {/* Footer */}
      <footer className="bg-green-800 text-white py-6 text-center">
        <p>&copy; 2025 UrbanMine. Building a sustainable future, one device at a time. 🌿</p>
      </footer>
    </div>
  );
}

export default OurMission;
