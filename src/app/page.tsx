'use client';

import React, { useCallback } from 'react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  BackgroundVariant,
  type Node,
  type Edge,
  type Connection,
  ConnectionLineType,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { familyData } from './familyData';
import { PersonNode } from './components/personNode';
import { setupGenerations } from './utils/setupGenerations';

const nodeTypes = {
  person: PersonNode,
};

const generationMap = setupGenerations(familyData);

const FamilyTree = () => {
  // Group by generation
  const generations = new Map<number, string[]>();
  generationMap.forEach((level, id) => {
    if (!generations.has(level)) generations.set(level, []);
    generations.get(level)!.push(id);
  });

  const coupleMap = new Set<string>();
  const nodes: Node[] = [];
  const nodeWidth = 172;
  const nodeHeight = 50;
  const spacingX = 200;
  const spacingY = 120;
  const partnerSpacing = 30;

  // First pass: place all nodes with proper spacing
  generations.forEach((ids, level) => {
    // Sort by birth year to maintain chronological order
    const sortedIds = [...ids].sort((a, b) => {
      const personA = familyData.find(p => p.id === a)!;
      const personB = familyData.find(p => p.id === b)!;
      return new Date(personA.dob).getTime() - new Date(personB.dob).getTime();
    });

    let x = 0;
    const used = new Set<string>();

    sortedIds.forEach((id) => {
      if (used.has(id)) return;
      const p = familyData.find(p => p.id === id)!;
      const partnerId = p.partner?.[0];
      const baseY = level * spacingY;

      if (
        partnerId &&
        familyData.find(p => p.id === partnerId)?.partner?.includes(p.id) &&
        !used.has(partnerId)
      ) {
        // Couple side-by-side
        nodes.push({
          id: p.id,
          data: { label: `${p.name}` },
          position: { x, y: baseY },
          type: 'person',
        });
        nodes.push({
          id: partnerId,
          data: { label: `${familyData.find(p => p.id === partnerId)!.name}` },
          position: { x: x + nodeWidth + partnerSpacing, y: baseY },
          type: 'person',
        });
        used.add(p.id);
        used.add(partnerId);
        coupleMap.add([p.id, partnerId].sort().join('-'));
        x += nodeWidth * 2 + partnerSpacing + spacingX;
      } else {
        // Single
        nodes.push({
          id: p.id,
          data: { label: `${p.name}` },
          position: { x, y: baseY },
          type: 'person',
        });
        used.add(p.id);
        x += nodeWidth + spacingX;
      }
    });
  });

  // Second pass: align children under parents while maintaining order
  const nodePositions = new Map(nodes.map(n => [n.id, n.position]));
  const childrenMap = new Map<string, {couple: string[], children: string[]}>();

  // Group children by parent couple in chronological order
  familyData.forEach(person => {
    if (person.father && person.mother) {
      const coupleKey = [person.father, person.mother].sort().join('-');
      if (!childrenMap.has(coupleKey)) {
        childrenMap.set(coupleKey, {
          couple: [person.father, person.mother],
          children: []
        });
      }
      childrenMap.get(coupleKey)!.children.push(person.id);
    }
  });

  // Sort children by birth date
  childrenMap.forEach((value) => {
    value.children.sort((a, b) => {
      const personA = familyData.find(p => p.id === a)!;
      const personB = familyData.find(p => p.id === b)!;
      return new Date(personA.dob).getTime() - new Date(personB.dob).getTime();
    });
  });

  // Position children centered below their parents, maintaining order
  Array.from(childrenMap.values()).forEach(({couple, children}) => {
    const [parent1, parent2] = couple;
    const parent1Pos = nodePositions.get(parent1);
    const parent2Pos = nodePositions.get(parent2);

    if (parent1Pos && parent2Pos) {
      const centerX = (parent1Pos.x + parent2Pos.x) / 2;
      const childrenPerRow = Math.min(3, children.length);
      const childSpacing = nodeWidth * 1.5;

      children.forEach((childId, index) => {
        const childNode = nodes.find(n => n.id === childId);
        if (childNode) {
          const col = index % childrenPerRow;
          const offsetX = (col - (childrenPerRow - 1) / 2) * childSpacing;
          childNode.position = {
            x: centerX + offsetX,
            y: childNode.position.y
          };
        }
      });
    }
  });

  // Third pass: adjust positions to prevent overlap
  const adjustedNodes = [...nodes];
  for (let i = 0; i < adjustedNodes.length; i++) {
    for (let j = i + 1; j < adjustedNodes.length; j++) {
      const nodeA = adjustedNodes[i];
      const nodeB = adjustedNodes[j];

      if (
        Math.abs(nodeA.position.x - nodeB.position.x) < nodeWidth &&
        Math.abs(nodeA.position.y - nodeB.position.y) < nodeHeight
      ) {
        // Nodes are overlapping, adjust position
        const direction = nodeA.position.x < nodeB.position.x ? 1 : -1;
        nodeB.position.x += direction * (nodeWidth - Math.abs(nodeA.position.x - nodeB.position.x) + 20);
      }
    }
  }

  const edges: Edge[] = [];

  familyData.forEach((p) => {
    if (p.father) {
      edges.push({
        id: `e${p.father}-${p.id}`,
        source: p.father,
        sourceHandle: `${p.father}-bottom`,
        target: p.id,
        targetHandle: `${p.id}-top`,
        type: 'smoothstep',
        style: { stroke: 'blue' },
      });
    }
    if (p.mother) {
      edges.push({
        id: `e${p.mother}-${p.id}`,
        source: p.mother,
        sourceHandle: `${p.mother}-bottom`,
        target: p.id,
        targetHandle: `${p.id}-top`,
        type: 'smoothstep',
        style: { stroke: 'blue' },
      });
    }
  });

  coupleMap.forEach((key) => {
    const [id1, id2] = key.split('-');
    edges.push({
      id: `epartner-${id1}-${id2}`,
      source: id1,
      sourceHandle: `${id1}-right`,
      target: id2,
      targetHandle: `${id2}-left`,
      type: 'smoothstep',
      style: {
        stroke: 'green',
        strokeDasharray: '5,5',
      },
    });
  });

  const [nodeState, , onNodesChange] = useNodesState(adjustedNodes);
  const [edgeState, setEdges, onEdgesChange] = useEdgesState(edges);

  const onConnect = useCallback(
    (params: Edge | Connection) =>
      setEdges((eds) => {
        const edge = addEdge(
          {
            ...params,
            type: 'smoothstep',
          },
          eds
        );
        let targetEdgeId: string;
        if (typeof params === 'object' && 'id' in params) {
          targetEdgeId = params.id;
        } else {
          targetEdgeId = '';
        }
        return edge.map(e =>
          e.id === targetEdgeId
            ? { ...e, style: { stroke: 'black' } }
            : e
        );
      }),
    [setEdges]
  );

  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <ReactFlow
        nodes={nodeState}
        edges={edgeState}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        connectionLineType={ConnectionLineType.SmoothStep}
        fitView
      >
        <Controls />
        <MiniMap />
        <Background variant={BackgroundVariant.Lines} gap={12} size={1} />
      </ReactFlow>
    </div>
  );
};

export default FamilyTree;