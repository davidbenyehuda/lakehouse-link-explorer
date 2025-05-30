import { OperationsManagerApi, Operation } from '@/types/api';
import { mockOperations } from './MockData'; // Adjusted path if necessary

export class MockOperationsManagerService implements OperationsManagerApi {
  async getActiveOperations(): Promise<{
    operations: Operation[];
  }> {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 50));
    return Promise.resolve({ operations: mockOperations });
  }
}