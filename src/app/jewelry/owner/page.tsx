'use client'

import React from 'react'
import { motion } from 'framer-motion'
import {
  Crown,
  User,
  Shield,
  Settings,
  Building2,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Award,
  Gem,
  Star,
  Sparkles,
  Diamond
} from 'lucide-react'
import '@/styles/jewelry-glassmorphism.css'

export default function JewelryOwnerPage(): JSX.Element {
  // Mock owner data
  const ownerData = {
    name: 'Alexander Sterling',
    title: 'Master Jeweler & CEO',
    email: 'alexander@luxuryjewelry.com',
    phone: '+1 (555) 123-4567',
    location: 'New York, NY',
    joinedDate: 'January 2015',
    experience: '25+ Years',
    specialties: ['Diamond Cutting', 'Custom Design', 'Appraisal'],
    certifications: ['GIA Graduate Gemologist', 'Master Craftsman', 'Certified Appraiser']
  }

  const achievements = [
    { title: 'Master Jeweler Certification', year: '2010', icon: Crown },
    { title: 'GIA Graduate Gemologist', year: '2008', icon: Diamond },
    { title: 'International Design Award', year: '2019', icon: Award },
    { title: 'Customer Excellence Award', year: '2023', icon: Star }
  ]

  const businessMetrics = [
    { label: 'Years in Business', value: '9', icon: Calendar },
    { label: 'Total Revenue', value: '$2.4M', icon: Crown },
    { label: 'Customer Rating', value: '4.9/5', icon: Star },
    { label: 'Items Sold', value: '5,247', icon: Gem }
  ]

  return (
    <div className="min-h-screen jewelry-gradient-premium">
      <div className="jewelry-glass-backdrop min-h-screen">
        <div className="w-full max-w-7xl mx-auto p-6 space-y-6">
          {/* Page Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-8"
          >
            <h1 className="jewelry-heading text-4xl md:text-5xl mb-4">
              <Crown className="inline-block mr-3 mb-2 jewelry-icon-gold" size={48} />
              Owner Profile
            </h1>
            <p className="jewelry-text-luxury text-lg md:text-xl">
              Master craftsman and business leader
            </p>
          </motion.div>

          {/* Owner Profile Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="jewelry-glass-panel p-8 mb-8"
          >
            <div className="flex flex-col lg:flex-row items-center lg:items-start space-y-6 lg:space-y-0 lg:space-x-8">
              {/* Profile Picture */}
              <div className="relative">
                <div
                  className="w-32 h-32 rounded-full flex items-center justify-center jewelry-crown-glow"
                  style={{
                    background: 'linear-gradient(135deg, #D4AF00 0%, #B8960B 100%)',
                    boxShadow: '0 8px 32px rgba(212, 175, 0, 0.3)'
                  }}
                >
                  <Crown className="h-16 w-16" style={{ color: '#1A1F3D' }} />
                </div>
                <div className="absolute -bottom-2 -right-2 w-10 h-10 rounded-full jewelry-glass-card flex items-center justify-center">
                  <Shield className="h-5 w-5 jewelry-icon-gold" />
                </div>
              </div>

              {/* Profile Information */}
              <div className="flex-1 text-center lg:text-left">
                <h2 className="jewelry-heading text-3xl mb-2">{ownerData.name}</h2>
                <p className="jewelry-text-luxury text-xl mb-4">{ownerData.title}</p>
                <p className="jewelry-text-muted mb-6">
                  {ownerData.experience} of exceptional craftsmanship and business excellence
                </p>

                {/* Contact Information */}
                <div className="space-y-3">
                  <div className="flex items-center justify-center lg:justify-start space-x-3">
                    <Mail className="jewelry-icon-gold" size={18} />
                    <span className="jewelry-text-high-contrast">{ownerData.email}</span>
                  </div>
                  <div className="flex items-center justify-center lg:justify-start space-x-3">
                    <Phone className="jewelry-icon-gold" size={18} />
                    <span className="jewelry-text-high-contrast">{ownerData.phone}</span>
                  </div>
                  <div className="flex items-center justify-center lg:justify-start space-x-3">
                    <MapPin className="jewelry-icon-gold" size={18} />
                    <span className="jewelry-text-high-contrast">{ownerData.location}</span>
                  </div>
                  <div className="flex items-center justify-center lg:justify-start space-x-3">
                    <Calendar className="jewelry-icon-gold" size={18} />
                    <span className="jewelry-text-high-contrast">Since {ownerData.joinedDate}</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Business Metrics */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
          >
            {businessMetrics.map((metric, index) => {
              const Icon = metric.icon
              return (
                <div
                  key={index}
                  className="jewelry-glass-card jewelry-float p-6 text-center"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <Icon className="mx-auto mb-3 jewelry-icon-gold" size={32} />
                  <h3 className="jewelry-text-high-contrast text-2xl font-bold">{metric.value}</h3>
                  <p className="jewelry-text-muted text-sm font-medium">{metric.label}</p>
                </div>
              )
            })}
          </motion.div>

          {/* Achievements & Certifications */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8"
          >
            {/* Achievements */}
            <div className="jewelry-glass-panel p-6">
              <div className="flex items-center mb-6">
                <Award className="jewelry-icon-gold mr-3" size={24} />
                <h3 className="jewelry-heading text-xl">Professional Achievements</h3>
              </div>

              <div className="space-y-4">
                {achievements.map((achievement, index) => {
                  const Icon = achievement.icon
                  return (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.4, delay: 0.8 + index * 0.1 }}
                      className="flex items-center space-x-4 p-3 jewelry-glass-card-subtle hover:scale-[1.02] transition-transform"
                    >
                      <div className="w-10 h-10 rounded-full jewelry-glass-card flex items-center justify-center">
                        <Icon className="jewelry-icon-gold" size={18} />
                      </div>
                      <div className="flex-1">
                        <h4 className="jewelry-text-high-contrast font-semibold">
                          {achievement.title}
                        </h4>
                        <p className="jewelry-text-muted text-sm">{achievement.year}</p>
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            </div>

            {/* Specialties & Certifications */}
            <div className="jewelry-glass-panel p-6">
              <div className="flex items-center mb-6">
                <Sparkles className="jewelry-icon-gold mr-3" size={24} />
                <h3 className="jewelry-heading text-xl">Expertise & Certifications</h3>
              </div>

              <div className="space-y-6">
                {/* Specialties */}
                <div>
                  <h4 className="jewelry-text-high-contrast font-semibold mb-3">Specialties</h4>
                  <div className="flex flex-wrap gap-2">
                    {ownerData.specialties.map((specialty, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 rounded-full text-sm jewelry-glass-card-subtle jewelry-text-high-contrast"
                      >
                        {specialty}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Certifications */}
                <div>
                  <h4 className="jewelry-text-high-contrast font-semibold mb-3">Certifications</h4>
                  <div className="space-y-2">
                    {ownerData.certifications.map((cert, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <Shield className="jewelry-icon-gold" size={16} />
                        <span className="jewelry-text-high-contrast text-sm">{cert}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.8 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <button className="jewelry-glass-card hover:scale-105 transition-transform px-6 py-3 rounded-xl flex items-center space-x-2">
              <Settings className="jewelry-icon-gold" size={20} />
              <span className="jewelry-text-high-contrast font-semibold">Edit Profile</span>
            </button>

            <button className="jewelry-glass-card hover:scale-105 transition-transform px-6 py-3 rounded-xl flex items-center space-x-2">
              <Building2 className="jewelry-icon-gold" size={20} />
              <span className="jewelry-text-high-contrast font-semibold">Business Settings</span>
            </button>
          </motion.div>

          {/* Footer */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 1.0 }}
            className="text-center mt-12 mb-6"
          >
            <p className="text-jewelry-platinum-500 text-sm">
              Excellence in craftsmanship since 2015 •{' '}
              <span className="jewelry-text-luxury font-semibold">Sterling Luxury Jewelers</span>
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
