import { useState, useCallback, useMemo } from 'react';
import { Table, ArchDetails, OperationStatus, Operation, AggregatedEvent, OperationType, FilterOptions, TableSearch, MetaDataApi, TrinoApi, OperationsManagerApi } from '@/types/api';
import { ServiceFactory } from '@/services/ServiceFactory';
import { useToast } from '@/hooks/use-toast';

interface TableMappings {
    sourceToProject: { [key: string]: string };
    sourceToDataFactory: { [key: string]: string };
    projectToDataFactory: { [key: string]: string };
    labelMappings: {
        datafactories: { [id: string]: string };
        projects: { [id: string]: string };
        sources: { [id: string]: string };
        table_names: { [id: string]: string };
    };
}

interface UseLakehouseDataReturn {
    tables: Table[];
    arches: ArchDetails[];
    tableMappings: TableMappings;
    isLoading: boolean;
    error: Error | null;
    fetchData: (filters: FilterOptions) => Promise<void>;
    setTables: React.Dispatch<React.SetStateAction<Table[]>>;
    setArches: React.Dispatch<React.SetStateAction<ArchDetails[]>>;
    dataFactories: string[];
    projects: string[];
}

const metaDataService: MetaDataApi = ServiceFactory.createMetaDataService();
const operationsManagerService: OperationsManagerApi = ServiceFactory.createOperationsManagerService();
const trinoService: TrinoApi = ServiceFactory.createTrinoService();

export const useLakehouseData = (): UseLakehouseDataReturn => {
    const [tables, setTables] = useState<Table[]>([]);
    const [arches, setArches] = useState<ArchDetails[]>([]);
    const [tableMappings, setTableMappings] = useState<TableMappings>({
        sourceToProject: {},
        sourceToDataFactory: {},
        projectToDataFactory: {},
        labelMappings: {
            datafactories: {},
            projects: {},
            sources: {},
            table_names: {},
        },
    });
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);
    const { toast } = useToast();

    const dataFactories = useMemo(() => {
        return Array.from(new Set(tables.map(table => table.datafactory_id).filter(id => id)));
    }, [tables]);

    const projects = useMemo(() => { // Get all projects that are not registered as data factories
        return Array.from(new Set(tables.map(table => table.project_id).filter(id => id).filter(id => !dataFactories.includes(id))));
    }, [tables]);

    const generateArchesFromData = useCallback((operations: Operation[], apiEvents: AggregatedEvent[], datafactoryData: any): ArchDetails[] => {
        const archesFromOperations = operations.filter(op =>
            ['insert_stage_1', 'insert_upsert', 'insert_custom'].includes(op.operation_type))
            .map(op => {
                return {
                    source_table_source_id: op.source_table_id,
                    sink_table_source_id: op.sink_table_id,
                    source: ['insert_stage_1'].includes(op.operation_type) ? 'stage_0.' + op.source_table_id : op.source_table_id,
                    target: op.sink_table_id,
                    insertion_type: op.operation_type as OperationType,
                    status: ["hold", "failure"].includes(op.status) ? op.status as OperationStatus : op.status as OperationStatus,
                }
            }
            );
        const archesFromEvents = apiEvents.filter(op =>
            ['insert_stage_0', 'insert_stage_1', 'insert_upsert', 'insert_custom'].includes(op.operation_type))
            .map(event => {
                if (event.operation_type == 'insert_stage_0') {
                    return {
                        source_table_source_id: event.source_table_id,
                        sink_table_source_id: event.sink_table_id,
                        source: datafactoryData[event.source_table_id]?.datafactory_id || '',
                        target: 'stage_0.' + event.source_table_id,
                        insertion_type: event.operation_type as OperationType,
                        status: 'empty' as OperationStatus,
                    }
                }
                if (event.operation_type == 'insert_stage_1') {
                    return {
                        source_table_source_id: event.source_table_id,
                        sink_table_source_id: event.sink_table_id,
                        source: 'stage_0.' + event.source_table_id,
                        target: event.sink_table_id,
                        insertion_type: event.operation_type as OperationType,
                        status: 'empty' as OperationStatus,
                    }
                }
                else {
                    return {
                        source_table_source_id: event.source_table_id,
                        sink_table_source_id: event.sink_table_id,
                        source: event.source_table_id,
                        target: event.sink_table_id,
                        insertion_type: event.operation_type as OperationType,
                        status: 'pending' as OperationStatus,
                    }
                }
            });

        const uniqueArches = new Map<string, ArchDetails>();

        archesFromOperations.forEach(arch => {
            const key = `${arch.source}-${arch.target}-${arch.insertion_type}`;
            if (!uniqueArches.has(key) || arch.status !== 'empty') {
                uniqueArches.set(key, new ArchDetails(
                    arch.source_table_source_id,
                    arch.sink_table_source_id,
                    arch.source,
                    arch.target,
                    arch.insertion_type,
                    arch.status
                ));
            }
        });

        archesFromEvents.forEach(arch => {
            const key = `${arch.source}-${arch.target}-${arch.insertion_type}`;
            if (!uniqueArches.has(key) || arch.status !== 'empty') {
                uniqueArches.set(key, new ArchDetails(
                    arch.source_table_source_id,
                    arch.sink_table_source_id,
                    arch.source,
                    arch.target,
                    arch.insertion_type,
                    arch.status
                ));
            }
        });

        return Array.from(uniqueArches.values());
    }, []);

    const fetchData = useCallback(async (passedInFilters: FilterOptions) => {
        console.log("Fetching data with filters:", passedInFilters);
        setIsLoading(true);
        setError(null);
        try {
            const operationsResponse = await operationsManagerService.getActiveOperations();

            const apiFilters: FilterOptions = { ...passedInFilters };

            const search: TableSearch = { searchTerm: '', searchFields: [] };
            const events = await trinoService.getEventsAggregation(apiFilters, search);
            const labelMappingsData = await metaDataService.getLabelMappings();

            const fetchedOperations = operationsResponse.operations;
            const fetchedEvents = events;

            const tableIds = new Set<string>();
            fetchedOperations.forEach(op => {
                if (op.source_table_id) tableIds.add(op.source_table_id);
                if (op.sink_table_id) tableIds.add(op.sink_table_id);
            });
            fetchedEvents.forEach(event => {
                if (event.source_table_id) tableIds.add(event.source_table_id);
                if (event.sink_table_id) tableIds.add(event.sink_table_id);
            });

            const tableIdsArray = Array.from(tableIds).filter(id => id);

            let projectData: { [key: string]: { project_id: string } } = {};
            let datafactoryData: { [key: string]: { datafactory_id: string } } = {};
            if (tableIdsArray.length > 0) {
                projectData = await metaDataService.getProjectIDs(tableIdsArray);
                datafactoryData = await metaDataService.getDatafactoryIDs(tableIdsArray);
            }

            const sourceToProject: { [key: string]: string } = {};
            const sourceToDataFactory: { [key: string]: string } = {};
            const projectToDataFactory: { [key: string]: string } = {};

            tableIdsArray.forEach(source_id => {
                const projId = projectData[source_id]?.project_id;
                const dfId = datafactoryData[source_id]?.datafactory_id;
                if (projId) {
                    sourceToProject[source_id] = projId;
                    if (dfId) projectToDataFactory[projId] = dfId;
                }
                if (dfId) sourceToDataFactory[source_id] = dfId;
            });

            setTableMappings({
                sourceToProject,
                sourceToDataFactory,
                projectToDataFactory,
                labelMappings: labelMappingsData,
            });

            const fetchedTables: Table[] = tableIdsArray.map(source_id => {
                const sinkEvents = fetchedEvents.filter(event =>
                    event.sink_table_id === source_id && event.operation_type !== 'insert_stage_0'
                );
                const locked = fetchedOperations.some(op =>
                    op.sink_table_id === source_id && op.source_table_id === source_id && op.operation_type === 'wait'
                );
                const totalRows = sinkEvents.reduce((sum, event) => sum + event.total_rows, 0);
                const last_updated_val = sinkEvents.reduce((max_date: Date | null, event) => {
                    const eventDate = event.last_updated instanceof Date ? event.last_updated : new Date(event.last_updated);
                    return max_date === null || eventDate > max_date ? eventDate : max_date;
                }, null);

                const totalSize = sinkEvents.reduce((sum, event) => sum + event.total_size, 0);

                return new Table(
                    source_id,
                    source_id,
                    labelMappingsData.sources[source_id] || source_id,
                    datafactoryData[source_id]?.datafactory_id || '',
                    labelMappingsData.datafactories[datafactoryData[source_id]?.datafactory_id] || '',
                    projectData[source_id]?.project_id || '',
                    labelMappingsData.projects[projectData[source_id]?.project_id] || '',
                    labelMappingsData.table_names[source_id] || source_id,
                    totalRows,
                    Math.round(totalSize / (1024 * 1024)),
                    last_updated_val || new Date(0),
                    [], undefined, 0, undefined, undefined, undefined, locked
                );
            });

            const generatedArches = generateArchesFromData(fetchedOperations, fetchedEvents, datafactoryData);

            const stage0tables: Table[] = fetchedEvents.filter(event =>
                event.operation_type === 'insert_stage_0' && event.source_table_id
            ).map(event => {
                return new Table(
                    "stage_0." + event.source_table_id,
                    event.source_table_id,
                    "stage_0." + (labelMappingsData.sources[event.source_table_id] || event.source_table_id),
                    datafactoryData[event.source_table_id]?.datafactory_id || '',
                    labelMappingsData.datafactories[datafactoryData[event.source_table_id]?.datafactory_id] || '',
                    projectData[event.source_table_id]?.project_id || '',
                    labelMappingsData.projects[projectData[event.source_table_id]?.project_id] || '',
                    "stage_0." + (labelMappingsData.table_names[event.source_table_id] || event.source_table_id),
                    event.total_rows,
                    Math.round(event.total_size / (1024 * 1024)),
                    event.last_updated ? new Date(event.last_updated) : new Date(0),
                    [], undefined, 0, undefined, undefined, undefined, false
                );
            });

            const df_ids = new Set(stage0tables.map(t => t.datafactory_id).filter(id => id));
            const DataFactoryTables: Table[] = Array.from(df_ids).map(df_id => {
                return Table.fromBasicInfo(
                    df_id, df_id, labelMappingsData.datafactories[df_id] || df_id,
                    df_id, labelMappingsData.datafactories[df_id] || df_id,
                    df_id, labelMappingsData.datafactories[df_id] || df_id,
                    labelMappingsData.datafactories[df_id] || df_id,
                )
            })

            setTables([...DataFactoryTables, ...stage0tables, ...fetchedTables]);
            setArches(generatedArches);

            toast({
                title: "Data Loaded",
                description: "Displaying data based on current filters."
            });
            console.log("Data loaded successfully, tables:", fetchedTables.length + stage0tables.length + DataFactoryTables.length, "arches:", generatedArches.length);

        } catch (err) {
            console.error("Error loading data:", err);
            setError(err as Error);
            setTables([]);
            setArches([]);
            toast({
                title: "Error Loading Data",
                description: (err as Error).message || "There was an issue loading data.",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    }, [toast, generateArchesFromData]);

    return { tables, arches, tableMappings, isLoading, error, fetchData, setTables, setArches, dataFactories, projects };
}; 