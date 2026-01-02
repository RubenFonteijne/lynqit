# Email Templates

This directory contains HTML email templates for Lynqit.

## Templates

### `magic-link.html`
Email template for magic link authentication requests (English).

**Variables:**
- `{{magic_link_url}}` - The magic link URL to sign in
- `{{base_url}}` - Base URL of the application (e.g., https://lynqit.io)

### `magic-link-nl.html`
Email template for magic link authentication requests (Dutch/Nederlands).

**Variables:**
- `{{magic_link_url}}` - The magic link URL to sign in
- `{{base_url}}` - Base URL of the application (e.g., https://lynqit.io)

### `confirm-signup.html`
Email template for email confirmation after registration (English).

**Variables:**
- `{{ .ConfirmationURL }}` - The confirmation URL to verify the email address
- `{{base_url}}` - Base URL of the application (e.g., https://lynqit.io)

### `confirm-signup-nl.html`
Email template for email confirmation after registration (Dutch/Nederlands).

**Variables:**
- `{{ .ConfirmationURL }}` - The confirmation URL to verify the email address
- `{{base_url}}` - Base URL of the application (e.g., https://lynqit.io)

## Usage

These templates are designed to be used with email services that support HTML templates and variable substitution, such as:
- Supabase Auth email templates
- SendGrid
- Mailgun
- AWS SES
- Other email service providers

## Styling

All templates use:
- **Inline styles** for maximum email client compatibility
- **Table-based layouts** for better rendering across email clients
- **Lynqit brand colors:**
  - Primary Blue: `#2E47FF`
  - Cyan: `#00F0EE`
  - Dark Background: `#000000` / `#18181b`
  - Text Colors: `#ffffff`, `#a1a1aa`, `#71717a`

## Testing

Before using these templates in production:
1. Test in multiple email clients (Gmail, Outlook, Apple Mail, etc.)
2. Test on mobile devices
3. Verify all links work correctly
4. Check that variables are properly substituted

## Customization

To customize these templates:
1. Maintain inline styles for compatibility
2. Keep table-based structure
3. Test thoroughly after changes
4. Update this README if adding new templates

