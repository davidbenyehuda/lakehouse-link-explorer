import { OperationsManagerApi } from '@/types/api';
import mockOperations from '../../mockData/operations.json';

export class MockOperationsManagerService implements OperationsManagerApi {
  async getActiveOperations() {
    return {
      operations: mockOperations.operations.map(op => ({
        source_table_id: op.source_table_id,
        sink_table_id: op.sink_table_id,
        datafactory_id: op.datafactory_id,
        operation_type: op.operation_type,
        is_running: op.is_running,
        status: op.status as "pending" | "in_progress" | "failure" | "hold",
        params_type: op.params_type as "batches" | "time_range"
      }))
    };
  }
} 