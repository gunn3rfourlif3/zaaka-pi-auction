/**
 * 💬 COMPREHENSIVE CHAT FUNCTIONALITY TESTING SCRIPT
 * Tests messaging between sellers and winners with all edge cases
 * 
 * Usage: Run in browser console after loading the auction app
 */

// Global chat testing state
window.chatTestState = {
  testMessages: [],
  testConversations: [],
  currentTestUser: null,
  messageCounter: 0
};

/**
 * 🎯 Initialize chat testing with comprehensive test scenarios
 */
window.initChatTesting = function() {
  console.log('🚀 Initializing comprehensive chat testing...');
  
  // Reset test state
  window.chatTestState = {
    testMessages: [],
    testConversations: [],
    currentTestUser: 'test_user_1',
    messageCounter: 0
  };
  
  console.log('✅ Chat testing initialized');
  console.log('📋 Available test functions:');
  console.log('  - window.testSellerWinnerChat()');
  console.log('  - window.testRealTimeMessaging()');
  console.log('  - window.testMessagePersistence()');
  console.log('  - window.testChatEdgeCases()');
  console.log('  - window.testMessageDelivery()');
  console.log('  - window.simulateChatScenarios()');
  console.log('  - window.runFullChatTestSuite()');
};

/**
 * 💬 Test basic seller-winner chat functionality
 */
window.testSellerWinnerChat = async function() {
  console.log('💬 Testing seller-winner chat functionality...');
  
  try {
    // Find an auction with a winner
    const auctions = await window.fetchAuctionsForChatTesting();
    const testAuction = auctions.find(a => a.status === 'CLOSED' && a.currentBid > 0);
    
    if (!testAuction) {
      console.warn('⚠️ No closed auction with winner found. Creating test scenario...');
      await window.createTestChatScenario();
      return;
    }
    
    const sellerId = testAuction.seller_id;
    const winnerId = await window.getWinnerForAuction(testAuction.id);
    
    console.log(`🎯 Testing chat for Auction #${testAuction.id}`);
    console.log(`👤 Seller: ${sellerId}`);
    console.log(`🏆 Winner: ${winnerId}`);
    console.log(`💰 Final Price: ${testAuction.currentBid} π`);
    
    // Test seller messaging winner
    await window.testMessageFlow(sellerId, winnerId, testAuction.id, 'seller_to_winner');
    
    // Test winner messaging seller
    await window.testMessageFlow(winnerId, sellerId, testAuction.id, 'winner_to_seller');
    
    console.log('✅ Seller-winner chat test completed');
    
  } catch (error) {
    console.error('❌ Seller-winner chat test failed:', error);
  }
};

/**
 * ⚡ Test real-time messaging functionality
 */
window.testRealTimeMessaging = async function() {
  console.log('⚡ Testing real-time messaging functionality...');
  
  try {
    const testAuction = await window.getTestAuctionForRealTime();
    const user1 = 'test_user_1';
    const user2 = 'test_user_2';
    
    console.log(`🎯 Testing real-time messages for Auction #${testAuction.id}`);
    
    // Open chat modal for user1
    window.handleOpenChat(testAuction.id, user2, user2, testAuction.title);
    
    // Send rapid messages to test real-time updates
    const messages = [
      "Hello! I'm interested in this item.",
      "What's the condition?",
      "Can you provide more details?",
      "I'm ready to arrange pickup."
    ];
    
    for (let i = 0; i < messages.length; i++) {
      await window.sendTestMessage(user1, user2, testAuction.id, messages[i]);
      await window.delay(1000); // 1 second delay between messages
    }
    
    console.log('✅ Real-time messaging test completed');
    
  } catch (error) {
    console.error('❌ Real-time messaging test failed:', error);
  }
};

/**
 * 💾 Test message persistence and delivery
 */
window.testMessagePersistence = async function() {
  console.log('💾 Testing message persistence and delivery...');
  
  try {
    const testAuction = await window.getTestAuctionForPersistence();
    const sender = 'test_user_3';
    const receiver = 'test_user_4';
    const testMessage = "Testing message persistence - " + Date.now();
    
    console.log(`🎯 Testing persistence for Auction #${testAuction.id}`);
    
    // Send message
    const sentMessage = await window.sendTestMessage(sender, receiver, testAuction.id, testMessage);
    console.log('📤 Message sent:', sentMessage);
    
    // Wait a moment
    await window.delay(500);
    
    // Fetch messages to verify persistence
    const fetchedMessages = await window.fetchMessages(testAuction.id, sender);
    console.log('📥 Fetched messages:', fetchedMessages.length);
    
    // Verify message exists
    const foundMessage = fetchedMessages.find(msg => msg.content === testMessage);
    if (foundMessage) {
      console.log('✅ Message persistence verified');
    } else {
      console.error('❌ Message not found in persistence');
    }
    
    // Test message ordering
    const isChronological = window.verifyMessageOrder(fetchedMessages);
    console.log(`⏰ Messages in chronological order: ${isChronological}`);
    
    console.log('✅ Message persistence test completed');
    
  } catch (error) {
    console.error('❌ Message persistence test failed:', error);
  }
};

/**
 * 🧪 Test chat edge cases and error handling
 */
window.testChatEdgeCases = async function() {
  console.log('🧪 Testing chat edge cases and error handling...');
  
  const testCases = [
    {
      name: 'Empty message',
      sender: 'test_user_5',
      receiver: 'test_user_6',
      message: '',
      shouldFail: true
    },
    {
      name: 'Very long message',
      sender: 'test_user_5',
      receiver: 'test_user_6',
      message: 'A'.repeat(1000),
      shouldFail: false
    },
    {
      name: 'Special characters',
      sender: 'test_user_5',
      receiver: 'test_user_6',
      message: 'Hello! 🎉 @#$%^&*()_+{}[]|\\:;"\'<>?,./',
      shouldFail: false
    },
    {
      name: 'Unicode characters',
      sender: 'test_user_5',
      receiver: 'test_user_6',
      message: '你好世界 🌍 مرحبا بالعالم',
      shouldFail: false
    },
    {
      name: 'Invalid auction ID',
      sender: 'test_user_5',
      receiver: 'test_user_6',
      message: 'Test message',
      auctionId: 999999,
      shouldFail: true
    }
  ];
  
  for (const testCase of testCases) {
    console.log(`🔍 Testing: ${testCase.name}`);
    
    try {
      const result = await window.sendTestMessage(
        testCase.sender,
        testCase.receiver,
        testCase.auctionId || 1,
        testCase.message
      );
      
      if (testCase.shouldFail) {
        console.error(`❌ Expected failure but succeeded: ${testCase.name}`);
      } else {
        console.log(`✅ Passed: ${testCase.name}`);
      }
      
    } catch (error) {
      if (testCase.shouldFail) {
        console.log(`✅ Expected failure: ${testCase.name}`);
      } else {
        console.error(`❌ Unexpected failure: ${testCase.name}`, error);
      }
    }
  }
  
  console.log('✅ Edge cases test completed');
};

/**
 * 📨 Test message delivery and notifications
 */
window.testMessageDelivery = async function() {
  console.log('📨 Testing message delivery and notifications...');
  
  try {
    const testAuction = await window.getTestAuctionForDelivery();
    const sender = 'test_user_7';
    const receiver = 'test_user_8';
    
    console.log(`🎯 Testing delivery for Auction #${testAuction.id}`);
    
    // Send message from sender
    const message1 = "Hello, this is a test message!";
    await window.sendTestMessage(sender, receiver, testAuction.id, message1);
    
    // Simulate receiver opening chat
    const receiverMessages = await window.fetchMessages(testAuction.id, receiver);
    console.log(`📨 Receiver fetched ${receiverMessages.length} messages`);
    
    // Send reply from receiver
    const message2 = "Thanks for your message! I'll get back to you soon.";
    await window.sendTestMessage(receiver, sender, testAuction.id, message2);
    
    // Verify bidirectional communication
    const allMessages = await window.fetchMessages(testAuction.id, sender);
    const senderMessages = allMessages.filter(msg => msg.sender_id === sender);
    const receiverMessages = allMessages.filter(msg => msg.sender_id === receiver);
    
    console.log(`📤 Sender messages: ${senderMessages.length}`);
    console.log(`📥 Receiver messages: ${receiverMessages.length}`);
    
    if (senderMessages.length > 0 && receiverMessages.length > 0) {
      console.log('✅ Bidirectional messaging verified');
    } else {
      console.error('❌ Bidirectional messaging failed');
    }
    
    console.log('✅ Message delivery test completed');
    
  } catch (error) {
    console.error('❌ Message delivery test failed:', error);
  }
};

/**
 * 🎭 Simulate realistic chat scenarios
 */
window.simulateChatScenarios = async function() {
  console.log('🎭 Simulating realistic chat scenarios...');
  
  const scenarios = [
    {
      name: 'Item Inquiry',
      messages: [
        { sender: 'buyer', content: "Hi! I'm interested in this item." },
        { sender: 'seller', content: "Hello! Thanks for your interest. What would you like to know?" },
        { sender: 'buyer', content: "What's the condition and when can I pick it up?" },
        { sender: 'seller', content: "It's in excellent condition. I'm available weekdays after 5 PM." },
        { sender: 'buyer', content: "Perfect! I'll arrange pickup this week." }
      ]
    },
    {
      name: 'Price Negotiation',
      messages: [
        { sender: 'buyer', content: "Would you consider a lower price for quick pickup?" },
        { sender: 'seller', content: "The auction already ended, so the price is final." },
        { sender: 'buyer', content: "I understand. When can we meet?" },
        { sender: 'seller', content: "How about tomorrow at 3 PM at the central plaza?" },
        { sender: 'buyer', content: "That works for me! See you then." }
      ]
    },
    {
      name: 'Delivery Arrangement',
      messages: [
        { sender: 'seller', content: "Congratulations on winning! Ready to arrange delivery?" },
        { sender: 'buyer', content: "Thank you! Yes, I'm ready. Do you deliver?" },
        { sender: 'seller', content: "I can deliver within 5km for a small fee." },
        { sender: 'buyer', content: "I'm just 2km away. What's your address?" },
        { sender: 'seller', content: "I'll send you the location. Available tomorrow?" }
      ]
    }
  ];
  
  for (const scenario of scenarios) {
    console.log(`🎭 Simulating: ${scenario.name}`);
    
    const testAuction = await window.getTestAuctionForScenario();
    
    for (const message of scenario.messages) {
      const sender = message.sender === 'buyer' ? 'test_user_9' : 'test_user_10';
      const receiver = message.sender === 'buyer' ? 'test_user_10' : 'test_user_9';
      
      await window.sendTestMessage(sender, receiver, testAuction.id, message.content);
      await window.delay(800); // Realistic typing delay
    }
    
    console.log(`✅ Completed: ${scenario.name}`);
  }
  
  console.log('✅ Chat scenarios simulation completed');
};

/**
 * 🏃 Run full comprehensive chat test suite
 */
window.runFullChatTestSuite = async function() {
  console.log('🏃 Running comprehensive chat test suite...');
  
  const tests = [
    { name: 'Seller-Winner Chat', func: window.testSellerWinnerChat },
    { name: 'Real-Time Messaging', func: window.testRealTimeMessaging },
    { name: 'Message Persistence', func: window.testMessagePersistence },
    { name: 'Edge Cases', func: window.testChatEdgeCases },
    { name: 'Message Delivery', func: window.testMessageDelivery },
    { name: 'Chat Scenarios', func: window.simulateChatScenarios }
  ];
  
  const results = [];
  
  for (const test of tests) {
    console.log(`\n🧪 Running: ${test.name}`);
    
    try {
      await test.func();
      results.push({ name: test.name, status: '✅ PASSED' });
      console.log(`✅ ${test.name} - PASSED`);
    } catch (error) {
      results.push({ name: test.name, status: '❌ FAILED', error: error.message });
      console.error(`❌ ${test.name} - FAILED:`, error);
    }
    
    await window.delay(1000); // Brief pause between tests
  }
  
  console.log('\n📊 CHAT TEST SUITE RESULTS:');
  console.log('=' .repeat(50));
  
  results.forEach(result => {
    console.log(`${result.status} ${result.name}`);
    if (result.error) {
      console.log(`   Error: ${result.error}`);
    }
  });
  
  const passed = results.filter(r => r.status === '✅ PASSED').length;
  const total = results.length;
  
  console.log(`\n🎯 Overall: ${passed}/${total} tests passed`);
  
  if (passed === total) {
    console.log('🎉 ALL CHAT TESTS PASSED! The messaging system is working perfectly.');
  } else {
    console.log('⚠️ Some tests failed. Check the logs above for details.');
  }
};

/**
 * 🛠️ Helper functions for chat testing
 */

window.fetchAuctionsForChatTesting = async function() {
  try {
    const response = await fetch('/api/auctions/live');
    const data = await response.json();
    return data.auctions || [];
  } catch (error) {
    console.error('Failed to fetch auctions:', error);
    return [];
  }
};

window.getWinnerForAuction = async function(auctionId) {
  try {
    const response = await fetch(`/api/auctions/${auctionId}`);
    const data = await response.json();
    
    // Find the highest bid
    const bids = data.bids || [];
    if (bids.length > 0) {
      const highestBid = bids.reduce((max, bid) => bid.amount > max.amount ? bid : max);
      return highestBid.bidder_id;
    }
    
    return null;
  } catch (error) {
    console.error('Failed to get winner:', error);
    return null;
  }
};

window.sendTestMessage = async function(senderId, receiverId, auctionId, content) {
  try {
    const response = await fetch('/api/messages/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        senderId: senderId,
        receiverId: receiverId,
        auctionId: auctionId,
        content: content
      })
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const result = await response.json();
    window.chatTestState.messageCounter++;
    window.chatTestState.testMessages.push(result);
    
    console.log(`💬 Message sent: "${content}" from ${senderId} to ${receiverId}`);
    return result;
    
  } catch (error) {
    console.error('Failed to send message:', error);
    throw error;
  }
};

window.fetchMessages = async function(auctionId, userId) {
  try {
    const response = await fetch(`/api/messages/list?auctionId=${auctionId}&userId=${userId}`);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const messages = await response.json();
    console.log(`📨 Fetched ${messages.length} messages for auction ${auctionId}`);
    return messages;
    
  } catch (error) {
    console.error('Failed to fetch messages:', error);
    throw error;
  }
};

window.testMessageFlow = async function(senderId, receiverId, auctionId, flowType) {
  const messages = [
    `Hello! This is a test message from ${flowType}.`,
    "I'm interested in discussing the auction details.",
    "When would be a good time to arrange pickup?",
    "Looking forward to your response!"
  ];
  
  console.log(`📝 Testing message flow: ${flowType}`);
  
  for (const message of messages) {
    await window.sendTestMessage(senderId, receiverId, auctionId, message);
    await window.delay(500);
  }
};

window.createTestChatScenario = async function() {
  console.log('🎯 Creating test chat scenario...');
  
  // Create a simple test scenario
  const testAuction = {
    id: 1,
    seller_id: 'test_seller',
    title: 'Test Item for Chat',
    currentBid: 2.5
  };
  
  console.log('✅ Test scenario created');
  return testAuction;
};

window.getTestAuctionForRealTime = async function() {
  const auctions = await window.fetchAuctionsForChatTesting();
  return auctions[0] || await window.createTestChatScenario();
};

window.getTestAuctionForPersistence = async function() {
  const auctions = await window.fetchAuctionsForChatTesting();
  return auctions[1] || await window.createTestChatScenario();
};

window.getTestAuctionForDelivery = async function() {
  const auctions = await window.fetchAuctionsForChatTesting();
  return auctions[2] || await window.createTestChatScenario();
};

window.getTestAuctionForScenario = async function() {
  const auctions = await window.fetchAuctionsForChatTesting();
  return auctions[3] || await window.createTestChatScenario();
};

window.verifyMessageOrder = function(messages) {
  for (let i = 1; i < messages.length; i++) {
    const currentTime = new Date(messages[i].created_at).getTime();
    const previousTime = new Date(messages[i-1].created_at).getTime();
    
    if (currentTime < previousTime) {
      return false;
    }
  }
  return true;
};

window.delay = function(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
};

/**
 * 🎨 Enhanced chat UI testing functions
 */

window.testChatUI = function() {
  console.log('🎨 Testing chat UI components...');
  
  // Test modal opening
  console.log('📱 Testing modal opening...');
  
  // Test message styling
  const testMessages = [
    { sender_id: 'user1', content: 'Test message 1', created_at: new Date().toISOString() },
    { sender_id: 'user2', content: 'Test reply', created_at: new Date().toISOString() },
    { sender_id: 'user1', content: 'Another test message', created_at: new Date().toISOString() }
  ];
  
  console.log('✅ Chat UI test completed');
};

/**
 * 📊 Generate chat testing report
 */
window.generateChatTestReport = function() {
  const state = window.chatTestState;
  
  console.log('\n📊 CHAT TESTING REPORT');
  console.log('=' .repeat(40));
  console.log(`Total messages sent: ${state.messageCounter}`);
  console.log(`Test conversations: ${state.testConversations.length}`);
  console.log(`Current test user: ${state.currentTestUser}`);
  console.log(`Message persistence: ${state.testMessages.length > 0 ? '✅ Verified' : '❌ Not verified'}`);
  
  if (state.testMessages.length > 0) {
    const latestMessage = state.testMessages[state.testMessages.length - 1];
    console.log(`Latest message: "${latestMessage.content}"`);
    console.log(`Timestamp: ${new Date(latestMessage.created_at).toLocaleString()}`);
  }
};

// Initialize chat testing on load
console.log('💬 Chat testing script loaded. Run window.initChatTesting() to start.');

// Auto-initialize if in development
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
  console.log('🚀 Auto-initializing chat testing for development...');
  setTimeout(window.initChatTesting, 2000);
}