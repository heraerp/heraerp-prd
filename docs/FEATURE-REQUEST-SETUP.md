# Feature Request System Setup

## Overview
The HERA ERP platform includes a built-in feature request system that allows users to submit feedback, bug reports, and feature requests directly from the application. All requests are sent via email to `help@hanaset.com`.

## Configuration

### 1. Resend API Setup

To enable the feature request email functionality, you need to configure Resend:

1. **Get a Resend API Key**:
   - Sign up at [resend.com](https://resend.com)
   - Create an API key from the dashboard
   - Add it to your `.env.local` file:
   ```env
   RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   ```

2. **Configure Email Domains** (Production):
   - Verify your domain in Resend dashboard
   - Update the `from` email in `/src/app/api/request-feature/route.ts`:
   ```typescript
   from: 'HERA Feature Requests <noreply@yourdomain.com>'
   ```

### 2. Development Mode

In development mode (when `RESEND_API_KEY` is not set), the system will:
- Log feature requests to the console
- Return a success response without sending emails
- Allow testing of the UI without email configuration

## Usage

### Accessing the Feature Request Page

Users can access the feature request form through multiple paths:

1. **From the Sidebar**: Click on "Help" in the bottom navigation
2. **From More Apps Modal**: Click "Request a Feature" button
3. **Direct URL**: Navigate to `/civicflow/help`

### Feature Categories

The system supports the following request categories:

- **Feature Request**: New features or enhancements
- **Bug Report**: Issues or problems
- **Integration Request**: New integrations or APIs
- **Security Enhancement**: Security improvements
- **UI/UX Improvement**: Design or usability improvements
- **API Enhancement**: API features or improvements
- **Other**: General feedback

### Email Template

Feature requests are sent with a professional HTML email template that includes:

- Category and priority badges
- User contact information
- Organization context
- Detailed description
- Timestamp and source page

### Confirmation Emails

When a feature request is submitted:
1. **Admin Email**: Sent to `help@hanaset.com` with full details
2. **User Confirmation**: Sent to the submitter confirming receipt

## API Endpoint

The feature request API endpoint is located at:
```
POST /api/request-feature
```

### Request Body

```json
{
  "name": "User Name",
  "email": "user@example.com",
  "category": "feature|bug|integration|security|ui-ux|api|other",
  "priority": "low|medium|high",
  "title": "Brief summary",
  "description": "Detailed description",
  "currentApp": "/current/page/path",
  "organizationId": "org-uuid"
}
```

### Response

Success:
```json
{
  "success": true,
  "message": "Feature request submitted successfully",
  "id": "email-id-from-resend"
}
```

Error:
```json
{
  "error": "Error message"
}
```

## Customization

### Changing the Recipient Email

To change where feature requests are sent, update the `to` field in `/src/app/api/request-feature/route.ts`:

```typescript
to: ['your-email@example.com'],
```

### Adding Custom Fields

To add custom fields to the feature request form:

1. Update the form in `/src/app/civicflow/help/page.tsx`
2. Update the API handler in `/src/app/api/request-feature/route.ts`
3. Update the email template to include the new fields

### Styling

The feature request page uses the CivicFlow theme with:
- Teal accent color: `rgb(0,166,166)`
- Glassmorphism effects on cards
- Consistent dark/light mode support
- Responsive design for mobile/desktop

## Security Considerations

- Email validation is performed on both client and server
- Required fields are validated before submission
- Rate limiting should be added for production use
- Consider adding CAPTCHA for public-facing deployments

## Testing

To test the feature request system:

1. **Without Resend**: Just load the page and submit - requests will be logged to console
2. **With Resend**: Add your API key and requests will be sent to the configured email
3. **Email Preview**: The HTML email template can be previewed by extracting the `generateEmailTemplate` function

## Monitoring

Feature requests are tagged in Resend with:
- `category`: The type of request
- `priority`: The priority level
- `source`: Always set to 'hera-erp'

These tags can be used for filtering and analytics in the Resend dashboard.