import admin from 'firebase-admin';

admin.initializeApp({
  projectId: 'gen-lang-client-0542481418',
});

async function testToken() {
  try {
    const token = await admin.auth().createCustomToken('test_uid');
    console.log('Token created:', token.substring(0, 20) + '...');
  } catch (error) {
    console.error('Error creating token:', error);
  }
}
testToken();
