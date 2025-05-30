import { OperationsManagerApi } from '@/types/api';

export class RealOperationsManagerService implements OperationsManagerApi {
  private baseUrl = import.meta.env.VITE_OPERATIONS_API_URL || 'http://localhost:3002/api';

  async getActiveOperations() {
    const response = await fetch(`${this.baseUrl}/active`);
    return response.json();
  }
} 