import admin from 'firebase-admin';

admin.initializeApp({
  projectId: 'gen-lang-client-0542481418',
});

const db = admin.firestore();
db.settings({
  databaseId: 'ai-studio-2a72fa6c-ff03-48c4-a569-3648cdeda93c'
});

async function testFirestore() {
  try {
    await db.collection('test').doc('ping').set({ ts: Date.now() });
    const doc = await db.collection('test').doc('ping').get();
    console.log('Doc written and read:', doc.data());
  } catch (err) {
    console.error('Firestore err:', err);
  }
}
testFirestore();
