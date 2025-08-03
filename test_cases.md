# 🧪 Test Cases for Code Review Agent

This document contains sample code snippets for testing the Code Review Agent across different programming languages and issue categories.

## Test Case 1: Python - SQL Injection & Performance Issues

### Input Code:
```python
def get_user_data(user_id):
    query = "SELECT * FROM users WHERE id = " + str(user_id)
    cursor.execute(query)
    return cursor.fetchall()

def process_user_list(users):
    result = []
    for user in users:
        for i in range(len(users)):
            if users[i]['department'] == user['department']:
                result.append(user)
    return result
```

### Expected AI Output Categories:
- **Security**: 
  - SQL injection vulnerability on line 2
  - Recommend parameterized queries
- **Performance**: 
  - Nested loop creating O(n²) complexity on line 7-10
  - Consider using dictionary for department grouping
- **Style**: 
  - Missing type hints and docstrings
  - Variable naming could be more descriptive

---

## Test Case 2: TypeScript - Type Safety & Logic Issues

### Input Code:
```typescript
function calculateDiscount(price: any, discountPercent: any): any {
    if (discountPercent > 1) {
        discountPercent = discountPercent / 100;
    }
    
    let discount = price * discountPercent;
    let finalPrice = price - discount;
    
    if (finalPrice < 0) {
        return 0;
    }
    
    return Math.round(finalPrice * 100) / 100;
}

function processOrders(orders: any[]) {
    let total = 0;
    orders.forEach(order => {
        total += calculateDiscount(order.price, order.discount);
    });
    return total;
}
```

### Expected AI Output Categories:
- **Style**: 
  - Use proper TypeScript types instead of 'any'
  - Inconsistent variable declarations (let vs const)
- **Logic**: 
  - Potential logic error with discount percentage handling
  - Missing validation for negative prices
- **Performance**: 
  - Consider using reduce() instead of forEach for accumulation

---

## Test Case 3: Java - Security & Best Practices

### Input Code:
```java
import java.sql.*;
import java.util.*;

public class UserManager {
    private static final String DB_PASSWORD = "admin123";
    private Connection connection;
    
    public boolean authenticateUser(String username, String password) {
        try {
            String query = "SELECT * FROM users WHERE username = '" + 
                          username + "' AND password = '" + password + "'";
            Statement stmt = connection.createStatement();
            ResultSet rs = stmt.executeQuery(query);
            
            return rs.next();
        } catch (SQLException e) {
            e.printStackTrace();
            return false;
        }
    }
    
    public void updatePassword(String username, String newPassword) {
        String query = "UPDATE users SET password = '" + newPassword + 
                      "' WHERE username = '" + username + "'";
        try {
            Statement stmt = connection.createStatement();
            stmt.executeUpdate(query);
        } catch (SQLException e) {
            // Ignore errors
        }
    }
}
```

### Expected AI Output Categories:
- **Security**: 
  - SQL injection vulnerabilities in both methods
  - Hardcoded password constant
  - Plain text password storage
  - Information leakage through stack traces
- **Style**: 
  - Poor error handling (ignoring exceptions)
  - Missing proper logging
  - Resource management issues (no try-with-resources)
- **Logic**: 
  - No input validation
  - Missing null checks

---

## Test Case 4: JavaScript - Performance & Modern Practices

### Input Code:
```javascript
var users = [
    {id: 1, name: "John", age: 25},
    {id: 2, name: "Jane", age: 30},
    {id: 3, name: "Bob", age: 35}
];

function findUsersByAge(minAge) {
    var result = [];
    for (var i = 0; i < users.length; i++) {
        if (users[i].age >= minAge) {
            result.push(users[i]);
        }
    }
    return result;
}

function getUserNames() {
    var names = [];
    for (var i = 0; i < users.length; i++) {
        names.push(users[i].name);
    }
    return names;
}

// Global variable mutation
function addUser(user) {
    users.push(user);
}
```

### Expected AI Output Categories:
- **Style**: 
  - Use 'const'/'let' instead of 'var'
  - Consider using modern array methods (filter, map)
  - Inconsistent code style
- **Logic**: 
  - Global state mutation can cause side effects
  - No input validation for user object
- **Performance**: 
  - Multiple loops could be optimized
  - Consider functional programming approaches

---

## Test Case 5: C++ - Memory Management & Safety

### Input Code:
```cpp
#include <iostream>
#include <string>

class StringProcessor {
private:
    char* buffer;
    int size;
    
public:
    StringProcessor(int s) {
        size = s;
        buffer = new char[size];
    }
    
    void processString(const char* input) {
        strcpy(buffer, input);  // Potential buffer overflow
        
        for (int i = 0; i < strlen(input); i++) {
            buffer[i] = toupper(buffer[i]);
        }
    }
    
    char* getResult() {
        return buffer;
    }
};

int main() {
    StringProcessor* processor = new StringProcessor(10);
    processor->processString("This is a very long string that will overflow");
    
    std::cout << processor->getResult() << std::endl;
    
    // Memory leak - no delete called
    return 0;
}
```

### Expected AI Output Categories:
- **Security**: 
  - Buffer overflow vulnerability with strcpy
  - No bounds checking
- **Memory**: 
  - Memory leak (missing destructor and delete)
  - Raw pointer usage without RAII
- **Style**: 
  - Missing const correctness
  - No copy constructor/assignment operator
  - Use of deprecated functions (strcpy)
- **Performance**: 
  - Inefficient string length calculation in loop

---

## Test Case 6: C# - Exception Handling & LINQ Usage

### Input Code:
```csharp
using System;
using System.Collections.Generic;
using System.Linq;

public class DataProcessor
{
    private List<int> data;
    
    public DataProcessor()
    {
        data = new List<int>();
    }
    
    public void AddData(int value)
    {
        data.Add(value);
    }
    
    public double CalculateAverage()
    {
        int sum = 0;
        for (int i = 0; i < data.Count; i++)
        {
            sum += data[i];
        }
        return sum / data.Count;  // Potential division by zero
    }
    
    public List<int> GetEvenNumbers()
    {
        List<int> evens = new List<int>();
        foreach (int num in data)
        {
            if (num % 2 == 0)
            {
                evens.Add(num);
            }
        }
        return evens;
    }
    
    public int FindMaxValue()
    {
        if (data.Count == 0)
            throw new Exception("No data available");
            
        int max = data[0];
        for (int i = 1; i < data.Count; i++)
        {
            if (data[i] > max)
                max = data[i];
        }
        return max;
    }
}
```

### Expected AI Output Categories:
- **Logic**: 
  - Division by zero risk in CalculateAverage
  - Inconsistent error handling approaches
- **Style**: 
  - Could use LINQ for cleaner code (Where, Max, Average)
  - Generic Exception instead of specific exception types
  - Manual loops where LINQ would be more appropriate
- **Performance**: 
  - Multiple iterations over same data
  - Could cache Count property

---

## Testing Instructions

### Manual Testing Process:

1. **Start the application** following the setup instructions in README.md

2. **For each test case:**
   - Select the appropriate programming language
   - Copy and paste the input code into the Monaco Editor
   - Click "Review Code" button
   - Wait for AI analysis to complete

3. **Verify the output contains:**
   - Appropriate feedback categories (security, performance, logic, style)
   - Correct severity levels (high, medium, low)
   - Reasonable line numbers for issues
   - Actionable suggestions for improvements
   - Overall summary and score

4. **Check edge cases:**
   - Empty code input (should show error)
   - Very large code files (test performance)
   - Invalid syntax (should be handled gracefully)
   - Different programming languages

### Automated Testing (Future Implementation):

```python
# Example pytest test structure
def test_sql_injection_detection():
    code = """
    def get_user_data(user_id):
        query = "SELECT * FROM users WHERE id = " + str(user_id)
        cursor.execute(query)
        return cursor.fetchall()
    """
    
    response = client.post("/review-code", json={
        "code": code,
        "language": "python"
    })
    
    assert response.status_code == 200
    feedback = response.json()
    
    # Check that security issues are detected
    security_issues = [f for f in feedback["feedback"] if f["category"] == "security"]
    assert len(security_issues) > 0
    assert any("injection" in issue["message"].lower() for issue in security_issues)
```

### Expected Response Times:
- **Simple code snippets (< 50 lines)**: 2-5 seconds
- **Medium complexity (50-200 lines)**: 5-15 seconds  
- **Large files (200+ lines)**: 15-30 seconds

### Quality Metrics:
- **Accuracy**: AI should identify at least 80% of obvious issues
- **Relevance**: Suggestions should be actionable and language-appropriate
- **Consistency**: Similar issues should receive similar categorization
- **Coverage**: All major issue categories should be represented across test cases