# Web App Instructions

**applyTo**: `platform/frontend/**`

## Overview

The web application (`platform/frontend`) is the primary user interface for Ultra AI. It serves as both a control center and a demonstration platform.

## Key Principles

### 1. Adaptive UI
- The UI should adapt to user role and context
- Support both Arabic (RTL) and English (LTR)
- Use design tokens from the unified design system
- Implement the UI-spec renderer pattern

### 2. Performance
- Use Next.js App Router for optimal performance
- Implement code splitting for large bundles
- Optimize images and static assets
- Use React Server Components where possible

### 3. Accessibility
- Follow WCAG 2.1 AA standards
- Support keyboard navigation
- Provide ARIA labels for interactive elements
- Ensure high contrast ratios

### 4. Security
- Sanitize all user inputs
- Use Content Security Policy headers
- Implement rate limiting on API routes
- Never expose secrets to the client

## Component Guidelines

### Page Components
- Use Server Components by default
- Only use Client Components when interactivity is required
- Keep components small and focused
- Extract reusable components to shared packages

### Styling
- Use Tailwind CSS for styling
- Follow the design system tokens in `platform/frontend/app/design-system.css`
- Use CSS modules for component-specific styles
- Ensure RTL support for all layouts

### State Management
- Use React hooks for local state
- Use server actions for mutations
- Implement optimistic UI updates where appropriate
- Use React Query for server state if needed

## API Routes

### Route Organization
- Group related routes in folders
- Use RESTful conventions
- Implement proper error handling
- Validate all inputs

### Security
- Check authentication/authorization
- Validate and sanitize inputs
- Implement rate limiting
- Log all requests for audit trails

## Testing

### Unit Tests
- Test all components
- Mock external dependencies
- Test error states
- Test loading states

### E2E Tests
- Test critical user flows
- Test authentication flows
- Test API integrations
- Test error scenarios

## Specific Requirements

### Dashboard
- Display system health metrics
- Show active AI systems
- Display provider status
- Show resource usage
- Support real-time updates

### ZeroAI Page
- Show local model status
- Display routing traces
- Show memory context
- Allow manual routing control
- Display n8n workflow status

### Agent Management
- List all registered agents
- Show agent health
- Allow agent configuration
- Display agent metrics
- Support agent coordination

## Performance Targets

- First Contentful Paint: < 1.5s
- Time to Interactive: < 3s
- Lighthouse Score: > 90
- Bundle size: < 500KB (gzipped)

## Accessibility Requirements

- WCAG 2.1 AA compliant
- Keyboard navigable
- Screen reader compatible
- High contrast mode support
- RTL support for Arabic
