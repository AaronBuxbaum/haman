# GitHub Copilot Instructions for Haman Repository

## Project Overview
Haman is a Broadway lottery automation system that combines AI-powered preference parsing with browser automation to automatically apply to Broadway show lotteries. The system uses OpenAI GPT-4 to parse user preferences and Playwright for browser automation, deployed as serverless functions on Vercel.

**Key Technologies:**
- **Runtime**: Node.js 18+ with TypeScript
- **AI**: OpenAI GPT-4 API for natural language preference parsing
- **Automation**: Playwright for browser automation with anti-detection measures
- **Cloud**: Vercel serverless functions with Next.js
- **Testing**: Bun Test (Jest-compatible)
- **Linting**: ESLint with TypeScript support

## Architecture Overview

### Core Components
1. **User Database** (`src/database.ts`): User management with in-memory storage (development) and Vercel KV support (production)
2. **Preference Parser** (`src/preferenceParser.ts`): AI-powered parsing of user preferences using GPT-4
3. **Lottery Automation** (`src/lotteryAutomation.ts`): Playwright-based automation with anti-detection
4. **Show Catalog** (`src/showCatalog.ts`): Broadway show listings and lottery URLs (dynamically scraped)
5. **Lottery Service** (`src/lotteryService.ts`): Main orchestration layer
6. **API Routes** (`pages/api/`): Next.js serverless API endpoints

See `ARCHITECTURE.md` for detailed system design and data flow diagrams.

## Development Setup

### Prerequisites
- Node.js 18+ and npm
- Vercel CLI (optional, for deployment)
- OpenAI API key (optional - system works without it)

### Build, Test, and Lint Commands
```bash
npm install          # Install dependencies
npm run build        # Next.js build (TypeScript compilation)
npm run lint         # ESLint checks
npm test             # Run Bun tests
npm run dev          # Run development server (http://localhost:3000)
npm run deploy       # Deploy to Vercel
```

### Environment Variables
Create a `.env` file with:
- `OPENAI_API_KEY`: Your OpenAI API key (optional - system works without it)
- `NODE_ENV`: Environment (production/development)
- Vercel KV variables are auto-configured in production

## Code Style and Best Practices

### TypeScript Guidelines
- **Strict mode enabled**: All TypeScript strict checks are enforced
- **No explicit any**: Use proper types; `any` raises warnings
- **Interface naming**: Use descriptive names without prefixes (e.g., `User`, not `IUser`)
- **Module exports**: Use named exports over default exports
- **Target**: ES2020 with CommonJS modules

### Code Organization
- Keep functions small and focused on single responsibility
- Use async/await for asynchronous operations
- Follow existing patterns for error handling (try/catch with logging)
- Write self-documenting code with meaningful variable names
- Add comments only for complex logic, anti-detection patterns, or non-obvious decisions

## Testing Guidelines

### Testing Framework
- **Framework**: Bun Test (Jest-compatible syntax)
- **Test files**: Use `.test.ts` suffix
- **Coverage**: Aim for meaningful coverage of core logic

### Writing Tests
- Write unit tests for all new features
- Test both success and error paths
- Mock external dependencies (OpenAI API, browser automation)
- Use descriptive test names that explain what is being tested
- Keep tests isolated, fast, and repeatable
- Follow existing test patterns in the repository

### Running Tests
```bash
npm test              # Run all tests with Bun
```

## Documentation Standards

### What to Document
- Update README.md when adding features or changing functionality
- Document public APIs and interfaces in code
- Keep ARCHITECTURE.md in sync with system design changes
- Update QUICKSTART.md for setup/usage changes
- Maintain clear inline comments for anti-detection measures

### Documentation Style
- Use clear, concise language
- Include code examples where helpful
- Keep markdown formatting consistent
- Document both "what" and "why" for non-obvious decisions
- Link to external resources when appropriate

## Project-Specific Considerations

### Anti-Detection Measures
This project implements browser automation to apply to Broadway lotteries. Anti-detection is critical:

1. **Browser Fingerprinting**: Random user agents, realistic viewport sizes, proper locale/timezone
2. **Webdriver Detection**: Hide `navigator.webdriver`, mock plugins, override automation properties  
3. **Human-like Behavior**: Random delays (500-3000ms), variable typing speed (50-150ms/char), scrolling
4. **Network Fingerprinting**: Proper HTTP headers, Accept-Language, Security headers

**When modifying automation code:**
- Preserve all anti-detection measures
- Test against real lottery sites to ensure they still work
- Random delays and human-like behavior are intentional - do not remove
- See ARCHITECTURE.md "Anti-Detection Measures" section for details

### Serverless/Vercel Considerations
- **Cold starts**: Vercel serverless functions may have cold starts
- **Timeout**: Functions have 60-second default timeout (configurable)
- **Memory**: Configurable per function
- **Dependencies**: Playwright works with proper configuration on Vercel
- **Environment**: Use environment variables for configuration (never hardcode secrets)
- **Storage**: Vercel KV (Redis) for persistent data

### AI/OpenAI Integration
- **Model**: Uses GPT-4 with JSON mode for structured output
- **Prompts**: Preference parsing prompts are carefully crafted - changes may affect accuracy
- **Error handling**: Always handle API errors gracefully
- **Cost**: Be mindful of token usage; cache parsed preferences when possible

### Dependency Management
- **Playwright**: Browser automation library - version updates may affect anti-detection
- **OpenAI SDK**: Keep aligned with API changes
- **Vercel KV**: Redis-based storage for production
- **Next.js**: Keep aligned with Vercel platform updates
- **Security**: Review dependencies for vulnerabilities before updating

## Version Control Best Practices

### Commit Messages
- Write clear, descriptive commit messages
- Use conventional commit format when appropriate (feat:, fix:, docs:, etc.)
- Keep commits focused and atomic
- Reference issue numbers with # (e.g., "Fix preference parsing #42")

### Pull Requests
- Ensure all tests pass before requesting review
- Run linting: `npm run lint`
- Verify build succeeds: `npm run build`
- Provide clear description of changes
- Link to related issues
- Include examples or screenshots for UI/output changes

## Security Considerations

### Critical Security Rules
- **Never commit sensitive information**: API keys, passwords, tokens, credentials
- **Environment variables**: Use `.env` for local development (never commit `.env` file)
- **API keys**: OpenAI API key must be in environment variables only
- **User data**: Email addresses should be encrypted at rest in production
- **Dependencies**: Review dependencies for known vulnerabilities before adding/updating
- **Input validation**: Always validate and sanitize user input
- **Rate limiting**: Implement per-user limits to prevent abuse

### Security Best Practices
- Follow OWASP guidelines for web security
- Use HTTPS for all external API calls
- Implement proper error handling without exposing sensitive details
- Keep dependencies up to date with security patches
- Review SECURITY.md for vulnerability reporting

## Common Patterns and Anti-Patterns

### ✅ DO
- Use TypeScript types for all function parameters and return values
- Handle errors with try/catch and proper logging
- Use async/await for asynchronous operations
- Cache parsed preferences to reduce API calls
- Test both success and failure scenarios
- Follow existing code patterns in the repository

### ❌ DON'T
- Don't use `any` type (use `unknown` if type is truly unknown)
- Don't commit API keys or sensitive data
- Don't remove anti-detection measures without understanding impact
- Don't modify Playwright configurations without testing on real sites
- Don't increase timeout values without good reason
- Don't add dependencies without checking for vulnerabilities

## Deployment and Production

### Deployment Process
```bash
npm run build        # Build Next.js application
npm run deploy       # Deploy to Vercel
```

### Production Considerations
- **Database**: Vercel KV (Redis) for persistent storage
- **Monitoring**: Use Vercel Analytics for logs and metrics
- **Scaling**: Vercel serverless functions scale automatically
- **Scheduling**: Runs daily at 9 AM and 11 AM EST via Vercel Cron
- **Cost optimization**: Minimize function execution time, reuse browser instances, batch API calls

## Getting Help

### Resources
- **README.md**: Quick start and feature overview
- **ARCHITECTURE.md**: Detailed system design and component documentation
- **QUICKSTART.md**: Step-by-step setup guide
- **SECURITY.md**: Security policy and vulnerability reporting
- **Custom Agents**: See `.github/agents/` for specialized agents:
  - `general-purpose.agent.md`: General development tasks
  - `documentation.agent.md`: Documentation maintenance
  - `testing.agent.md`: Test creation and maintenance

### When Making Changes
1. Understand the component you're modifying (see ARCHITECTURE.md)
2. Check existing tests for patterns
3. Run linting and tests locally before committing
4. For automation changes, test against real lottery sites
5. Update documentation if changing public interfaces
6. Consider security implications of your changes
