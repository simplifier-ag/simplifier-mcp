import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ReadResourceResult } from "@modelcontextprotocol/sdk/types.js";

export function registerLoggingApiDocumentation(server: McpServer): void {
  server.resource(
    "logging-api-docs",
    "simplifier://documentation/server-businessobjects/api/Logging",
    {
      title: "Simplifier Logging API Documentation",
      mimeType: "text/markdown",
      description: "Complete reference for Simplifier.Log methods available in server-side Business Objects"
    },
    async (uri): Promise<ReadResourceResult> => {
      const markdownContent = `# Simplifier Logging API Reference

The Simplifier Logging API provides comprehensive logging functionality within server-side Business Objects for debugging, monitoring, and auditing purposes.

## Overview
Access logging methods via: \`Simplifier.Log.<method>\`

All logging methods follow the same pattern:
- **message**: String (required) - The main log message
- **details**: String|Object (optional) - Additional context or data

## Log Levels

### \`Simplifier.Log.info(message, details?)\`
Creates a log entry with level **INFO** for general informational messages.
- **Input**: (string, string|object?)
- **Result**: ()

\`\`\`javascript
Simplifier.Log.info("User login successful");
Simplifier.Log.info("Processing user data", "UserID: 12345");
\`\`\`

### \`Simplifier.Log.warn(message, details?)\`
Creates a log entry with level **WARNING** for potentially problematic situations.
- **Input**: (string, string|object?)
- **Result**: ()

\`\`\`javascript
Simplifier.Log.warn("High memory usage detected");
Simplifier.Log.warn("API response slow", "Response time: 5.2 seconds");
\`\`\`

### \`Simplifier.Log.error(message, details?)\`
Creates a log entry with level **ERROR** for error conditions that don't halt execution.
- **Input**: (string, string|object?)
- **Result**: ()

\`\`\`javascript
Simplifier.Log.error("Failed to update user record");
Simplifier.Log.error("Database connection failed", {
  database: "UserDB",
  error: "Timeout after 30 seconds"
});
\`\`\`

### \`Simplifier.Log.critical(message, details?)\`
Creates a log entry with level **CRITICAL** for serious errors requiring immediate attention.
- **Input**: (string, string|object?)
- **Result**: ()

\`\`\`javascript
Simplifier.Log.critical("System out of memory");
Simplifier.Log.critical("Security breach detected", {
  source: "API Gateway",
  timestamp: new Date().toISOString()
});
\`\`\`

### \`Simplifier.Log.debug(message, details?)\`
Creates a log entry with level **DEBUG** for detailed diagnostic information.
- **Input**: (string, string|object?)
- **Result**: ()

\`\`\`javascript
Simplifier.Log.debug("Function entry point reached");
Simplifier.Log.debug("Variable state", {
  userId: input.userId,
  sessionId: "abc123",
  timestamp: Date.now()
});
\`\`\`

## Parameter Types and Examples

### String Details
\`\`\`javascript
Simplifier.Log.info("User authentication", "Login attempt for user: admin");
Simplifier.Log.warn("Performance issue", "Query took 3.5 seconds to complete");
\`\`\`

### Object Details
\`\`\`javascript
Simplifier.Log.error("API call failed", {
  endpoint: "/api/users/create",
  method: "POST",
  statusCode: 500,
  responseTime: "2.3s",
  payload: { firstName: "John", lastName: "Doe" }
});
\`\`\`

### Array Details
\`\`\`javascript
Simplifier.Log.info("Processing batch", [
  "Array", 1337, 42.1, null, true,
  { key: "value" },
  [1, 3, 3, 7]
]);
\`\`\`

### Different Data Types
\`\`\`javascript
// Number
Simplifier.Log.critical("Error code", 1337);

// Float
Simplifier.Log.debug("Performance metric", 42.1);

// Null
Simplifier.Log.info("Optional parameter", null);

// Boolean
Simplifier.Log.warn("Feature flag status", true);
\`\`\`

## Log Level Guidelines

### When to Use Each Level

**INFO** - General application flow and business events
- User actions (login, logout, data updates)
- Successful operations
- Business process milestones

**WARN** - Unusual but non-critical situations
- Performance degradation
- Deprecated feature usage
- Recoverable errors
- Resource usage warnings

**ERROR** - Error conditions that don't stop execution
- Failed operations with fallback
- Invalid input data
- External service failures
- Data validation errors

**CRITICAL** - Serious errors requiring immediate attention
- System failures
- Security incidents
- Data corruption
- Resource exhaustion

**DEBUG** - Detailed diagnostic information
- Variable values and state
- Function entry/exit points
- Algorithm step-by-step execution
- Performance measurements

## Common Use Cases

### Business Logic Monitoring
\`\`\`javascript
function processOrder(orderData) {
  Simplifier.Log.info("Processing new order", {
    orderId: orderData.id,
    customerId: orderData.customerId,
    total: orderData.total
  });

  if (orderData.total > 10000) {
    Simplifier.Log.warn("High value order detected", {
      orderId: orderData.id,
      total: orderData.total,
      requiresApproval: true
    });
  }

  // Process order logic here

  Simplifier.Log.info("Order processed successfully", {
    orderId: orderData.id,
    processingTime: Date.now() - startTime
  });
}
\`\`\`

### Error Handling and Recovery
\`\`\`javascript
function getUserData(userId) {
  try {
    var userData = Simplifier.Connector.UserDB.getUser({ id: userId });
    Simplifier.Log.info("User data retrieved", { userId: userId });
    return userData;
  } catch (error) {
    Simplifier.Log.error("Failed to retrieve user data", {
      userId: userId,
      error: error.message,
      fallbackUsed: true
    });

    // Fallback to cache
    return getCachedUserData(userId);
  }
}
\`\`\`

### Performance Monitoring
\`\`\`javascript
function expensiveCalculation(data) {
  var startTime = Date.now();

  Simplifier.Log.debug("Starting expensive calculation", {
    dataSize: data.length,
    timestamp: startTime
  });

  // Perform calculation
  var result = performCalculation(data);

  var duration = Date.now() - startTime;

  if (duration > 5000) {
    Simplifier.Log.warn("Slow calculation detected", {
      duration: duration + "ms",
      dataSize: data.length,
      threshold: "5000ms"
    });
  } else {
    Simplifier.Log.debug("Calculation completed", {
      duration: duration + "ms",
      resultSize: result.length
    });
  }

  return result;
}
\`\`\`

### Security and Audit Logging
\`\`\`javascript
function authenticateUser(credentials) {
  Simplifier.Log.info("Authentication attempt", {
    username: credentials.username,
    timestamp: new Date().toISOString(),
    source: "Business Object"
  });

  var user = Simplifier.User.checkLogin(credentials.username, credentials.password);

  if (user) {
    Simplifier.Log.info("Authentication successful", {
      username: credentials.username,
      userId: user.id
    });
  } else {
    Simplifier.Log.warn("Authentication failed", {
      username: credentials.username,
      reason: "Invalid credentials"
    });
  }

  return user;
}
\`\`\`

### Debugging Complex Logic
\`\`\`javascript
function calculateDiscount(customer, order) {
  Simplifier.Log.debug("Calculating discount", {
    customerId: customer.id,
    customerType: customer.type,
    orderTotal: order.total,
    itemCount: order.items.length
  });

  var discount = 0;

  // VIP customer logic
  if (customer.type === "VIP") {
    discount += 0.1; // 10%
    Simplifier.Log.debug("VIP discount applied", { discount: discount });
  }

  // Bulk order logic
  if (order.total > 1000) {
    discount += 0.05; // 5%
    Simplifier.Log.debug("Bulk order discount applied", { discount: discount });
  }

  // Maximum discount cap
  if (discount > 0.15) {
    discount = 0.15;
    Simplifier.Log.debug("Discount capped at maximum", { discount: discount });
  }

  var finalDiscount = order.total * discount;

  Simplifier.Log.info("Discount calculated", {
    customerId: customer.id,
    orderTotal: order.total,
    discountPercent: discount * 100 + "%",
    discountAmount: finalDiscount
  });

  return finalDiscount;
}
\`\`\`

## Best Practices

### Structured Logging
Always use objects for complex details to enable better log analysis:
\`\`\`javascript
// Good - structured data
Simplifier.Log.error("Payment failed", {
  paymentId: "pay_123456",
  amount: 99.99,
  currency: "EUR",
  errorCode: "CARD_DECLINED",
  gateway: "Stripe"
});

// Less ideal - string concatenation
Simplifier.Log.error("Payment pay_123456 failed: CARD_DECLINED");
\`\`\`

### Consistent Context
Include consistent context information across related operations:
\`\`\`javascript
var context = {
  sessionId: input.sessionId,
  userId: input.userId,
  operation: "orderProcessing"
};

Simplifier.Log.info("Order validation started", context);
// ... validation logic
Simplifier.Log.info("Order validation completed", {
  ...context,
  validationResult: "passed"
});
\`\`\`

### Sensitive Data
Never log sensitive information like passwords, tokens, or personal data:
\`\`\`javascript
// Good - mask sensitive data
Simplifier.Log.info("User login", {
  username: user.username,
  email: user.email.replace(/(.{2}).*(@.*)/, "$1***$2")
});

// Bad - exposing sensitive data
Simplifier.Log.info("User login", {
  username: user.username,
  password: user.password // Never do this!
});
\`\`\`

## Troubleshooting with Logs

### Finding Issues
Use different log levels strategically:
\`\`\`javascript
// Use DEBUG for detailed flow
Simplifier.Log.debug("Entering validation function", { inputData: input });

// Use INFO for major steps
Simplifier.Log.info("User validation passed", { userId: user.id });

// Use WARN for recoverable issues
Simplifier.Log.warn("External service timeout, using cache", { service: "AddressValidator" });

// Use ERROR for failures
Simplifier.Log.error("Failed to save user preferences", { userId: user.id, error: error.message });
\`\`\`

### Performance Tracking
\`\`\`javascript
function trackPerformance(operationName, fn) {
  var start = Date.now();

  try {
    var result = fn();
    var duration = Date.now() - start;

    Simplifier.Log.info("Operation completed", {
      operation: operationName,
      duration: duration + "ms",
      success: true
    });

    return result;
  } catch (error) {
    var duration = Date.now() - start;

    Simplifier.Log.error("Operation failed", {
      operation: operationName,
      duration: duration + "ms",
      error: error.message,
      success: false
    });

    throw error;
  }
}
\`\`\`
`;

      return {
        contents: [{
          uri: uri.href,
          text: markdownContent,
          mimeType: "text/markdown"
        }]
      };
    }
  );
}