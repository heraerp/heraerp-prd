'use client'

import React from 'react'
import { redirect } from 'next/navigation'

export default function CustomersPage() {
  // Redirect to salon customers page
  redirect('/salon-data/customers')
}