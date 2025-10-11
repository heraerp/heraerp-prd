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
  Sparkles,
  Crown,
  Gem,
  Heart,
  Shield
} from 'lucide-react'

// Luxe color palette
const COLORS = {
  black: '#0B0B0B',
  charcoal: '#1A1A1A',
  gold: '#D4AF37',
  goldDark: '#B8860B',
  champagne: '#F5E6C8',
  bronze: '#8C7853',
  lightText: '#E0E0E0',
  charcoalDark: '#0F0F0F',
  charcoalLight: '#232323',
  plum: '#B794F4',
  emerald: '#0F6F5C'
}

export default function HairTalkzLanding() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: COLORS.black }}>
      {/* Hero Section with Luxe Theme */}
      <section className="relative h-screen">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1560066984-138dadb4c035?q=80&w=2940')`,
            filter: 'brightness(0.3) sepia(0.2)'
          }}
        >
          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(to bottom, ${COLORS.black}80 0%, ${COLORS.charcoal}90 100%)`
            }}
          />
        </div>

        <div className="relative z-10 h-full flex items-center justify-center">
          <div className="text-center px-4 max-w-5xl mx-auto">
            <div className="mb-8 flex justify-center">
              <Crown
                className="h-16 w-16 mb-4"
                style={{
                  color: COLORS.gold,
                  filter: 'drop-shadow(0 0 20px rgba(212, 175, 55, 0.5))'
                }}
              />
            </div>

            <h1
              className="text-6xl md:text-8xl font-light mb-6 tracking-wider"
              style={{
                background: `linear-gradient(135deg, ${COLORS.champagne} 0%, ${COLORS.gold} 50%, ${COLORS.champagne} 100%)`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                textShadow: '0 0 40px rgba(212, 175, 55, 0.3)'
              }}
            >
              HAIRTALKZ
            </h1>

            <p
              className="text-2xl md:text-3xl font-light mb-12 tracking-widest uppercase"
              style={{ color: COLORS.bronze }}
            >
              Where Luxury Meets Excellence
            </p>

            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <Button
                size="lg"
                className="px-12 py-6 text-lg font-light tracking-wider uppercase transition-all duration-300"
                style={{
                  backgroundColor: COLORS.gold,
                  color: COLORS.black,
                  border: `1px solid ${COLORS.gold}`,
                  boxShadow: '0 0 30px rgba(212, 175, 55, 0.3)'
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.backgroundColor = COLORS.goldDark
                  e.currentTarget.style.boxShadow = '0 0 40px rgba(212, 175, 55, 0.5)'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.backgroundColor = COLORS.gold
                  e.currentTarget.style.boxShadow = '0 0 30px rgba(212, 175, 55, 0.3)'
                }}
                asChild
              >
                <Link href="/salon/auth">
                  <Gem className="w-5 h-5 mr-3" />
                  Book Appointment
                </Link>
              </Button>

              <Button
                size="lg"
                variant="outline"
                className="px-12 py-6 text-lg font-light tracking-wider uppercase transition-all duration-300"
                style={{
                  backgroundColor: 'transparent',
                  color: COLORS.champagne,
                  border: `1px solid ${COLORS.bronze}`
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.backgroundColor = `${COLORS.bronze}20`
                  e.currentTarget.style.borderColor = COLORS.gold
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.backgroundColor = 'transparent'
                  e.currentTarget.style.borderColor = COLORS.bronze
                }}
                asChild
              >
                <Link href="/salon/auth">
                  <Shield className="w-5 h-5 mr-3" />
                  Staff Portal
                </Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 animate-bounce">
          <ChevronRight className="h-8 w-8 rotate-90" style={{ color: COLORS.bronze }} />
        </div>
      </section>

      {/* Luxe Services Section */}
      <section className="py-24 px-4" style={{ backgroundColor: COLORS.charcoal }}>
        <div className="max-w-7xl mx-auto">
          <h2
            className="text-5xl font-light text-center mb-20 tracking-wider uppercase"
            style={{ color: COLORS.champagne }}
          >
            Signature Services
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {[
              {
                icon: Scissors,
                title: 'Precision Styling',
                description: 'Master stylists creating bespoke looks tailored to your lifestyle',
                price: 'From AED 350'
              },
              {
                icon: Sparkles,
                title: 'Color Excellence',
                description: 'Revolutionary color techniques with premium European products',
                price: 'From AED 450'
              },
              {
                icon: Heart,
                title: 'Luxury Treatments',
                description: 'Rejuvenating hair therapies with exclusive organic ingredients',
                price: 'From AED 600'
              }
            ].map((service, index) => (
              <div
                key={index}
                className="group relative overflow-hidden transition-all duration-500 hover:transform hover:scale-105"
                style={{
                  backgroundColor: COLORS.charcoalLight,
                  border: `1px solid ${COLORS.bronze}30`,
                  borderRadius: '8px'
                }}
              >
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  style={{
                    background: `radial-gradient(circle at center, ${COLORS.gold}10 0%, transparent 70%)`
                  }}
                />

                <div className="relative p-10">
                  <service.icon
                    className="w-14 h-14 mb-6 transition-all duration-300 group-hover:scale-110"
                    style={{
                      color: COLORS.gold,
                      filter: 'drop-shadow(0 0 10px rgba(212, 175, 55, 0.3))'
                    }}
                  />
                  <h3
                    className="text-2xl font-light mb-4 tracking-wide"
                    style={{ color: COLORS.champagne }}
                  >
                    {service.title}
                  </h3>
                  <p className="mb-6 font-light leading-relaxed" style={{ color: COLORS.bronze }}>
                    {service.description}
                  </p>
                  <p className="text-xl font-light tracking-wider" style={{ color: COLORS.gold }}>
                    {service.price}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Excellence Stats */}
      <section
        className="py-20 px-4"
        style={{
          backgroundColor: COLORS.black,
          backgroundImage: `linear-gradient(90deg, ${COLORS.bronze}10 1px, transparent 1px)`,
          backgroundSize: '100px 100%'
        }}
      >
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          <div className="group cursor-pointer">
            <div
              className="text-5xl font-light mb-4 transition-all duration-300 group-hover:scale-110"
              style={{ color: COLORS.gold }}
            >
              15+
            </div>
            <div
              className="text-sm uppercase tracking-widest font-light"
              style={{ color: COLORS.bronze }}
            >
              Years of Excellence
            </div>
          </div>
          <div className="group cursor-pointer">
            <div
              className="text-5xl font-light mb-4 transition-all duration-300 group-hover:scale-110"
              style={{ color: COLORS.gold }}
            >
              50K+
            </div>
            <div
              className="text-sm uppercase tracking-widest font-light"
              style={{ color: COLORS.bronze }}
            >
              Satisfied Clients
            </div>
          </div>
          <div className="group cursor-pointer">
            <div
              className="text-5xl font-light mb-4 transition-all duration-300 group-hover:scale-110"
              style={{ color: COLORS.gold }}
            >
              4.9
            </div>
            <div
              className="text-sm uppercase tracking-widest font-light"
              style={{ color: COLORS.bronze }}
            >
              Premium Rating
            </div>
          </div>
          <div className="group cursor-pointer">
            <div
              className="text-5xl font-light mb-4 transition-all duration-300 group-hover:scale-110"
              style={{ color: COLORS.gold }}
            >
              40+
            </div>
            <div
              className="text-sm uppercase tracking-widest font-light"
              style={{ color: COLORS.bronze }}
            >
              Award-Winning Stylists
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-24 px-4" style={{ backgroundColor: COLORS.charcoal }}>
        <div className="max-w-6xl mx-auto text-center">
          <h2
            className="text-5xl font-light mb-16 tracking-wider uppercase"
            style={{ color: COLORS.champagne }}
          >
            Visit Our Sanctuary
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-16">
            <div className="group">
              <MapPin
                className="w-10 h-10 mx-auto mb-6 transition-transform duration-300 group-hover:scale-110"
                style={{ color: COLORS.gold }}
              />
              <h3
                className="text-xl font-light mb-4 tracking-wide"
                style={{ color: COLORS.champagne }}
              >
                Location
              </h3>
              <p style={{ color: COLORS.bronze }} className="font-light">
                The Palm Tower, Level 42
                <br />
                Palm Jumeirah
                <br />
                Dubai, UAE
              </p>
            </div>

            <div className="group">
              <Clock
                className="w-10 h-10 mx-auto mb-6 transition-transform duration-300 group-hover:scale-110"
                style={{ color: COLORS.gold }}
              />
              <h3
                className="text-xl font-light mb-4 tracking-wide"
                style={{ color: COLORS.champagne }}
              >
                Hours
              </h3>
              <p style={{ color: COLORS.bronze }} className="font-light">
                Monday - Saturday: 10AM - 10PM
                <br />
                Sunday: 12PM - 8PM
                <br />
                By Appointment Only
              </p>
            </div>

            <div className="group">
              <Phone
                className="w-10 h-10 mx-auto mb-6 transition-transform duration-300 group-hover:scale-110"
                style={{ color: COLORS.gold }}
              />
              <h3
                className="text-xl font-light mb-4 tracking-wide"
                style={{ color: COLORS.champagne }}
              >
                Contact
              </h3>
              <p style={{ color: COLORS.bronze }} className="font-light">
                +971 4 888 LUXE
                <br />
                concierge@hairtalkz.ae
                <br />
                WhatsApp Available
              </p>
            </div>
          </div>

          <Button
            size="lg"
            className="px-16 py-7 text-lg font-light tracking-wider uppercase"
            style={{
              backgroundColor: COLORS.gold,
              color: COLORS.black,
              boxShadow: '0 0 30px rgba(212, 175, 55, 0.3)'
            }}
            asChild
          >
            <Link href="/salon/auth">
              Reserve Your Experience
              <ChevronRight className="w-5 h-5 ml-3" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer
        className="py-10 px-4"
        style={{
          backgroundColor: COLORS.black,
          borderTop: `1px solid ${COLORS.bronze}30`
        }}
      >
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-sm font-light tracking-wider" style={{ color: COLORS.bronze }}>
            © 2025 HAIRTALKZ. A Luxury Experience by HERA ERP.
          </p>
        </div>
      </footer>
    </div>
  )
}
