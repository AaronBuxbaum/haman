# GitHub Copilot Instructions for Haman Repository

## Project Overview
Haman is a Broadway lottery automation system that combines AI-powered preference parsing with browser automation to automatically apply to Broadway show lotteries. The system uses Anthropic Claude to parse user preferences and Playwright for browser automation, deployed as serverless functions on AWS Lambda.

**Key Technologies:**
- **Runtime**: Node.js 20.x with TypeScript
- **AI**: Anthropic Claude API for natural language preference parsing
- **Automation**: Playwright for browser automation with anti-detection measures
- **Cloud**: AWS Lambda with serverless framework
- **Testing**: Jest with ts-jest
- **Linting**: ESLint with TypeScript support

## Architecture Overview

### Core Components
1. **User Database** (`src/database.ts`): User management with in-memory storage
2. **Preference Parser** (`src/preferenceParser.ts`): AI-powered parsing of user preferences using Claude
3. **Lottery Automation** (`src/lotteryAutomation.ts`): Playwright-based automation with anti-detection
4. **Show Catalog** (`src/showCatalog.ts`): Broadway show listings and lottery URLs
5. **Lottery Service** (`src/lotteryService.ts`): Main orchestration layer
6. **Lambda Handler** (`src/handler.ts`): AWS Lambda entry point

See `ARCHITECTURE.md` for detailed system design and data flow diagrams.

## Development Setup

### Prerequisites
- Node.js 18+ and npm
- AWS CLI configured (for deployment)
- Anthropic API key

### Build, Test, and Lint Commands
```bash
npm install          # Install dependencies
npm run build        # TypeScript compilation
npm run lint         # ESLint checks
npm test             # Run Jest tests
npm run dev          # Run example CLI locally
npm run deploy       # Deploy to AWS Lambda
```

### Environment Variables
Create a `.env` file with:
- `ANTHROPIC_API_KEY`: Your Anthropic API key (required)
- `NODE_ENV`: Environment (production/development)

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
- **Framework**: Jest with ts-jest preset
- **Test files**: Place tests in `__tests__` directories or use `.test.ts` / `.spec.ts` suffixes
- **Coverage**: Aim for meaningful coverage of core logic

### Writing Tests
- Write unit tests for all new features
- Test both success and error paths
- Mock external dependencies (Anthropic API, browser automation)
- Use descriptive test names that explain what is being tested
- Keep tests isolated, fast, and repeatable
- Follow existing test patterns in the repository

### Running Tests
```bash
npm test              # Run all tests
npm test -- --watch   # Watch mode
npm test -- --coverage # Generate coverage report
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

### Serverless/AWS Lambda Considerations
- **Cold starts**: Keep Lambda warm with CloudWatch Events if needed
- **Timeout**: Functions have 5-minute timeout for browser operations
- **Memory**: 1024 MB allocated for Playwright browser
- **Dependencies**: Playwright requires special Lambda layer or bundling
- **Environment**: Use environment variables for configuration (never hardcode secrets)

### AI/Anthropic Integration
- **Model**: Uses Claude 3.5 Sonnet for structured output parsing
- **Prompts**: Preference parsing prompts are carefully crafted - changes may affect accuracy
- **Error handling**: Always handle API errors gracefully
- **Cost**: Be mindful of token usage; cache parsed preferences when possible

### Dependency Management
- **Playwright**: Browser automation library - version updates may affect anti-detection
- **Anthropic SDK**: Keep aligned with API changes
- **AWS SDK**: Required for production database integration
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
- **API keys**: Anthropic API key must be in environment variables only
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
npm run build        # Compile TypeScript
serverless deploy    # Deploy to AWS Lambda
```

### Production Considerations
- **Database**: Current in-memory database won't persist between Lambda invocations
- **Monitoring**: Use CloudWatch for logs and metrics
- **Scaling**: Lambda concurrency can be adjusted for parallel processing
- **Scheduling**: Runs daily at 9 AM and 11 AM EST via CloudWatch Events
- **Cost optimization**: Keep functions warm, reuse browser instances, batch API calls

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
