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
  const spacingX = 200;
  const spacingY = 160;

  // Place nodes
  generations.forEach((ids, level) => {
    let x = 0;
    const used = new Set<string>();

    ids.forEach((id) => {
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
          position: { x: x + nodeWidth + 30, y: baseY },
          type: 'person',
        });
        used.add(p.id);
        used.add(partnerId);
        coupleMap.add([p.id, partnerId].sort().join('-'));
        x += spacingX * 2;
      } else {
        // Single
        nodes.push({
          id: p.id,
          data: { label: `${p.name}` },
          position: { x, y: baseY },
          type: 'person',
        });
        used.add(p.id);
        x += spacingX;
      }
    });
  });

  // Helper to find node positions
  const nodePos = new Map(nodes.map((n) => [n.id, n.position.x]));

  // Align children under mid-point between parents
  familyData.forEach((p) => {
    if (p.father && p.mother && nodePos.has(p.father) && nodePos.has(p.mother)) {
      const fatherX = nodePos.get(p.father)!;
      const motherX = nodePos.get(p.mother)!;
      const centerX = (fatherX + motherX) / 2;
      const node = nodes.find((n) => n.id === p.id);
      if (node) node.position.x = centerX;
    }
  });

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

  const [nodeState, , onNodesChange] = useNodesState(nodes);
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