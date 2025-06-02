import { FilterOptions, OperationType, Table, ArchDetails } from "@/types/api";

// Moved getArchColor outside the component
export const getArchColor = (insertionType: OperationType | string, status?: string): string => {
    if (status === 'failure') return '#000000';
    if (status === 'locked') return '#000000';
    switch (insertionType) {
        case 'insert_stage_0': return '#4361ee';
        case 'insert_stage_1': return '#4cc9f0';
        case 'insert_upsert': return '#7209b7';
        case 'insert_custom': return '#f72585';
        default: return '#aaa';
    }
};

// Define types for layout and positioning
export interface LayoutConfig {
    horizontalSpacing: number;
    verticalSpacing: number;
    startX: number;
    startY: number;
    maxWidth: number;
    maxHeight: number;
}

export interface ContainerSize {
    width: number;
    height: number;
}

export interface PositionedTable extends Table {
    position: { x: number; y: number };
}

// Moved positionTables outside the component
export const positionTables = (
    tablesToPosition: Table[],
    arches: ArchDetails[],
    layoutConfig: LayoutConfig,
    containerSize: ContainerSize
): PositionedTable[] => {
    if (!tablesToPosition || tablesToPosition.length === 0) return [];

    const sourceTables = tablesToPosition.filter(table => !arches.some(arch => arch.target === table.table_id));
    const tableDepths = new Map<string, number>();
    sourceTables.forEach(table => tableDepths.set(table.table_id, 0));

    function calculateDepth(tableId: string): number {
        if (tableDepths.has(tableId)) return tableDepths.get(tableId)!;
        const incomingArches = arches.filter(arch => arch.target === tableId);
        if (incomingArches.length === 0) {
            tableDepths.set(tableId, 0);
            return 0;
        }
        const maxSourceDepth = Math.max(0, ...incomingArches.map(arch => calculateDepth(arch.source)));
        const depth = maxSourceDepth + 1;
        tableDepths.set(tableId, depth);
        return depth;
    }

    tablesToPosition.forEach(table => calculateDepth(table.table_id));
    const maxDepth = Math.max(0, ...Array.from(tableDepths.values()));

    const tablesByDepth = new Map<number, Table[]>();
    tablesToPosition.forEach(table => {
        const depth = tableDepths.get(table.table_id) ?? 0;
        if (!tablesByDepth.has(depth)) tablesByDepth.set(depth, []);
        tablesByDepth.get(depth)!.push(table);
    });

    const positionedTables: PositionedTable[] = tablesToPosition.map(t => ({ ...t, position: { x: 0, y: 0 } } as PositionedTable));

    const availableWidth = containerSize.width * layoutConfig.maxWidth;
    const availableHeight = containerSize.height * layoutConfig.maxHeight;
    const startXPixels = containerSize.width * layoutConfig.startX;
    const startYPixels = containerSize.height * layoutConfig.startY;
    const horizontalGap = maxDepth > 0 ? availableWidth / maxDepth : availableWidth;

    tablesByDepth.forEach((tablesInDepth, depth) => {
        const x = startXPixels + (depth * horizontalGap);
        const numTablesInLevel = tablesInDepth.length;
        const verticalGap = numTablesInLevel > 0 ? availableHeight / (numTablesInLevel + 1) : availableHeight;
        tablesInDepth.forEach((table, index) => {
            const y = startYPixels + ((index + 1) * verticalGap);
            const tableToUpdate = positionedTables.find(t => t.table_id === table.table_id);
            if (tableToUpdate) tableToUpdate.position = { x, y };
        });
    });
    return positionedTables;
};

export interface TableMappings {
    sourceToProject: { [key: string]: string };
    sourceToDataFactory: { [key: string]: string };
    projectToDataFactory: { [key: string]: string };
    labelMappings: {
        datafactories: { [id: string]: string };
        projects: { [id: string]: string };
        sources: { [id: string]: string };
    };
}

export interface TablesGraphProps {
    tables: Table[];
    arches: ArchDetails[];
    tableMappings: TableMappings;
    currentFilters: FilterOptions;
}

export const applyTableFilters = (
    tables: Table[],
    arches: ArchDetails[],
    currentFilters: FilterOptions,
    focusedTable: string | null,
    tableMappings: TableMappings
): Table[] => {
    let filtered = [...tables];

    if (focusedTable) {
        const tableIdToFocus = focusedTable;
        const connectedTableIds = new Set<string>();
        connectedTableIds.add(tableIdToFocus);
        const findConnections = (id: string, direction: 'up' | 'down') => {
            arches.forEach(arch => {
                if (direction === 'up' && arch.target === id && !connectedTableIds.has(arch.source)) {
                    connectedTableIds.add(arch.source);
                    findConnections(arch.source, 'up');
                }
                if (direction === 'down' && arch.source === id && !connectedTableIds.has(arch.target)) {
                    connectedTableIds.add(arch.target);
                    findConnections(arch.target, 'down');
                }
            });
        };
        findConnections(tableIdToFocus, 'up');
        findConnections(tableIdToFocus, 'down');
        filtered = filtered.filter(table => connectedTableIds.has(table.table_id));
    }

    if (currentFilters.datafactory_id && currentFilters.datafactory_id.length > 0) {
        const datafactoryIds = new Set(currentFilters.datafactory_id);
        filtered = filtered.filter(table => table.datafactory_id && datafactoryIds.has(table.datafactory_id));
    }

    if (currentFilters.project_id && currentFilters.project_id.length > 0) {
        const projectIds = new Set(currentFilters.project_id);
        filtered = filtered.filter(table => {
            if (table.is_datafactory_table()) {
                const dataFactoryIds = Array.from(projectIds).map(projectId => tableMappings.projectToDataFactory[projectId]);
                return dataFactoryIds.includes(table.datafactory_id);
            }
            return table.project_id && projectIds.has(table.project_id);
        });
    }

    if (currentFilters.locked !== undefined) {
        filtered = filtered.filter(table => table.locked === currentFilters.locked);
    }
    return filtered;
};

export const applyArchFilters = (
    arches: ArchDetails[],
    filteredTables: Table[],
    currentFilters: FilterOptions
): string[] => {
    const tableSourceIds = new Set(filteredTables.map(t => t.table_id));
    let filtered = arches.filter(arch => tableSourceIds.has(arch.source) && tableSourceIds.has(arch.target));

    if (currentFilters.archStatus && currentFilters.archStatus.length > 0) {
        filtered = filtered.filter(arch => currentFilters.archStatus!.includes(arch.status || 'empty'));
    }

    if (currentFilters.params_type && currentFilters.params_type.length > 0) {
        filtered = filtered.filter(arch => {
            const latestEvent = arch.events?.[0];
            return latestEvent && currentFilters.params_type!.includes(latestEvent.params_type);
        });
    }
    return filtered.map(arch => arch.get_id());
};
