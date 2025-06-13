// firebase.d.ts
import { Auth } from 'firebase/auth';
import { Firestore } from 'firebase/firestore';

declare module './firebase' { // パスは実際のfirebase.jsの場所に合わせて調整
  export const auth: Auth;
  export const db: Firestore;
  // 他にfirebase.jsからエクスポートされているものがあればここに追加
}
