import { NextRequest, NextResponse } from 'next/server'
import { Octokit } from '@octokit/rest'
import { z } from 'zod'

// Validation schema for partner application
const PartnerApplicationSchema = z.object({
  name: z.string().min(1, 'Company name is required'),
  website: z.string().url('Valid website URL is required'),
  contactName: z.string().min(1, 'Contact name is required'),
  contactEmail: z.string().email('Valid email is required'),
  contactPhone: z.string().optional(),
  summary: z.string().min(50, 'Summary must be at least 50 characters'),
  specialties: z.array(z.string()).min(1, 'At least one specialty is required'),
  tags: z.array(z.string()).default([]),
  hq: z.string().min(1, 'Headquarters location is required'),
  regions: z.array(z.string()).default([]),
  yearsInBusiness: z.number().min(1, 'Years in business must be at least 1'),
  employeeCount: z.string().min(1, 'Employee count is required'),
  certifications: z.array(z.string()).default([]),
  partnershipReason: z.string().min(100, 'Partnership reason must be at least 100 characters')
})

// GitHub configuration
const GITHUB_TOKEN = process.env.GITHUB_TOKEN
const GITHUB_OWNER = process.env.GITHUB_OWNER || 'anthropics'
const GITHUB_REPO = process.env.GITHUB_REPO || 'claude-code'
const BASE_BRANCH = 'main'

if (!GITHUB_TOKEN) {
  console.warn('GITHUB_TOKEN not found - PR creation will fail')
}

/**
 * Generate a slug from company name
 */
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
}

/**
 * Generate markdown content for the partner
 */
function generatePartnerMarkdown(data: z.infer<typeof PartnerApplicationSchema>): string {
  const slug = generateSlug(data.name)

  return `---
name: "${data.name}"
slug: "${slug}"
website: "${data.website}"
summary: "${data.summary}"
published: false
featured: false
specialties:
${data.specialties.map(s => `  - "${s}"`).join('\n')}
tags:
${data.tags.map(t => `  - "${t}"`).join('\n')}
locations:
  hq: "${data.hq}"
  regions:
${data.regions.map(r => `    - "${r}"`).join('\n')}
contacts:
  - name: "${data.contactName}"
    email: "${data.contactEmail}"${data.contactPhone ? `\n    phone: "${data.contactPhone}"` : ''}
    role: "Primary Contact"
metadata:
  yearsInBusiness: ${data.yearsInBusiness}
  employeeCount: "${data.employeeCount}"
  certifications:
${data.certifications.map(c => `    - "${c}"`).join('\n')}
  applicationDate: "${new Date().toISOString()}"
seo_title: "${data.name} - HERA Partner"
seo_description: "${data.summary.substring(0, 160)}..."
---

# ${data.name}

${data.summary}

## Why Partner with HERA?

${data.partnershipReason}

## Specialties

${data.specialties.map(s => `- ${s}`).join('\n')}

## Contact Information

- **Primary Contact**: ${data.contactName}
- **Email**: ${data.contactEmail}${data.contactPhone ? `\n- **Phone**: ${data.contactPhone}` : ''}
- **Website**: [${data.website}](${data.website})

## Company Details

- **Headquarters**: ${data.hq}
- **Regions Served**: ${data.regions.length > 0 ? data.regions.join(', ') : 'To be determined'}
- **Years in Business**: ${data.yearsInBusiness}
- **Employee Count**: ${data.employeeCount}
${data.certifications.length > 0 ? `- **Certifications**: ${data.certifications.join(', ')}` : ''}

---

*This partner application was submitted on ${new Date().toLocaleDateString()} and is pending review.*
`
}

/**
 * Create a GitHub Pull Request for the partner application
 */
async function createPartnerPR(data: z.infer<typeof PartnerApplicationSchema>) {
  if (!GITHUB_TOKEN) {
    throw new Error('GitHub token not configured')
  }

  const octokit = new Octokit({ auth: GITHUB_TOKEN })
  const slug = generateSlug(data.name)
  const branchName = `partner-application/${slug}`
  const fileName = `content/partners/${slug}.mdx`
  const markdownContent = generatePartnerMarkdown(data)

  try {
    // Get the main branch reference
    const { data: mainBranch } = await octokit.rest.git.getRef({
      owner: GITHUB_OWNER,
      repo: GITHUB_REPO,
      ref: `heads/${BASE_BRANCH}`
    })

    // Create a new branch for the partner application
    await octokit.rest.git.createRef({
      owner: GITHUB_OWNER,
      repo: GITHUB_REPO,
      ref: `refs/heads/${branchName}`,
      sha: mainBranch.object.sha
    })

    // Create the partner file
    await octokit.rest.repos.createOrUpdateFileContents({
      owner: GITHUB_OWNER,
      repo: GITHUB_REPO,
      path: fileName,
      message: `feat(partners): Add ${data.name} partner application

- Company: ${data.name}
- Contact: ${data.contactName} <${data.contactEmail}>
- Website: ${data.website}
- Specialties: ${data.specialties.join(', ')}

🤖 Generated automatically from partner application form`,
      content: Buffer.from(markdownContent, 'utf8').toString('base64'),
      branch: branchName
    })

    // Create the Pull Request
    const { data: pr } = await octokit.rest.pulls.create({
      owner: GITHUB_OWNER,
      repo: GITHUB_REPO,
      title: `Partner Application: ${data.name}`,
      head: branchName,
      base: BASE_BRANCH,
      body: `## New Partner Application

**Company**: ${data.name}
**Contact**: ${data.contactName} (${data.contactEmail})
**Website**: ${data.website}
**Location**: ${data.hq}

### Summary
${data.summary}

### Specialties
${data.specialties.map(s => `- ${s}`).join('\n')}

### Why Partner with HERA?
${data.partnershipReason}

---

### Review Checklist
- [ ] Company information verified
- [ ] Website and contact details checked
- [ ] Specialties align with HERA ecosystem
- [ ] Partnership reasoning is compelling
- [ ] Logo provided (if available)
- [ ] Ready to publish

### Next Steps
1. Review the partner information above
2. Verify company details and website
3. Check for logo in \`public/images/partners/${slug}.*\`
4. Update \`published: true\` when ready to go live
5. Consider setting \`featured: true\` for strategic partners

🤖 This PR was created automatically from the partner application form.`
    })

    return {
      success: true,
      prUrl: pr.html_url,
      prNumber: pr.number,
      branch: branchName,
      fileName
    }
  } catch (error) {
    console.error('Failed to create GitHub PR:', error)
    throw error
  }
}

/**
 * API Route Handler
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate the request data
    const validationResult = PartnerApplicationSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validationResult.error.format()
        },
        { status: 400 }
      )
    }

    const data = validationResult.data

    // Create the GitHub PR
    const result = await createPartnerPR(data)

    return NextResponse.json({
      message: 'Partner application submitted successfully!',
      ...result
    })
  } catch (error) {
    console.error('Partner application error:', error)

    // Handle different error types
    if (error instanceof Error) {
      if (error.message.includes('GitHub token')) {
        return NextResponse.json({ error: 'GitHub integration not configured' }, { status: 503 })
      }

      if (error.message.includes('Repository not found')) {
        return NextResponse.json({ error: 'Repository configuration error' }, { status: 503 })
      }
    }

    return NextResponse.json({ error: 'Failed to submit partner application' }, { status: 500 })
  }
}

// Health check endpoint
export async function GET() {
  return NextResponse.json({
    status: 'Partner application API is running',
    hasGitHubToken: !!GITHUB_TOKEN,
    configuration: {
      owner: GITHUB_OWNER,
      repo: GITHUB_REPO,
      baseBranch: BASE_BRANCH
    }
  })
}
