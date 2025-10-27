'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  Network,
  Plus,
  Edit,
  Trash2,
  Search,
  Filter,
  Maximize,
  RefreshCw,
  GitBranch,
  Users,
  Building,
  FileText,
  Sparkles,
  AlertTriangle,
  Info
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';

interface Entity {
  id: string;
  entity_code: string;
  entity_name: string;
  entity_type: string;
  smart_code: string;
  created_at: string;
}

interface Relationship {
  id: string;
  from_entity_id: string;
  to_entity_id: string;
  relationship_type: string;
  relationship_data: Record<string, any>;
  effective_date: string;
  expiration_date?: string;
  created_at: string;
  created_by: string;
  smart_code: string;
}

interface GraphNode {
  id: string;
  label: string;
  type: string;
  x: number;
  y: number;
  entity: Entity;
  connections: string[];
}

interface GraphEdge {
  id: string;
  from: string;
  to: string;
  type: string;
  label: string;
  relationship: Relationship;
}

interface RelationshipManagerProps {
  entityId?: string;
  moduleCode: string;
  onRelationshipChange?: (relationships: Relationship[]) => void;
}

const RELATIONSHIP_TYPES = [
  { value: 'PARENT_OF', label: 'Parent Of', description: 'Hierarchical parent relationship', icon: GitBranch },
  { value: 'CHILD_OF', label: 'Child Of', description: 'Hierarchical child relationship', icon: GitBranch },
  { value: 'MEMBER_OF', label: 'Member Of', description: 'Membership relationship', icon: Users },
  { value: 'OWNS', label: 'Owns', description: 'Ownership relationship', icon: Building },
  { value: 'MAPS_TO', label: 'Maps To', description: 'Mapping relationship', icon: Network },
  { value: 'DEPENDS_ON', label: 'Depends On', description: 'Dependency relationship', icon: AlertTriangle },
  { value: 'REFERENCES', label: 'References', description: 'Reference relationship', icon: FileText },
  { value: 'ASSIGNED_TO', label: 'Assigned To', description: 'Assignment relationship', icon: Users }
];

export default function UniversalRelationshipManager({
  entityId,
  moduleCode,
  onRelationshipChange
}: RelationshipManagerProps) {
  const [entities, setEntities] = useState<Entity[]>([]);
  const [relationships, setRelationships] = useState<Relationship[]>([]);
  const [graphNodes, setGraphNodes] = useState<GraphNode[]>([]);
  const [graphEdges, setGraphEdges] = useState<GraphEdge[]>([]);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [selectedEdge, setSelectedEdge] = useState<string | null>(null);
  const [isCreatingRelationship, setIsCreatingRelationship] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('');
  const [viewMode, setViewMode] = useState<'graph' | 'list'>('graph');
  const [isLoading, setIsLoading] = useState(false);

  // New relationship form state
  const [newRelationship, setNewRelationship] = useState({
    from_entity_id: entityId || '',
    to_entity_id: '',
    relationship_type: '',
    relationship_data: {},
    effective_date: new Date().toISOString().split('T')[0],
    expiration_date: '',
    description: ''
  });

  useEffect(() => {
    loadEntities();
    if (entityId) {
      loadRelationships(entityId);
    }
  }, [entityId]);

  useEffect(() => {
    buildGraph();
  }, [entities, relationships]);

  const loadEntities = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/v2/entities', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('hera_token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setEntities(data.entities || []);
      }
    } catch (error) {
      console.error('Error loading entities:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadRelationships = async (entityId: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/v2/relationships?entity_id=${entityId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('hera_token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setRelationships(data.relationships || []);
        if (onRelationshipChange) {
          onRelationshipChange(data.relationships || []);
        }
      }
    } catch (error) {
      console.error('Error loading relationships:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const buildGraph = useCallback(() => {
    const nodes: GraphNode[] = [];
    const edges: GraphEdge[] = [];
    const nodeMap = new Map<string, GraphNode>();

    // Create nodes for entities
    entities.forEach((entity, index) => {
      const angle = (index / entities.length) * 2 * Math.PI;
      const radius = 200;
      const x = 400 + radius * Math.cos(angle);
      const y = 300 + radius * Math.sin(angle);

      const node: GraphNode = {
        id: entity.id,
        label: entity.entity_name,
        type: entity.entity_type,
        x,
        y,
        entity,
        connections: []
      };

      nodes.push(node);
      nodeMap.set(entity.id, node);
    });

    // Create edges for relationships
    relationships.forEach((relationship) => {
      const fromNode = nodeMap.get(relationship.from_entity_id);
      const toNode = nodeMap.get(relationship.to_entity_id);

      if (fromNode && toNode) {
        fromNode.connections.push(toNode.id);
        toNode.connections.push(fromNode.id);

        const edge: GraphEdge = {
          id: relationship.id,
          from: relationship.from_entity_id,
          to: relationship.to_entity_id,
          type: relationship.relationship_type,
          label: relationship.relationship_type.replace('_', ' '),
          relationship
        };

        edges.push(edge);
      }
    });

    setGraphNodes(nodes);
    setGraphEdges(edges);
  }, [entities, relationships]);

  const createRelationship = async () => {
    if (!newRelationship.from_entity_id || !newRelationship.to_entity_id || !newRelationship.relationship_type) {
      return;
    }

    setIsLoading(true);
    try {
      const relationshipData: Partial<Relationship> = {
        from_entity_id: newRelationship.from_entity_id,
        to_entity_id: newRelationship.to_entity_id,
        relationship_type: newRelationship.relationship_type,
        relationship_data: {
          description: newRelationship.description,
          ...newRelationship.relationship_data
        },
        effective_date: newRelationship.effective_date,
        expiration_date: newRelationship.expiration_date || undefined,
        smart_code: `HERA.${moduleCode.toUpperCase()}.RELATIONSHIP.${newRelationship.relationship_type}.v1`
      };

      const response = await fetch('/api/v2/relationships', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('hera_token')}`
        },
        body: JSON.stringify({
          command: 'create_relationship',
          payload: relationshipData
        })
      });

      if (response.ok) {
        const result = await response.json();
        setRelationships(prev => [...prev, result.relationship]);
        setIsCreatingRelationship(false);
        setNewRelationship({
          from_entity_id: entityId || '',
          to_entity_id: '',
          relationship_type: '',
          relationship_data: {},
          effective_date: new Date().toISOString().split('T')[0],
          expiration_date: '',
          description: ''
        });

        if (onRelationshipChange) {
          onRelationshipChange([...relationships, result.relationship]);
        }
      }
    } catch (error) {
      console.error('Error creating relationship:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const deleteRelationship = async (relationshipId: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/v2/relationships/${relationshipId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('hera_token')}`
        }
      });

      if (response.ok) {
        const updatedRelationships = relationships.filter(r => r.id !== relationshipId);
        setRelationships(updatedRelationships);
        if (onRelationshipChange) {
          onRelationshipChange(updatedRelationships);
        }
      }
    } catch (error) {
      console.error('Error deleting relationship:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getEntityTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'customer':
      case 'user':
        return <Users className="h-4 w-4" />;
      case 'organization':
      case 'company':
        return <Building className="h-4 w-4" />;
      case 'document':
      case 'contract':
        return <FileText className="h-4 w-4" />;
      default:
        return <Network className="h-4 w-4" />;
    }
  };

  const getRelationshipTypeInfo = (type: string) => {
    return RELATIONSHIP_TYPES.find(rt => rt.value === type) || {
      value: type,
      label: type.replace('_', ' '),
      description: 'Custom relationship type',
      icon: Network
    };
  };

  const filteredRelationships = relationships.filter(rel => {
    const matchesSearch = searchTerm === '' || 
      rel.relationship_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entities.find(e => e.id === rel.from_entity_id)?.entity_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entities.find(e => e.id === rel.to_entity_id)?.entity_name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterType === '' || rel.relationship_type === filterType;
    
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Relationship Manager</h2>
          <p className="text-gray-600">Manage entity relationships with visual graph editor</p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => setViewMode(viewMode === 'graph' ? 'list' : 'graph')}
            variant="outline"
            size="sm"
          >
            {viewMode === 'graph' ? 'List View' : 'Graph View'}
          </Button>
          <Button
            onClick={() => setIsCreatingRelationship(true)}
            size="sm"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Relationship
          </Button>
        </div>
      </div>

      {/* Search and Filter */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-4 items-center">
            <div className="flex-1">
              <div className="relative">
                <Search className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
                <Input
                  placeholder="Search relationships..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="w-48">
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Types</SelectItem>
                  {RELATIONSHIP_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={() => loadRelationships(entityId || '')} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-12 gap-6">
        {/* Main Content */}
        <div className="col-span-8">
          {viewMode === 'graph' ? (
            <Card className="h-[600px]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Network className="h-5 w-5" />
                  Relationship Graph
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0 h-full">
                <div className="relative w-full h-full bg-gray-50 rounded-b-lg overflow-hidden">
                  {/* SVG Graph Visualization */}
                  <svg className="w-full h-full">
                    {/* Grid Background */}
                    <defs>
                      <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                        <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#e5e7eb" strokeWidth="1"/>
                      </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#grid)" />
                    
                    {/* Edges */}
                    {graphEdges.map((edge) => {
                      const fromNode = graphNodes.find(n => n.id === edge.from);
                      const toNode = graphNodes.find(n => n.id === edge.to);
                      if (!fromNode || !toNode) return null;

                      return (
                        <g key={edge.id}>
                          <line
                            x1={fromNode.x}
                            y1={fromNode.y}
                            x2={toNode.x}
                            y2={toNode.y}
                            stroke={selectedEdge === edge.id ? '#3b82f6' : '#6b7280'}
                            strokeWidth={selectedEdge === edge.id ? 3 : 2}
                            markerEnd="url(#arrowhead)"
                            className="cursor-pointer hover:stroke-blue-500"
                            onClick={() => setSelectedEdge(edge.id)}
                          />
                          {/* Edge Label */}
                          <text
                            x={(fromNode.x + toNode.x) / 2}
                            y={(fromNode.y + toNode.y) / 2 - 5}
                            textAnchor="middle"
                            className="text-xs fill-gray-600 pointer-events-none"
                          >
                            {edge.label}
                          </text>
                        </g>
                      );
                    })}

                    {/* Arrow marker */}
                    <defs>
                      <marker
                        id="arrowhead"
                        markerWidth="10"
                        markerHeight="7"
                        refX="9"
                        refY="3.5"
                        orient="auto"
                      >
                        <polygon
                          points="0 0, 10 3.5, 0 7"
                          fill="#6b7280"
                        />
                      </marker>
                    </defs>

                    {/* Nodes */}
                    {graphNodes.map((node) => (
                      <g key={node.id}>
                        <circle
                          cx={node.x}
                          cy={node.y}
                          r="30"
                          fill={selectedNode === node.id ? '#3b82f6' : '#f3f4f6'}
                          stroke={selectedNode === node.id ? '#1d4ed8' : '#d1d5db'}
                          strokeWidth="2"
                          className="cursor-pointer hover:fill-blue-100"
                          onClick={() => setSelectedNode(node.id)}
                        />
                        <text
                          x={node.x}
                          y={node.y + 5}
                          textAnchor="middle"
                          className="text-xs font-medium fill-gray-700 pointer-events-none"
                        >
                          {node.label.length > 10 ? node.label.substring(0, 10) + '...' : node.label}
                        </text>
                        <text
                          x={node.x}
                          y={node.y + 50}
                          textAnchor="middle"
                          className="text-xs fill-gray-500 pointer-events-none"
                        >
                          {node.type}
                        </text>
                      </g>
                    ))}
                  </svg>

                  {/* Graph Controls */}
                  <div className="absolute top-4 right-4 flex gap-2">
                    <Button size="sm" variant="outline">
                      <Maximize className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Relationships List</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {filteredRelationships.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      No relationships found
                    </div>
                  ) : (
                    filteredRelationships.map((relationship) => {
                      const fromEntity = entities.find(e => e.id === relationship.from_entity_id);
                      const toEntity = entities.find(e => e.id === relationship.to_entity_id);
                      const typeInfo = getRelationshipTypeInfo(relationship.relationship_type);

                      return (
                        <Card key={relationship.id} className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <typeInfo.icon className="h-5 w-5 text-gray-600" />
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">{fromEntity?.entity_name}</span>
                                  <Badge variant="outline">{typeInfo.label}</Badge>
                                  <span className="font-medium">{toEntity?.entity_name}</span>
                                </div>
                                <p className="text-sm text-gray-600">{typeInfo.description}</p>
                                <div className="text-xs text-gray-500">
                                  Effective: {new Date(relationship.effective_date).toLocaleDateString()}
                                  {relationship.expiration_date && (
                                    <> | Expires: {new Date(relationship.expiration_date).toLocaleDateString()}</>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button size="sm" variant="outline">
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => deleteRelationship(relationship.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </Card>
                      );
                    })
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="col-span-4 space-y-6">
          {/* Selected Node/Edge Details */}
          {selectedNode && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Entity Details</CardTitle>
              </CardHeader>
              <CardContent>
                {(() => {
                  const node = graphNodes.find(n => n.id === selectedNode);
                  if (!node) return null;

                  return (
                    <div className="space-y-3 text-sm">
                      <div className="flex items-center gap-2">
                        {getEntityTypeIcon(node.entity.entity_type)}
                        <span className="font-medium">{node.entity.entity_name}</span>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Code:</span>
                          <span>{node.entity.entity_code}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Type:</span>
                          <span>{node.entity.entity_type}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Connections:</span>
                          <span>{node.connections.length}</span>
                        </div>
                      </div>
                      <code className="text-xs block mt-2 p-2 bg-gray-100 rounded">
                        {node.entity.smart_code}
                      </code>
                    </div>
                  );
                })()}
              </CardContent>
            </Card>
          )}

          {/* Statistics */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Statistics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Total Entities:</span>
                <span>{entities.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Total Relationships:</span>
                <span>{relationships.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Relationship Types:</span>
                <span>{new Set(relationships.map(r => r.relationship_type)).size}</span>
              </div>
            </CardContent>
          </Card>

          {/* AI Insights */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-purple-600" />
                <CardTitle className="text-lg">AI Insights</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription className="text-sm">
                  AI analysis suggests potential optimization of relationship hierarchies for better data organization.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Create Relationship Modal */}
      {isCreatingRelationship && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Create New Relationship</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="from_entity">From Entity</Label>
                  <Select
                    value={newRelationship.from_entity_id}
                    onValueChange={(value) => setNewRelationship(prev => ({ ...prev, from_entity_id: value }))}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select entity" />
                    </SelectTrigger>
                    <SelectContent>
                      {entities.map((entity) => (
                        <SelectItem key={entity.id} value={entity.id}>
                          {entity.entity_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="to_entity">To Entity</Label>
                  <Select
                    value={newRelationship.to_entity_id}
                    onValueChange={(value) => setNewRelationship(prev => ({ ...prev, to_entity_id: value }))}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select entity" />
                    </SelectTrigger>
                    <SelectContent>
                      {entities.map((entity) => (
                        <SelectItem key={entity.id} value={entity.id}>
                          {entity.entity_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="relationship_type">Relationship Type</Label>
                <Select
                  value={newRelationship.relationship_type}
                  onValueChange={(value) => setNewRelationship(prev => ({ ...prev, relationship_type: value }))}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select relationship type" />
                  </SelectTrigger>
                  <SelectContent>
                    {RELATIONSHIP_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="effective_date">Effective Date</Label>
                  <Input
                    type="date"
                    value={newRelationship.effective_date}
                    onChange={(e) => setNewRelationship(prev => ({ ...prev, effective_date: e.target.value }))}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="expiration_date">Expiration Date</Label>
                  <Input
                    type="date"
                    value={newRelationship.expiration_date}
                    onChange={(e) => setNewRelationship(prev => ({ ...prev, expiration_date: e.target.value }))}
                    className="mt-1"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  value={newRelationship.description}
                  onChange={(e) => setNewRelationship(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Optional description"
                  className="mt-1"
                />
              </div>

              <div className="flex justify-between pt-4">
                <Button
                  onClick={() => setIsCreatingRelationship(false)}
                  variant="outline"
                >
                  Cancel
                </Button>
                <Button
                  onClick={createRelationship}
                  disabled={isLoading || !newRelationship.from_entity_id || !newRelationship.to_entity_id || !newRelationship.relationship_type}
                >
                  {isLoading ? 'Creating...' : 'Create Relationship'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}