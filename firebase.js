// Firebase モック
// 実際のFirebase接続は行わず、デモ用のモックを提供します

export const auth = {
  createUserWithEmailAndPassword: (email, password) => {
    return Promise.resolve({ user: { uid: 'demo-user-id', email } });
  },
  signInWithEmailAndPassword: (email, password) => {
    return Promise.resolve({ user: { uid: 'demo-user-id', email } });
  },
  signOut: () => {
    return Promise.resolve();
  },
  sendPasswordResetEmail: (email) => {
    return Promise.resolve();
  },
  currentUser: {
    uid: 'demo-user-id',
    email: 'demo@example.com'
  }
};

export const firestore = {
  collection: (name) => ({
    doc: (id) => ({
      get: () => Promise.resolve({
        exists: true,
        data: () => ({ name: 'Demo User', email: 'demo@example.com' })
      }),
      set: (data) => Promise.resolve(),
      update: (data) => Promise.resolve(),
      delete: () => Promise.resolve()
    }),
    add: (data) => Promise.resolve({ id: 'demo-doc-id' }),
    where: () => ({
      get: () => Promise.resolve({
        docs: [
          {
            id: 'demo-doc-id',
            data: () => ({ name: 'Demo User', email: 'demo@example.com' })
          }
        ]
      })
    })
  })
};

export default {
  auth,
  firestore
};
