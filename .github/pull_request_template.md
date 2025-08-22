## Description
Brief description of what this PR does.

## Type of Change
- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update

## Quality Checklist

### Code Quality
- [ ] No hardcoded values (especially currency symbols)
- [ ] Proper error handling with try/catch blocks
- [ ] Loading states implemented for async operations
- [ ] No console.log statements
- [ ] TypeScript types properly defined (minimal `any` usage)

### Universal Architecture
- [ ] Uses only the 6 sacred tables
- [ ] Dynamic fields stored in `core_dynamic_data`
- [ ] Proper Smart Codes implemented
- [ ] No custom schema modifications
- [ ] Organization ID isolation maintained

### Security
- [ ] Three-layer authentication pattern implemented
- [ ] API endpoints validate organization_id
- [ ] Input validation and sanitization
- [ ] No exposed secrets or API keys
- [ ] Proper permission checks

### UI/UX
- [ ] Mobile responsive design
- [ ] Dark mode compatible
- [ ] Uses HERA design system components
- [ ] Dynamic currency formatting (no hardcoded $)
- [ ] Accessibility standards met (ARIA labels, keyboard nav)

### Performance
- [ ] Lazy loading for heavy components
- [ ] Optimized database queries
- [ ] No N+1 query problems
- [ ] Images optimized
- [ ] Bundle size checked

### Testing
- [ ] Unit tests added/updated
- [ ] Manual testing completed
- [ ] Cross-browser testing done
- [ ] Multi-organization testing verified

## How to Test
Step-by-step instructions for testing this PR:
1. 
2. 
3. 

## Screenshots/Videos
If applicable, add screenshots or videos to demonstrate the changes.

## Related Issues
Closes #(issue number)

## Additional Notes
Any additional information that reviewers should know.