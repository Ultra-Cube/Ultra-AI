# AI & Routing Instructions

**applyTo**: AI routing code, LLM gateway, model routing, prompt engineering

## Overview

AI routing code handles the intelligence layer of Ultra AI - selecting models, routing requests, managing providers, and ensuring quality and safety.

## Core Principles

### 1. Task-Aware Routing
- Analyze user intent before routing
- Select appropriate model for the task
- Consider cost, latency, and quality
- Cache results where appropriate

### 2. Provider Abstraction
- Implement consistent provider interface
- Support multiple providers (OpenAI, Anthropic, local)
- Handle provider-specific differences
- Implement fallback strategies

### 3. Safety & Quality
- Validate all prompts before sending
- Implement prompt injection defense
- Sanitize model outputs
- Filter inappropriate content

### 4. Explainability
- Log routing decisions
- Provide "why this model" explanations
- Track model performance
- Enable manual override

## Model Selection Logic

### Task Classification
- Analyze request type (generation, analysis, summarization, translation)
- Determine required capabilities
- Estimate complexity
- Consider real-time requirements

### Provider Selection
- Check provider health
- Consider rate limits
- Evaluate cost
- Check feature compatibility

### Fallback Strategy
- Primary provider → Secondary provider → Local model
- Implement exponential backoff
- Track fallback rates
- Alert on frequent fallbacks

## Prompt Engineering

### Prompt Templates
- Use structured prompt templates
- Include system instructions
- Use few-shot examples where helpful
- Allow template customization

### Context Management
- Include relevant context
- Manage context window limits
- Prioritize important information
- Use summarization for long contexts

### Safety Prompts
- Include safety instructions
- Define boundaries
- Specify output format
- Prevent harmful outputs

## Quality Gates

### Input Validation
- Validate user inputs
- Check for prompt injection
- Sanitize special characters
- Limit input length

### Output Validation
- Validate output format
- Check for harmful content
- Verify completeness
- Filter inappropriate content

### Performance Monitoring
- Track response times
- Monitor token usage
- Measure quality metrics
- Log errors and failures

## Local Model Integration

### Ollama Integration
- Manage model downloads
- Handle model selection
- Monitor local model health
- Implement graceful degradation

### AirLLM Integration
- Configure local model servers
- Handle model loading/unloading
- Monitor resource usage
- Implement caching

### Hybrid Routing
- Prefer local models for privacy-sensitive tasks
- Use external models for complex tasks
- Allow user preference
- Show routing trace

## Memory & Context

### Memory Layer
- Store user preferences
- Remember past interactions
- Implement forgetting policies
- Allow memory deletion

### Context Management
- Maintain conversation context
- Manage multi-turn conversations
- Handle context window limits
- Implement context compression

## Evaluation & Testing

### Golden Tests
- Create test cases for each task type
- Validate model outputs
- Compare against expected results
- Track quality metrics

### Red-Team Tests
- Test prompt injection attempts
- Test jailbreak attempts
- Test safety boundaries
- Test edge cases

### Regression Tests
- Test routing logic
- Test fallback mechanisms
- Test error handling
- Test performance

## Security Considerations

### Prompt Injection Defense
- Sanitize all inputs
- Use system prompts carefully
- Implement output filtering
- Monitor for adversarial inputs

### Data Privacy
- Don't log sensitive user data
- Implement data retention policies
- Allow data deletion
- Use encryption for stored data

### API Security
- Secure API keys
- Implement rate limiting
- Monitor for abuse
- Implement IP allowlisting

## Monitoring & Observability

### Metrics to Track
- Request volume
- Response times
- Token usage
- Provider health
- Error rates
- Quality scores

### Logging
- Log routing decisions
- Log model selections
- Log errors with context
- Log user actions (with consent)

### Tracing
- Implement distributed tracing
- Track request lifecycle
- Identify bottlenecks
- Enable performance debugging
