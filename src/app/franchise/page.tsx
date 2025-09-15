// Force dynamic rendering
export const dynamic = 'force-dynamic'

import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'How to Own a Software Company Without Writing Code | HERA',
  description:
    'Own a software company without writing code, spending a fortune, or waiting years to profit. We handle 70% of the work.'
}

export default function FranchisePage() {
  return (
    <html lang="en">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>How to Own a Software Company Without Writing Code</title>
        <style
          dangerouslySetInnerHTML={{
            __html: `
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
            
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }
            
            body {
                font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
                line-height: 1.6;
                color: #0f172a;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
                background-attachment: fixed;
                font-size: 16px;
                font-weight: 400;
                min-height: 100vh;
            }
            
            .glass-container {
                backdrop-filter: blur(20px);
                -webkit-backdrop-filter: blur(20px);
                background: rgba(255, 255, 255, 0.1);
                border: 1px solid rgba(255, 255, 255, 0.2);
                box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
            }
            
            .container {
                max-width: 1200px;
                margin: 0 auto;
                padding: 2rem 1.5rem;
            }
            
            .hero {
                text-align: center;
                padding: 5rem 3rem 4rem;
                background: rgba(255, 255, 255, 0.15);
                backdrop-filter: blur(25px);
                -webkit-backdrop-filter: blur(25px);
                border-radius: 24px;
                margin-bottom: 3rem;
                border: 1px solid rgba(255, 255, 255, 0.25);
                box-shadow: 
                    0 25px 50px rgba(0, 0, 0, 0.1),
                    0 0 0 1px rgba(255, 255, 255, 0.05),
                    inset 0 1px 0 rgba(255, 255, 255, 0.2);
                position: relative;
                overflow: hidden;
            }
            
            .hero::before {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                height: 1px;
                background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent);
            }
            
            .hero h1 {
                font-size: clamp(2.5rem, 5vw, 3.75rem);
                font-weight: 700;
                line-height: 1.1;
                letter-spacing: -0.02em;
                color: #ffffff;
                margin-bottom: 1.5rem;
                text-shadow: 0 2px 20px rgba(0, 0, 0, 0.2);
                max-width: 900px;
                margin-left: auto;
                margin-right: auto;
            }
            
            .glass-card {
                background: rgba(255, 255, 255, 0.08);
                backdrop-filter: blur(20px);
                -webkit-backdrop-filter: blur(20px);
                border-radius: 20px;
                padding: 3.5rem 3rem;
                margin-bottom: 2.5rem;
                border: 1px solid rgba(255, 255, 255, 0.15);
                box-shadow: 
                    0 20px 40px rgba(0, 0, 0, 0.1),
                    0 0 0 1px rgba(255, 255, 255, 0.05),
                    inset 0 1px 0 rgba(255, 255, 255, 0.1);
                position: relative;
                overflow: hidden;
                transition: all 0.3s ease;
            }
            
            .glass-card::before {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                height: 1px;
                background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
            }
            
            .glass-card:hover {
                transform: translateY(-4px);
                box-shadow: 
                    0 32px 64px rgba(0, 0, 0, 0.15),
                    0 0 0 1px rgba(255, 255, 255, 0.1),
                    inset 0 1px 0 rgba(255, 255, 255, 0.15);
                border: 1px solid rgba(255, 255, 255, 0.25);
            }
            
            .story {
                font-size: 1.25rem;
                line-height: 1.7;
                color: #f8fafc;
                font-weight: 400;
            }
            
            .story p {
                margin-bottom: 1.75rem;
            }
            
            .story .emphasis {
                font-weight: 600;
                background: linear-gradient(135deg, #60a5fa, #a78bfa);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                background-clip: text;
            }
            
            .story .twist {
                font-style: italic;
                font-size: 1.125rem;
                color: #e2e8f0;
                margin: 2rem 0;
                padding: 1.5rem;
                background: rgba(255, 255, 255, 0.05);
                border-radius: 12px;
                border-left: 4px solid rgba(168, 139, 250, 0.5);
            }
            
            .story .secret {
                background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #d946ef 100%);
                color: white;
                padding: 2.5rem 3rem;
                border-radius: 16px;
                text-align: center;
                font-size: 1.5rem;
                font-weight: 600;
                margin: 3rem 0;
                box-shadow: 
                    0 20px 40px rgba(139, 92, 246, 0.25),
                    0 0 0 1px rgba(255, 255, 255, 0.1);
                position: relative;
                overflow: hidden;
            }
            
            .secret::before {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                height: 1px;
                background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.5), transparent);
            }
            
            .section-title {
                font-size: 2.25rem;
                font-weight: 700;
                color: #ffffff;
                margin-bottom: 2rem;
                text-align: center;
                text-shadow: 0 2px 20px rgba(0, 0, 0, 0.2);
            }
            
            .partnership-list,
            .role-list {
                list-style: none;
                font-size: 1.125rem;
                line-height: 1.7;
                space-y: 1rem;
            }
            
            .partnership-list li,
            .role-list li {
                margin-bottom: 1.5rem;
                padding-left: 2rem;
                position: relative;
                color: #f1f5f9;
            }
            
            .partnership-list li::before {
                content: "▸";
                color: #60a5fa;
                font-size: 1.25rem;
                font-weight: 600;
                position: absolute;
                left: 0;
                top: 0;
            }
            
            .role-list li::before {
                content: "✓";
                color: #34d399;
                font-size: 1.125rem;
                font-weight: 700;
                position: absolute;
                left: 0;
                top: 0;
            }
            
            .stats-highlight {
                background: linear-gradient(135deg, #10b981 0%, #34d399 100%);
                color: white;
                padding: 2rem 2.5rem;
                border-radius: 16px;
                text-align: center;
                font-size: 1.25rem;
                font-weight: 600;
                margin: 2.5rem 0;
                box-shadow: 
                    0 20px 40px rgba(16, 185, 129, 0.25),
                    0 0 0 1px rgba(255, 255, 255, 0.1);
                position: relative;
                overflow: hidden;
            }
            
            .stats-highlight::before {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                height: 1px;
                background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.5), transparent);
            }
            
            .dark-glass {
                background: rgba(15, 23, 42, 0.7);
                backdrop-filter: blur(25px);
                -webkit-backdrop-filter: blur(25px);
                border: 1px solid rgba(255, 255, 255, 0.1);
                color: #ffffff;
            }
            
            .guarantee-list {
                font-size: 1.375rem;
                line-height: 1.6;
                margin-bottom: 2rem;
                font-weight: 500;
            }
            
            .guarantee-list p {
                margin-bottom: 1rem;
            }
            
            .trial-offer {
                background: rgba(255, 255, 255, 0.1);
                border-radius: 16px;
                padding: 2.5rem;
                margin: 2.5rem 0;
                font-size: 1.25rem;
                font-weight: 500;
                border: 1px solid rgba(255, 255, 255, 0.15);
            }
            
            .urgency-glass {
                background: linear-gradient(135deg, rgba(239, 68, 68, 0.9), rgba(220, 38, 38, 0.9));
                backdrop-filter: blur(25px);
                -webkit-backdrop-filter: blur(25px);
                border: 1px solid rgba(255, 255, 255, 0.2);
                color: #ffffff;
            }
            
            .cta-button {
                background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #d946ef 100%);
                color: white;
                padding: 1.25rem 3rem;
                border: none;
                border-radius: 50px;
                font-size: 1.125rem;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                text-decoration: none;
                display: inline-block;
                margin: 1.5rem 0.75rem;
                min-width: 200px;
                box-shadow: 
                    0 10px 25px rgba(139, 92, 246, 0.3),
                    0 0 0 1px rgba(255, 255, 255, 0.1);
                position: relative;
                overflow: hidden;
            }
            
            .cta-button::before {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                height: 1px;
                background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.6), transparent);
            }
            
            .cta-button:hover {
                transform: translateY(-3px);
                box-shadow: 
                    0 20px 40px rgba(139, 92, 246, 0.4),
                    0 0 0 1px rgba(255, 255, 255, 0.2);
                background: linear-gradient(135deg, #7c3aed 0%, #a855f7 50%, #ec4899 100%);
            }
            
            .cta-button.primary {
                background: linear-gradient(135deg, #ef4444 0%, #f97316 50%, #eab308 100%);
                font-size: 1.25rem;
                padding: 1.5rem 4rem;
                font-weight: 700;
                box-shadow: 
                    0 15px 35px rgba(239, 68, 68, 0.4),
                    0 0 0 1px rgba(255, 255, 255, 0.15);
            }
            
            .cta-button.primary:hover {
                box-shadow: 
                    0 25px 50px rgba(239, 68, 68, 0.5),
                    0 0 0 1px rgba(255, 255, 255, 0.25);
                background: linear-gradient(135deg, #dc2626 0%, #ea580c 50%, #ca8a04 100%);
            }

            .application-form {
                background: rgba(255, 255, 255, 0.12);
                backdrop-filter: blur(25px);
                -webkit-backdrop-filter: blur(25px);
                border-radius: 20px;
                padding: 3rem;
                margin: 3rem 0;
                border: 1px solid rgba(255, 255, 255, 0.2);
                box-shadow: 
                    0 25px 50px rgba(0, 0, 0, 0.15),
                    0 0 0 1px rgba(255, 255, 255, 0.05),
                    inset 0 1px 0 rgba(255, 255, 255, 0.1);
            }

            .form-group {
                margin-bottom: 1.5rem;
            }

            .form-label {
                display: block;
                color: #ffffff;
                font-weight: 600;
                margin-bottom: 0.5rem;
                font-size: 1rem;
            }

            .form-input {
                width: 100%;
                padding: 1rem 1.5rem;
                border: 1px solid rgba(255, 255, 255, 0.3);
                border-radius: 12px;
                background: rgba(255, 255, 255, 0.1);
                backdrop-filter: blur(10px);
                color: #ffffff;
                font-size: 1rem;
                transition: all 0.3s ease;
            }

            .form-input::placeholder {
                color: rgba(255, 255, 255, 0.6);
            }

            .form-input:focus {
                outline: none;
                border-color: rgba(168, 139, 250, 0.8);
                box-shadow: 0 0 0 3px rgba(168, 139, 250, 0.3);
                background: rgba(255, 255, 255, 0.15);
            }

            .submit-button {
                background: linear-gradient(135deg, #10b981 0%, #34d399 50%, #06d6a0 100%);
                color: white;
                padding: 1.25rem 3rem;
                border: none;
                border-radius: 50px;
                font-size: 1.125rem;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                width: 100%;
                box-shadow: 
                    0 10px 25px rgba(16, 185, 129, 0.3),
                    0 0 0 1px rgba(255, 255, 255, 0.1);
                position: relative;
                overflow: hidden;
            }

            .submit-button:hover {
                transform: translateY(-2px);
                box-shadow: 
                    0 20px 40px rgba(16, 185, 129, 0.4),
                    0 0 0 1px rgba(255, 255, 255, 0.2);
                background: linear-gradient(135deg, #059669 0%, #10b981 50%, #00d4aa 100%);
            }

            .form-message {
                text-align: center;
                color: rgba(255, 255, 255, 0.9);
                font-size: 0.95rem;
                margin-top: 1rem;
                line-height: 1.5;
            }
            
            @media (max-width: 768px) {
                .container {
                    padding: 1.5rem 1rem;
                }
                
                .hero {
                    padding: 3rem 2rem 2.5rem;
                    margin-bottom: 2rem;
                }
                
                .glass-card {
                    padding: 2.5rem 1.5rem;
                    margin-bottom: 2rem;
                }
                
                .section-title {
                    font-size: 1.875rem;
                }
                
                .story {
                    font-size: 1.125rem;
                }
                
                .cta-button {
                    padding: 1rem 2rem;
                    margin: 1rem 0.5rem;
                    min-width: 160px;
                }
                
                .cta-button.primary {
                    padding: 1.25rem 2.5rem;
                }
            }
          `
          }}
        />
      </head>
      <body>
        <div className="container">
          <div className="hero">
            <h1>
              How to Own a Software Company Without Writing Code, Spending a Fortune, or Waiting
              Years to Profit
            </h1>
          </div>

          <div className="glass-card story">
            <p>I was at lunch with an old friend.</p>
            <p>
              He told me he'd just landed a contract worth thousands — and it would keep paying him{' '}
              <strong>every single month</strong>.
            </p>

            <p>
              It wasn't real estate.
              <br />
              It wasn't stocks.
              <br />
              <span className="emphasis">It was software.</span>
            </p>

            <div className="twist">
              <p>
                The twist?
                <br />
                He didn't build it.
                <br />
                He didn't hire a developer.
                <br />
                And he barely knew what "API" meant.
              </p>
            </div>

            <p>That's when I learned the secret.</p>
            <p>
              <strong>You don't have to be the tech genius.</strong>
              <br />
              <strong>You just have to own the relationship.</strong>
            </p>

            <div className="secret">We do the rest.</div>
          </div>

          <div className="glass-card">
            <h2 className="section-title">The Partnership in Plain English</h2>
            <p
              style={{
                textAlign: 'center',
                marginBottom: '2.5rem',
                fontSize: '1.125rem',
                color: '#cbd5e1',
                fontWeight: '500'
              }}
            >
              We've built a system where:
            </p>

            <ul className="partnership-list">
              <li>
                <strong>We handle 70% of the work</strong> — all the software development, all the
                automation, all the tech headaches.
              </li>
              <li>
                <strong>Our AI finds and qualifies 70% of your leads</strong> — constantly feeding
                you warm prospects in your territory.
              </li>
              <li>
                <strong>You focus on conversations and closing deals</strong> — using your network
                and people skills to seal the sale.
              </li>
            </ul>
          </div>

          <div className="glass-card">
            <h2 className="section-title">Why This Works (Reason Why)</h2>
            <p
              style={{
                fontSize: '1.125rem',
                lineHeight: '1.7',
                marginBottom: '1.5rem',
                color: '#f1f5f9'
              }}
            >
              <strong>Every business runs on software.</strong> Most pay monthly. Many are
              frustrated with what they use now.
            </p>
            <p
              style={{
                fontSize: '1.125rem',
                lineHeight: '1.7',
                marginBottom: '2rem',
                color: '#f1f5f9'
              }}
            >
              When you step in with our proven platform, you offer an immediate, better alternative
              — without paying to develop it yourself.
            </p>

            <div className="stats-highlight">
              Our current partners convert about 3 in every 10 leads we send them. That's recurring
              income you can scale month after month.
            </div>
          </div>

          <div className="glass-card">
            <h2 className="section-title">Your Role</h2>
            <ul className="role-list">
              <li>Have (or build) a network of business owners.</li>
              <li>Be comfortable having real conversations about their needs.</li>
              <li>Commit to growing your territory.</li>
            </ul>
            <p
              style={{
                marginTop: '2rem',
                fontSize: '1.125rem',
                fontStyle: 'italic',
                color: '#cbd5e1'
              }}
            >
              We guide you through everything else — even the simple legal setup.
            </p>
          </div>

          <div className="glass-card dark-glass">
            <h2 className="section-title">Low Risk. High Reward.</h2>
            <div className="guarantee-list">
              <p>
                <strong>No upfront investment.</strong>
              </p>
              <p>
                <strong>No technical skills required.</strong>
              </p>
              <p>
                <strong>Exclusive territory</strong> — one partner per market.
              </p>
            </div>

            <div className="trial-offer">
              <strong>Try it for 14 days.</strong>
              <br />
              If you don't have leads in hand by then, you walk away owing nothing.
            </div>
          </div>

          <div className="glass-card urgency-glass">
            <h2 className="section-title">Your Market Won't Wait</h2>
            <p
              style={{
                fontSize: '1.25rem',
                lineHeight: '1.6',
                marginBottom: '1rem',
                fontWeight: '500'
              }}
            >
              <strong>We're only opening a limited number of territories this quarter.</strong>
            </p>
            <p
              style={{
                fontSize: '1.25rem',
                lineHeight: '1.6',
                marginBottom: '2rem',
                fontWeight: '500'
              }}
            >
              Once your area is taken, it's gone.
            </p>

            <a href="#apply" className="cta-button primary">
              📞 Click here to apply now and start your own software company before the month is out
            </a>
          </div>

          {/* Application Form */}
          <div id="apply" className="application-form">
            <h2 className="section-title">Apply for Your Exclusive Territory</h2>
            <p
              style={{
                textAlign: 'center',
                marginBottom: '2rem',
                fontSize: '1.125rem',
                color: 'rgba(255, 255, 255, 0.9)',
                fontWeight: '500'
              }}
            >
              Ready to own your software company? Just tell us who you are and we'll reach out
              within 24 hours.
            </p>

            <form id="franchiseForm">
              <div className="form-group">
                <label className="form-label" htmlFor="name">
                  Full Name
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  className="form-input"
                  placeholder="Your full name"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="email">
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  className="form-input"
                  placeholder="your@email.com"
                  required
                />
              </div>

              <button type="submit" className="submit-button">
                ✨ Apply Now - Secure My Territory
              </button>

              <div className="form-message">
                <strong>What happens next?</strong>
                <br />
                We'll email you within 24 hours with details about available territories and next
                steps.
                <br />
                No spam, no pressure - just the information you need to get started.
              </div>
            </form>
          </div>
        </div>

        <script
          dangerouslySetInnerHTML={{
            __html: `
            // Form submission handler
            document.getElementById('franchiseForm').addEventListener('submit', function(e) {
                e.preventDefault();
                const name = document.getElementById('name').value;
                const email = document.getElementById('email').value;
                
                if (name && email) {
                    // In a real application, this would send to your backend
                    console.log('Franchise application:', { name, email });
                    
                    // Show success message
                    alert('Thank you, ' + name + '! We\\'ve received your application and will email you within 24 hours with details about available territories. Check your inbox (and spam folder) for our response.');
                    
                    // Clear form
                    document.getElementById('name').value = '';
                    document.getElementById('email').value = '';
                } else {
                    alert('Please fill in both your name and email address.');
                }
            });
            
            // CTA button scroll to form
            document.querySelectorAll('.cta-button').forEach(button => {
                button.addEventListener('click', function(e) {
                    if (this.getAttribute('href') === '#apply') {
                        e.preventDefault();
                        document.getElementById('apply').scrollIntoView({ behavior: 'smooth' });
                    }
                });
            });
            
            // Smooth scroll behavior
            document.documentElement.style.scrollBehavior = 'smooth';
          `
          }}
        />
      </body>
    </html>
  )
}
