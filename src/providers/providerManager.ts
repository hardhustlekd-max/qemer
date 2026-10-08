import { APIProvider } from './types.js';
import { FlashscoreProvider } from './flashscoreProvider.js';
import { EspnProvider } from './espnProvider.js';
import { FootballDataCoUkProvider } from './footballDataCoUk.js';
import { BigBallsDataProvider } from './bigBallsData.js';
import { FootballDataOrgProvider } from './footballDataOrg.js';
import { ApiFootballProvider } from './apiFootball.js';
import { EngineSettings, ProviderStatus } from '../core/types.js';
import { db } from '../core/db.js';

export class ProviderManager {
  private providers: Map<string, APIProvider> = new Map();
  private activeProviderId: EngineSettings['activeProvider'] = 'FLASHSCORE';

  constructor() {
    this.registerProvider(new FlashscoreProvider());
    this.registerProvider(new EspnProvider());
    this.registerProvider(new FootballDataCoUkProvider());
    this.registerProvider(new BigBallsDataProvider());
    this.registerProvider(new FootballDataOrgProvider());
    this.registerProvider(new ApiFootballProvider());
  }

  registerProvider(provider: APIProvider): void {
    this.providers.set(provider.id, provider);
  }

  getActiveProvider(): APIProvider {
    // Check if env has an override
    const envProvider = process.env.ACTIVE_FOOTBALL_PROVIDER as EngineSettings['activeProvider'];
    const currentId = envProvider || this.activeProviderId;

    const provider = this.providers.get(currentId);
    if (provider) return provider;

    // Fallback to Flashscore default
    return this.providers.get('FLASHSCORE') || this.providers.get('ESPN') || this.providers.get('FOOTBALL_DATA_CO_UK')!;
  }

  setActiveProvider(providerId: EngineSettings['activeProvider']): boolean {
    if (this.providers.has(providerId)) {
      this.activeProviderId = providerId;
      const settings = db.getSettings();
      if (settings) {
        settings.activeProvider = providerId;
        db.saveSettings(settings);
      }
      return true;
    }
    return false;
  }

  getAllProvidersStatus(): ProviderStatus[] {
    const list: ProviderStatus[] = [];
    const latencies: Record<string, number> = {
      FLASHSCORE: 14, // Direct Flashscore live scraper
      ESPN: 12,
      FOOTBALL_DATA_CO_UK: 4, // local SQLite/CSV
      BIG_BALLS_DATA: 18,
      FOOTBALL_DATA_ORG: 42,
      API_FOOTBALL: 55,
    };

    for (const p of this.providers.values()) {
      list.push({
        id: p.id,
        name: p.name,
        type: p.type,
        status: 'ONLINE',
        latencyMs: latencies[p.id] || 25,
        description: p.description,
        features: p.features,
      });
    }

    return list;
  }
}

export const providerManager = new ProviderManager();
