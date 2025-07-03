import React from 'react';

function Contact() {
  return (
    <div className="bg-gray-50 text-gray-800 font-sans min-h-screen">
      {/* Header */}
      <header className="bg-green-700 text-white py-12 text-center">
        <h1 className="text-4xl font-bold mb-2">📞 Contact Us</h1>
        <p className="text-lg max-w-xl mx-auto">We’re here to help you with your e-waste disposal needs. Reach out to us anytime.</p>
      </header>

      {/* Contact Form and Info */}
      <section className="py-12 px-6 md:px-20 grid md:grid-cols-2 gap-12 bg-white">
        {/* Contact Form */}
        <div className="bg-gray-100 p-8 rounded-lg shadow-md">
          <h2 className="text-2xl font-semibold text-green-700 mb-6">Send us a message</h2>
          <form className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Your Name</label>
              <input type="text" placeholder="John Doe" className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-green-500" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Email Address</label>
              <input type="email" placeholder="you@example.com" className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-green-500" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Subject</label>
              <input type="text" placeholder="Pickup inquiry, support..." className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-green-500" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Message</label>
              <textarea rows="4" placeholder="Type your message here..." className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-green-500"></textarea>
            </div>
            <button type="submit" className="bg-green-700 text-white px-6 py-2 rounded hover:bg-green-800 transition">
              Send Message
            </button>
          </form>
        </div>

        {/* Contact Info */}
        <div className="flex flex-col justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-green-700 mb-4">Our Office</h2>
            <p className="text-lg mb-4">E-Waste Manager HQ</p>
            <p className="mb-2">123 Green Street, Eco City, Maharashtra, India</p>
            <p className="mb-2">Phone: <a href="tel:+911234567890" className="text-green-700 font-medium">+91 12345 67890</a></p>
            <p className="mb-2">Email: <a href="mailto:support@ewastemanager.in" className="text-green-700 font-medium">support@ewastemanager.in</a></p>
            <p className="mb-2">Working Hours: Mon–Sat, 9:00 AM – 6:00 PM</p>
          </div>

          {/* Google Maps Embed (or placeholder) */}
          <div className="mt-10">
            <h2 className="text-2xl font-semibold text-green-700 mb-2">📍 Find Us</h2>
            <div className="w-full h-64">
              {/* Replace src with your actual Google Maps embed link */}
              <iframe
                title="Google Map"
                className="w-full h-full rounded-md shadow-md"
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d12000.123456!2d72.8567!3d19.0760!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3be7b63b7459f3ed%3A0x7df0ea6ebc0b2b1c!2sMumbai!5e0!3m2!1sen!2sin!4v1615965158043!5m2!1sen!2sin"
                allowFullScreen=""
                loading="lazy"
              ></iframe>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-green-800 text-white py-6 text-center">
        <p>&copy; 2025 E-Waste Manager. Every question matters — we’re here for you.</p>
      </footer>
    </div>
  );
}

export default Contact;
