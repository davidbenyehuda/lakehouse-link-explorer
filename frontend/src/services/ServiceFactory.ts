import { MetaDataApi, TrinoApi, OperationsManagerApi } from '@/types/api';
import { MockMetaDataService } from './mock/MockMetaDataService';
import { MockTrinoService } from './mock/MockTrinoService';
import { MockOperationsManagerService } from './mock/MockOperationsManagerService';
import { RealMetaDataService } from './real/RealMetaDataService';
import { RealTrinoService } from './real/RealTrinoService';
import { RealOperationsManagerService } from './real/RealOperationsManagerService';

export class ServiceFactory {
  static createMetaDataService(): MetaDataApi {
    return import.meta.env.VITE_USE_MOCK_SERVICES === 'true'
      ? new MockMetaDataService()
      : new RealMetaDataService();
  }

  static createTrinoService(): TrinoApi {
    return import.meta.env.VITE_USE_MOCK_SERVICES === 'true'
      ? new MockTrinoService()
      : new RealTrinoService();
  }

  static createOperationsManagerService(): OperationsManagerApi {
    return import.meta.env.VITE_USE_MOCK_SERVICES === 'true'
      ? new MockOperationsManagerService()
      : new RealOperationsManagerService();
  }
} 