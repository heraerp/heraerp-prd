'use client'

import React from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { 
  Scissors, 
  Clock, 
  Star, 
  Phone, 
  MapPin, 
  ChevronRight,
  Calendar,
  Users,
  Award,
  Sparkles
} from 'lucide-react'

export default function SalonPublicLanding() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section with Black & White Image */}
      <section className="relative h-screen">
        <div 
          className="absolute inset-0 bg-cover bg-center grayscale"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1560066984-138dadb4c035?q=80&w=2940')`,
          }}
        >
          <div className="absolute inset-0 bg-black/50"></div>
        </div>
        
        <div className="relative z-10 h-full flex items-center justify-center text-white">
          <div className="text-center px-4 max-w-4xl mx-auto">
            <h1 className="text-5xl md:text-7xl font-light mb-4">
              Bella Beauty Salon
            </h1>
            <p className="text-xl md:text-2xl font-light mb-8 opacity-90">
              Where Beauty Meets Excellence
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg"
                className="bg-white text-black hover:bg-gray-100 px-8"
                asChild
              >
                <Link href="/appointments">
                  <Calendar className="w-5 h-5 mr-2" />
                  Book Appointment
                </Link>
              </Button>
              <Button 
                size="lg"
                variant="outline"
                className="border-white text-white hover:bg-white hover:text-black px-8"
                asChild
              >
                <Link href="/dashboard">
                  <Users className="w-5 h-5 mr-2" />
                  Staff Login
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-20 px-4 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-light text-center mb-12">Our Services</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: Scissors,
                title: 'Hair Services',
                description: 'Cutting-edge styles, coloring, treatments, and more',
                price: 'From AED 150'
              },
              {
                icon: Sparkles,
                title: 'Beauty Treatments',
                description: 'Facials, makeup, threading, and skincare',
                price: 'From AED 100'
              },
              {
                icon: Award,
                title: 'Bridal Packages',
                description: 'Complete bridal beauty solutions for your special day',
                price: 'From AED 2,500'
              }
            ].map((service, index) => (
              <div key={index} className="bg-white p-8 shadow-lg">
                <service.icon className="w-12 h-12 mb-4 text-gray-700" />
                <h3 className="text-xl font-semibold mb-2">{service.title}</h3>
                <p className="text-gray-600 mb-4">{service.description}</p>
                <p className="text-lg font-light">{service.price}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 px-4 bg-black text-white">
        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          <div>
            <div className="text-4xl font-light mb-2">5+</div>
            <div className="text-sm uppercase tracking-wider opacity-70">Years Experience</div>
          </div>
          <div>
            <div className="text-4xl font-light mb-2">15K+</div>
            <div className="text-sm uppercase tracking-wider opacity-70">Happy Clients</div>
          </div>
          <div>
            <div className="text-4xl font-light mb-2">4.9</div>
            <div className="text-sm uppercase tracking-wider opacity-70">Rating</div>
          </div>
          <div>
            <div className="text-4xl font-light mb-2">25+</div>
            <div className="text-sm uppercase tracking-wider opacity-70">Expert Stylists</div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-6xl mx-auto text-center">
          <h2 className="text-4xl font-light mb-12">Visit Us</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            <div>
              <MapPin className="w-8 h-8 mx-auto mb-4 text-gray-700" />
              <h3 className="text-xl font-semibold mb-2">Location</h3>
              <p className="text-gray-600">
                123 Beauty Street<br />
                Dubai Marina<br />
                Dubai, UAE
              </p>
            </div>
            <div>
              <Clock className="w-8 h-8 mx-auto mb-4 text-gray-700" />
              <h3 className="text-xl font-semibold mb-2">Hours</h3>
              <p className="text-gray-600">
                Monday - Saturday: 9AM - 9PM<br />
                Sunday: 10AM - 7PM
              </p>
            </div>
            <div>
              <Phone className="w-8 h-8 mx-auto mb-4 text-gray-700" />
              <h3 className="text-xl font-semibold mb-2">Contact</h3>
              <p className="text-gray-600">
                +971 4 123 4567<br />
                hello@bellabeauty.ae
              </p>
            </div>
          </div>
          
          <Button 
            size="lg"
            className="bg-black text-white hover:bg-gray-800"
            asChild
          >
            <Link href="/appointments">
              Book Your Appointment
              <ChevronRight className="w-5 h-5 ml-2" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <p className="text-sm opacity-70">
            © 2025 Bella Beauty Salon. All rights reserved. Powered by HERA ERP.
          </p>
        </div>
      </footer>
    </div>
  )
}
