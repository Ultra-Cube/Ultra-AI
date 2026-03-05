# Contributing to Ultra AI Platform

First off, thank you for considering contributing to Ultra AI Platform! It's people like you that make this platform such a great tool.

## 🌟 Code of Conduct

This project and everyone participating in it is governed by our Code of Conduct. By participating, you are expected to uphold this code.

## 🚀 How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check the existing issues as you might find out that you don't need to create one. When you are creating a bug report, please include as many details as possible:

* **Use a clear and descriptive title**
* **Describe the exact steps to reproduce the problem**
* **Provide specific examples to demonstrate the steps**
* **Describe the behavior you observed and what behavior you expected**
* **Include screenshots if applicable**
* **Include your environment details** (OS, Node version, etc.)

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. When creating an enhancement suggestion, please include:

* **Use a clear and descriptive title**
* **Provide a detailed description of the suggested enhancement**
* **Explain why this enhancement would be useful**
* **List any examples of how it might work**

### Pull Requests

* Fill in the required template
* Follow the TypeScript/JavaScript style guide
* Include appropriate test coverage
* Update documentation as needed
* End all files with a newline

## 💻 Development Process

### 1. Fork and Clone

```bash
# Fork the repo on GitHub, then clone your fork
git clone https://github.com/YOUR-USERNAME/Ultra-AI.git
cd Ultra-AI

# Add upstream remote
git remote add upstream https://github.com/Ultra-Cube/Ultra-AI.git
```

### 2. Create a Branch

```bash
# Create a new branch for your feature/fix
git checkout -b feature/amazing-feature
# or
git checkout -b bugfix/fix-something
```

### 3. Set Up Development Environment

```bash
# Install dependencies
npm install

# Setup environment variables
cp .env.example .env

# Start databases
docker-compose up -d

# Run in development mode
npm run dev
```

### 4. Make Your Changes

* Write clear, concise commit messages
* Follow the commit message convention (see below)
* Add tests for new features
* Ensure all tests pass
* Update documentation if needed

### 5. Commit Your Changes

We use [Conventional Commits](https://www.conventionalcommits.org/) for commit messages:

```bash
# Format: <type>(<scope>): <subject>

# Examples:
git commit -m "feat(ai): add Arabic language support"
git commit -m "fix(auth): resolve token expiration issue"
git commit -m "docs(readme): update installation instructions"
git commit -m "test(api): add tests for user endpoints"
```

**Types:**
- `feat`: A new feature
- `fix`: A bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, missing semicolons, etc.)
- `refactor`: Code refactoring
- `perf`: Performance improvements
- `test`: Adding or updating tests
- `chore`: Maintenance tasks
- `security`: Security improvements
- `ci`: CI/CD changes

**Scopes:**
- `ai`, `api`, `ui`, `distributed`, `blockchain`, `p2p`, `auth`, `db`, `security`, `core`, `backend`, `frontend`, `docs`, `deps`

### 6. Push and Create Pull Request

```bash
# Push your branch
git push origin feature/amazing-feature

# Go to GitHub and create a Pull Request
```

## 🧪 Testing

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test -- path/to/test/file.test.ts
```

### Writing Tests

* Write tests for all new features
* Maintain or improve code coverage
* Use descriptive test names
* Follow the AAA pattern (Arrange, Act, Assert)

```typescript
describe('Feature Name', () => {
  it('should do something specific', () => {
    // Arrange
    const input = 'test';
    
    // Act
    const result = someFunction(input);
    
    // Assert
    expect(result).toBe('expected');
  });
});
```

## 📝 Style Guide

### TypeScript/JavaScript

* Use TypeScript for all new code
* Follow the ESLint configuration
* Use meaningful variable names
* Write self-documenting code
* Add comments for complex logic
* Prefer async/await over promises
* Use const by default, let when necessary, never var

### Code Organization

```typescript
// 1. Imports (grouped and sorted)
import { externals } from 'external-package';
import { internals } from '@ultra-ai/package';
import { relative } from '../relative';

// 2. Types and Interfaces
interface MyInterface {
  prop: string;
}

// 3. Constants
const CONSTANT_VALUE = 'value';

// 4. Main code
export class MyClass {
  // ...
}

// 5. Helper functions
function helperFunction() {
  // ...
}
```

### Documentation

* Use JSDoc for public APIs
* Include examples in documentation
* Keep README up to date
* Document complex algorithms
* Add inline comments for tricky code

```typescript
/**
 * Processes a user request and returns the result
 * @param request - The user request object
 * @param options - Optional processing options
 * @returns Promise resolving to the processed result
 * @throws {ValidationError} If the request is invalid
 * @example
 * ```typescript
 * const result = await processRequest(request, { async: true });
 * ```
 */
async function processRequest(
  request: Request,
  options?: ProcessOptions
): Promise<Result> {
  // Implementation
}
```

## 🔒 Security

* Never commit sensitive data (keys, passwords, tokens)
* Use environment variables for configuration
* Report security vulnerabilities privately
* Follow security best practices
* Keep dependencies up to date

## 📋 Pull Request Checklist

Before submitting your PR, make sure:

- [ ] Code follows the style guide
- [ ] Tests are passing (`npm test`)
- [ ] Linting passes (`npm run lint`)
- [ ] Type checking passes (`npm run type-check`)
- [ ] Documentation is updated
- [ ] Commit messages follow the convention
- [ ] Branch is up to date with main
- [ ] PR description clearly describes the changes
- [ ] Related issues are linked

## 📞 Questions?

Feel free to ask questions by:
* Opening a GitHub Discussion
* Joining our Discord server (link in README)
* Emailing us at dev@ucubetech.com

## 📄 License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing to Ultra AI Platform! 🚀
