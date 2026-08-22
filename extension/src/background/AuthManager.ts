import { extensionStorage } from '../shared/storage';
import { UserAuthInfo } from '../shared/types';

export class AuthManager {
  static async getCurrentUser(): Promise<UserAuthInfo | null> {
    return await extensionStorage.getAuthInfo();
  }

  static async saveAuth(token: string, user: { id: string; email: string; full_name?: string }) {
    const authInfo: UserAuthInfo = {
      token,
      userId: user.id,
      email: user.email,
      fullName: user.full_name || 'Pengguna Concentra',
    };
    await extensionStorage.setAuthInfo(authInfo);
    return authInfo;
  }

  static async clearAuth() {
    await extensionStorage.clearAuthInfo();
  }

  static async ensureDefaultDevAuth(): Promise<UserAuthInfo> {
    let auth = await this.getCurrentUser();
    if (!auth || !auth.token) {
      auth = {
        token: 'dev_local_token_offline',
        userId: 'dev-user-001',
        email: 'dev@concentra.local',
        fullName: 'Mahasiswa Dev (Extension)',
      };
      await extensionStorage.setAuthInfo(auth);
    }
    return auth;
  }
}
