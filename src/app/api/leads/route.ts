import { NextRequest, NextResponse } from 'next/server'

// This is a placeholder API endpoint.
// Replace with your actual CRM integration (HubSpot, Mailchimp, etc.)

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()

    const leadData = {
      name: formData.get('name')?.toString() || '',
      email: formData.get('email')?.toString() || '',
      company: formData.get('company')?.toString() || '',
      phone: formData.get('phone')?.toString() || '',
      source: 'blog',
      form_id: formData.get('form_id') || 'unknown',
      timestamp: new Date().toISOString(),

      // UTM parameters
      utm_source: formData.get('utm_source')?.toString() || '',
      utm_medium: formData.get('utm_medium')?.toString() || '',
      utm_campaign: formData.get('utm_campaign')?.toString() || '',
      utm_content: formData.get('utm_content')?.toString() || ''
    }

    // Validate required fields
    if (!leadData.name || !leadData.email) {
      return NextResponse.json({ error: 'Name and email are required' }, { status: 400 })
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(leadData.email)) {
      return NextResponse.json({ error: 'Invalid email address' }, { status: 400 })
    }

    // TODO: Integrate with your CRM/email service
    // Example integrations:

    // HubSpot
    // const hubspotResponse = await fetch("https://api.hubapi.com/contacts/v1/contact", {
    //   method: "POST",
    //   headers: {
    //     "Authorization": `Bearer ${process.env.HUBSPOT_API_KEY}`,
    //     "Content-Type": "application/json"
    //   },
    //   body: JSON.stringify({
    //     properties: [
    //       { property: "email", value: leadData.email },
    //       { property: "firstname", value: leadData.name.split(" ")[0] },
    //       { property: "lastname", value: leadData.name.split(" ").slice(1).join(" ") },
    //       { property: "company", value: leadData.company },
    //       { property: "phone", value: leadData.phone },
    //       { property: "lead_source", value: leadData.source }
    //     ]
    //   })
    // });

    // Mailchimp
    // const mailchimpResponse = await fetch(
    //   `https://us1.api.mailchimp.com/3.0/lists/${process.env.MAILCHIMP_LIST_ID}/members`,
    //   {
    //     method: "POST",
    //     headers: {
    //       "Authorization": `apikey ${process.env.MAILCHIMP_API_KEY}`,
    //       "Content-Type": "application/json"
    //     },
    //     body: JSON.stringify({
    //       email_address: leadData.email,
    //       status: "subscribed",
    //       merge_fields: {
    //         FNAME: leadData.name.split(" ")[0],
    //         LNAME: leadData.name.split(" ").slice(1).join(" "),
    //         COMPANY: leadData.company,
    //         PHONE: leadData.phone
    //       },
    //       tags: ["blog", "free-guide"]
    //     })
    //   }
    // );

    // Supabase (if using HERA's database)
    // import { createClient } from "@supabase/supabase-js";
    // const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!);
    // const { data, error } = await supabase.from("leads").insert([leadData]);

    // Log for development (remove in production)
    console.log('New lead captured:', leadData)

    // Send confirmation email (optional)
    // await sendConfirmationEmail(leadData.email, leadData.name);

    // Redirect to thank you page
    return NextResponse.redirect(new URL('/thank-you', req.url))
  } catch (error) {
    console.error('Lead capture error:', error)

    return NextResponse.json(
      { error: 'Failed to process your request. Please try again.' },
      { status: 500 }
    )
  }
}
