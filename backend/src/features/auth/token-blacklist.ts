/**
 * Token blacklist - Logout edilen token'ları tutar
 * Production'da Redis kullanılmalı, şimdilik memory'de tutuyoruz
 */

class TokenBlacklist {
  private blacklistedTokens: Set<string> = new Set();
  private tokenExpiryTimes: Map<string, number> = new Map();

  /**
   * Token'ı blacklist'e ekler
   * Expire süresine göre otomatik temizlenir
   */
  addToken(token: string, expiresInMs: number): void {
    this.blacklistedTokens.add(token);
    const expiryTime = Date.now() + expiresInMs;
    this.tokenExpiryTimes.set(token, expiryTime);

    // Expire olan token'ları temizle
    this.cleanExpiredTokens();
  }

  /**
   * Token'ın blacklist'te olup olmadığını kontrol eder
   */
  isBlacklisted(token: string): boolean {
    this.cleanExpiredTokens();
    return this.blacklistedTokens.has(token);
  }

  /**
   * Expire olan token'ları temizler
   */
  private cleanExpiredTokens(): void {
    const now = Date.now();
    for (const [token, expiryTime] of this.tokenExpiryTimes.entries()) {
      if (expiryTime < now) {
        this.blacklistedTokens.delete(token);
        this.tokenExpiryTimes.delete(token);
      }
    }
  }

  /**
   * Tüm blacklist'i temizler (test için)
   */
  clear(): void {
    this.blacklistedTokens.clear();
    this.tokenExpiryTimes.clear();
  }
}

export const tokenBlacklist = new TokenBlacklist();
