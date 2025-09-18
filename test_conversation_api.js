// Simple test script to verify conversation API endpoints
const testConversationAPI = async () => {
  const baseUrl = 'http://localhost:3000';
  
  // Test data
  const testAgentId = 'test-agent-id';
  const testConversation = {
    title: 'Test Conversation'
  };
  
  const testMessage = {
    role: 'USER',
    content: 'What is machine learning?',
    sources: [{ file_name: 'ml_doc.pdf', page_number: 1, similarity_score: 0.95 }],
    metadata: { context_used: true, context_chunks_count: 3 }
  };

  try {
    console.log('Testing Conversation API...');
    
    // Test 1: Create conversation
    console.log('\n1. Testing conversation creation...');
    const createResponse = await fetch(`${baseUrl}/api/agents/${testAgentId}/conversations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testConversation)
    });
    
    if (createResponse.ok) {
      const createData = await createResponse.json();
      console.log('✅ Conversation created:', createData.conversation.id);
      
      const conversationId = createData.conversation.id;
      
      // Test 2: Add message to conversation
      console.log('\n2. Testing message creation...');
      const messageResponse = await fetch(`${baseUrl}/api/agents/${testAgentId}/conversations/${conversationId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testMessage)
      });
      
      if (messageResponse.ok) {
        const messageData = await messageResponse.json();
        console.log('✅ Message created:', messageData.message.id);
        
        // Test 3: Get conversation messages
        console.log('\n3. Testing message retrieval...');
        const getMessagesResponse = await fetch(`${baseUrl}/api/agents/${testAgentId}/conversations/${conversationId}/messages`);
        
        if (getMessagesResponse.ok) {
          const messagesData = await getMessagesResponse.json();
          console.log('✅ Messages retrieved:', messagesData.messages.length, 'messages');
          
          // Test 4: Get all conversations
          console.log('\n4. Testing conversation list...');
          const getConversationsResponse = await fetch(`${baseUrl}/api/agents/${testAgentId}/conversations`);
          
          if (getConversationsResponse.ok) {
            const conversationsData = await getConversationsResponse.json();
            console.log('✅ Conversations retrieved:', conversationsData.conversations.length, 'conversations');
            
            console.log('\n🎉 All API tests passed!');
          } else {
            console.log('❌ Failed to get conversations:', await getConversationsResponse.text());
          }
        } else {
          console.log('❌ Failed to get messages:', await getMessagesResponse.text());
        }
      } else {
        console.log('❌ Failed to create message:', await messageResponse.text());
      }
    } else {
      console.log('❌ Failed to create conversation:', await createResponse.text());
    }
    
  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
  }
};

// Run the test
testConversationAPI();
