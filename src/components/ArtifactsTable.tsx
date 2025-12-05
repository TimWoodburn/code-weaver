import { useState, useMemo } from 'react';
import { ArrowUpDown, ArrowUp, ArrowDown, Filter, X } from 'lucide-react';
import { Artifact } from '@/types/config';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

interface ArtifactsTableProps {
  artifacts: Artifact[];
}

type SortField = 'name' | 'tier' | 'type' | 'modules' | 'lines' | 'dependencies';
type SortDirection = 'asc' | 'desc';

interface Filters {
  name: string;
  tier: string;
  type: string;
}

export function ArtifactsTable({ artifacts }: ArtifactsTableProps) {
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [filters, setFilters] = useState<Filters>({ name: '', tier: 'all', type: 'all' });

  const tiers = useMemo(() => [...new Set(artifacts.map(a => a.tier))], [artifacts]);
  const types = useMemo(() => [...new Set(artifacts.map(a => a.type))], [artifacts]);

  const filteredAndSortedArtifacts = useMemo(() => {
    let result = [...artifacts];

    // Apply filters
    if (filters.name) {
      result = result.filter(a => 
        a.name.toLowerCase().includes(filters.name.toLowerCase()) ||
        a.path.toLowerCase().includes(filters.name.toLowerCase())
      );
    }
    if (filters.tier !== 'all') {
      result = result.filter(a => a.tier === filters.tier);
    }
    if (filters.type !== 'all') {
      result = result.filter(a => a.type === filters.type);
    }

    // Apply sorting
    result.sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'tier':
          comparison = a.tier.localeCompare(b.tier);
          break;
        case 'type':
          comparison = a.type.localeCompare(b.type);
          break;
        case 'modules':
          comparison = a.modules.length - b.modules.length;
          break;
        case 'lines':
          const aLines = a.modules.reduce((sum, m) => sum + m.linesOfCode, 0);
          const bLines = b.modules.reduce((sum, m) => sum + m.linesOfCode, 0);
          comparison = aLines - bLines;
          break;
        case 'dependencies':
          comparison = a.dependencies.length - b.dependencies.length;
          break;
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [artifacts, filters, sortField, sortDirection]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown className="w-4 h-4 ml-1 opacity-50" />;
    return sortDirection === 'asc' 
      ? <ArrowUp className="w-4 h-4 ml-1" />
      : <ArrowDown className="w-4 h-4 ml-1" />;
  };

  const clearFilters = () => {
    setFilters({ name: '', tier: 'all', type: 'all' });
  };

  const hasActiveFilters = filters.name || filters.tier !== 'all' || filters.type !== 'all';

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center p-4 bg-card border border-border rounded-lg">
        <Filter className="w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search name or path..."
          value={filters.name}
          onChange={(e) => setFilters({ ...filters, name: e.target.value })}
          className="w-48"
        />
        <Select value={filters.tier} onValueChange={(v) => setFilters({ ...filters, tier: v })}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Tier" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Tiers</SelectItem>
            {tiers.map(tier => (
              <SelectItem key={tier} value={tier}>{tier}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filters.type} onValueChange={(v) => setFilters({ ...filters, type: v })}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {types.map(type => (
              <SelectItem key={type} value={type}>{type}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            <X className="w-4 h-4 mr-1" />
            Clear
          </Button>
        )}
        <span className="ml-auto text-sm text-muted-foreground">
          {filteredAndSortedArtifacts.length} of {artifacts.length} artifacts
        </span>
      </div>

      {/* Table */}
      <div className="border border-border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>
                <Button variant="ghost" size="sm" onClick={() => handleSort('name')} className="font-semibold">
                  Name <SortIcon field="name" />
                </Button>
              </TableHead>
              <TableHead>
                <Button variant="ghost" size="sm" onClick={() => handleSort('tier')} className="font-semibold">
                  Tier <SortIcon field="tier" />
                </Button>
              </TableHead>
              <TableHead>
                <Button variant="ghost" size="sm" onClick={() => handleSort('type')} className="font-semibold">
                  Type <SortIcon field="type" />
                </Button>
              </TableHead>
              <TableHead>Path</TableHead>
              <TableHead>
                <Button variant="ghost" size="sm" onClick={() => handleSort('modules')} className="font-semibold">
                  Modules <SortIcon field="modules" />
                </Button>
              </TableHead>
              <TableHead>
                <Button variant="ghost" size="sm" onClick={() => handleSort('lines')} className="font-semibold">
                  Lines <SortIcon field="lines" />
                </Button>
              </TableHead>
              <TableHead>
                <Button variant="ghost" size="sm" onClick={() => handleSort('dependencies')} className="font-semibold">
                  Deps <SortIcon field="dependencies" />
                </Button>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAndSortedArtifacts.map((artifact) => {
              const totalLines = artifact.modules.reduce((sum, m) => sum + m.linesOfCode, 0);
              return (
                <TableRow key={artifact.id}>
                  <TableCell className="font-medium">{artifact.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize">{artifact.tier}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={artifact.type === 'executable' ? 'default' : 'secondary'}>
                      {artifact.type}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground font-mono text-xs">{artifact.path}</TableCell>
                  <TableCell>{artifact.modules.length}</TableCell>
                  <TableCell>{totalLines.toLocaleString()}</TableCell>
                  <TableCell>{artifact.dependencies.length}</TableCell>
                </TableRow>
              );
            })}
            {filteredAndSortedArtifacts.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                  No artifacts match the current filters
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
