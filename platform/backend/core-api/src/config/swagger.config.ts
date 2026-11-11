/**
 * Swagger/OpenAPI Configuration for Fastify
 * 
 * Provides automated API documentation using OpenAPI 3.1 specification
 */

import type { FastifyDynamicSwaggerOptions } from '@fastify/swagger';
import type { FastifySwaggerUiOptions } from '@fastify/swagger-ui';

export const swaggerOptions: FastifyDynamicSwaggerOptions = {
  openapi: {
    openapi: '3.1.0',
    info: {
      title: 'Ultra AI Platform API',
      version: '1.0.0',
      description: 'Comprehensive API documentation for the Ultra AI Platform - A distributed AI processing platform with blockchain rewards',
      contact: {
        name: 'Ultra AI PlatformTeam',
        email: 'api@ultraai.platform',
        url: 'https://ultraai.platform',
      },
      license: {
        name: 'Proprietary',
        url: 'https://ultraai.platform/license',
      },
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Development server',
      },
      {
        url: 'https://api-staging.ultraai.platform',
        description: 'Staging server',
      },
      {
        url: 'https://api.ultraai.platform',
        description: 'Production server',
      },
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT Authorization header using the Bearer scheme. Example: "Authorization: Bearer {token}"',
        },
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: { type: 'string', description: 'Unique user identifier', example: 'clx123abc456def789' },
            email: { type: 'string', format: 'email', description: 'User email address', example: 'user@example.com' },
            role: { type: 'string', enum: ['USER', 'MODERATOR', 'ADMIN', 'SUPER_ADMIN'], description: 'User role', example: 'USER' },
            createdAt: { type: 'string', format: 'date-time', description: 'Account creation timestamp' },
          },
        },
        Error: {
          type: 'object',
          properties: {
            error: { type: 'string', description: 'Error message', example: 'ValidationError' },
          },
        },
      },
    },
    tags: [
      { name: 'Authentication', description: 'User authentication and authorization' },
      { name: 'User Profile', description: 'User profile and workspace management' },
      { name: 'AI Processing', description: 'AI request processing' },
      { name: 'Compliance', description: 'GDPR/CCPA compliance endpoints' },
      { name: 'Security', description: 'Security and audit endpoints' },
    ],
  },
};

export const swaggerUiOptions: FastifySwaggerUiOptions = {
  routePrefix: '/api-docs',
  uiConfig: {
    docExpansion: 'list',
    deepLinking: true,
  },
  staticCSP: true,
  transformStaticCSP: (header) => header,
};

