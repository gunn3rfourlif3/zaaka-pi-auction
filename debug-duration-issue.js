// 🔍 DEBUG AUCTION DURATION ISSUE
// This script tests the duration calculation problem

console.log("🚨 DEBUGGING AUCTION DURATION CALCULATION");
console.log("==========================================");

// Test current implementation
function testCurrentImplementation() {
  console.log("\n📋 Testing Current Implementation:");
  
  const testDurations = [0.0833, 0.1667, 0.25, 0.5]; // 5, 10, 15, 30 minutes in hours
  
  testDurations.forEach(hours => {
    const now = new Date();
    const expirationDate = new Date();
    expirationDate.setHours(expirationDate.getHours() + hours);
    
    const timeDiffMs = expirationDate.getTime() - now.getTime();
    const minutesDiff = Math.round(timeDiffMs / (1000 * 60));
    
    console.log(`${hours} hours (decimal) → ${minutesDiff} minutes actual`);
    console.log(`   Expected: ${hours * 60} minutes`);
    console.log(`   Actual: ${minutesDiff} minutes`);
    console.log(`   Error: ${Math.abs(minutesDiff - (hours * 60))} minutes`);
    console.log("");
  });
}

// Test proper implementation
function testProperImplementation() {
  console.log("\n✅ Testing Proper Implementation:");
  
  const testMinutes = [5, 10, 15, 30];
  
  testMinutes.forEach(minutes => {
    const now = new Date();
    const expirationDate = new Date();
    expirationDate.setMinutes(expirationDate.getMinutes() + minutes);
    
    const timeDiffMs = expirationDate.getTime() - now.getTime();
    const minutesDiff = Math.round(timeDiffMs / (1000 * 60));
    
    console.log(`${minutes} minutes → ${minutesDiff} minutes actual`);
    console.log(`   Expected: ${minutes} minutes`);
    console.log(`   Actual: ${minutesDiff} minutes`);
    console.log(`   Error: ${Math.abs(minutesDiff - minutes)} minutes`);
    console.log("");
  });
}

// Test setHours vs setMinutes behavior
function testSetBehavior() {
  console.log("\n🔧 Testing setHours vs setMinutes Behavior:");
  
  const baseDate = new Date('2024-01-01T12:00:00');
  
  // Test setHours with decimal
  const date1 = new Date(baseDate);
  date1.setHours(date1.getHours() + 0.25); // 15 minutes
  console.log(`setHours(+0.25): ${baseDate.toISOString()} → ${date1.toISOString()}`);
  
  // Test setMinutes
  const date2 = new Date(baseDate);
  date2.setMinutes(date2.getMinutes() + 15); // 15 minutes
  console.log(`setMinutes(+15): ${baseDate.toISOString()} → ${date2.toISOString()}`);
  
  // Compare results
  const diff1 = date1.getTime() - baseDate.getTime();
  const diff2 = date2.getTime() - baseDate.getTime();
  
  console.log(`setHours difference: ${diff1}ms (${diff1/1000/60} minutes)`);
  console.log(`setMinutes difference: ${diff2}ms (${diff2/1000/60} minutes)`);
  console.log(`Difference: ${Math.abs(diff1 - diff2)}ms`);
}

// Run all tests
testCurrentImplementation();
testProperImplementation();
testSetBehavior();

console.log("\n🎯 CONCLUSION:");
console.log("The issue is using setHours() with decimal hours.");
console.log("Solution: Use setMinutes() instead for accurate minute calculations.");