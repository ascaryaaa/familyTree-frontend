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
  Position,
  type Node,
  type Edge,
  type Connection,
  Handle,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

const familyData = [
  { id: '1', name: 'Edward Lancaster', gender: 'male', dob: '1940-06-15', father: null, mother: null, partner: ['2'] },
  { id: '2', name: 'Beatrice Lancaster', gender: 'female', dob: '1942-03-22', father: null, mother: null, partner: ['1'] },
  { id: '3', name: 'Thomas Lancaster', gender: 'male', dob: '1965-10-10', father: '1', mother: '2', partner: ['4'] },
  { id: '4', name: 'Eleanor Hayes', gender: 'female', dob: '1967-12-01', father: null, mother: null, partner: ['3'] },
  { id: '5', name: 'Charlotte Lancaster', gender: 'female', dob: '1968-08-25', father: '1', mother: '2', partner: ['6'] },
  { id: '6', name: 'Jonathan Clarke', gender: 'male', dob: '1966-02-18', father: null, mother: null, partner: ['5'] },
  { id: '7', name: 'Henry Lancaster', gender: 'male', dob: '1971-04-14', father: '1', mother: '2', partner: ['8'] },
  { id: '8', name: 'Vivian Brooks', gender: 'female', dob: '1973-07-09', father: null, mother: null, partner: ['7'] },
  { id: '9', name: 'Lily Morgan', gender: 'female', dob: '1992-06-10', father: null, mother: null, partner: ['10'] },
  { id: '10', name: 'Oliver Lancaster', gender: 'male', dob: '1990-01-20', father: '3', mother: '4', partner: ['9'] },
  { id: '11', name: 'Amelia Clarke', gender: 'female', dob: '1993-03-15', father: '6', mother: '5', partner: ['12'] },
  { id: '12', name: 'Ethan Gray', gender: 'male', dob: '1991-09-02', father: null, mother: null, partner: ['11'] },
  { id: '13', name: 'Sebastian Clarke', gender: 'male', dob: '1996-11-28', father: '6', mother: '5', partner: [] },
  { id: '14', name: 'Lucas Lancaster', gender: 'male', dob: '1995-07-07', father: '7', mother: '8', partner: ['15'] },
  { id: '15', name: 'Isla Bennett', gender: 'female', dob: '1997-05-13', father: null, mother: null, partner: ['14'] },
  { id: '16', name: 'Noah Lancaster', gender: 'male', dob: '2020-10-01', father: '9', mother: '10', partner: [] },
  { id: '17', name: 'Grace Lancaster', gender: 'female', dob: '2022-04-03', father: '9', mother: '10', partner: [] },
  { id: '18', name: 'Leo Gray', gender: 'male', dob: '2021-12-11', father: '12', mother: '11', partner: [] },
  { id: '19', name: 'Ella Lancaster', gender: 'female', dob: '2023-03-18', father: '14', mother: '15', partner: [] },
];

// Custom node component with 4 handles
const PersonNode = ({ id, data }: { id: string; data: { label: string } }) => {
  return (
    <div style={{ padding: '10px', border: '1px solid #ddd', borderRadius: '4px', background: 'white' }}>
      <Handle type="target" position={Position.Top} id={`${id}-top`} />
      <Handle type="source" position={Position.Bottom} id={`${id}-bottom`} />
      <Handle type="target" position={Position.Left} id={`${id}-left`} />
      <Handle type="source" position={Position.Right} id={`${id}-right`} />
      <div>{data.label}</div>
    </div>
  );
};

// Setup generations
const personMap = new Map(familyData.map((p) => [p.id, p]));
const generationMap = new Map<string, number>();

function getGeneration(id: string): number {
  if (generationMap.has(id)) return generationMap.get(id)!;
  const person = personMap.get(id);
  if (!person) return 0;
  const fatherGen = person.father ? getGeneration(person.father) + 1 : 0;
  const motherGen = person.mother ? getGeneration(person.mother) + 1 : 0;
  const gen = Math.max(fatherGen, motherGen);
  generationMap.set(id, gen);
  return gen;
}
familyData.forEach((p) => getGeneration(p.id));

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
    const p = personMap.get(id)!;
    const partnerId = p.partner?.[0];
    const baseY = level * spacingY;

    if (
      partnerId &&
      personMap.get(partnerId)?.partner?.includes(p.id) &&
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
        data: { label: `${personMap.get(partnerId)!.name}` },
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

// Parent-child edges (using top and bottom handles)
familyData.forEach((p) => {
  if (p.father) {
    edges.push({
      id: `e${p.father}-${p.id}`,
      source: p.father,
      sourceHandle: `${p.father}-bottom`,
      target: p.id,
      targetHandle: `${p.id}-top`,
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
      style: { stroke: 'blue' },
    });
  }
});

// Partner edges (using left and right handles)
coupleMap.forEach((key) => {
  const [id1, id2] = key.split('-');
  edges.push({
    id: `epartner-${id1}-${id2}`,
    source: id1,
    sourceHandle: `${id1}-right`,
    target: id2,
    targetHandle: `${id2}-left`,
    style: {
      stroke: 'green',
      strokeDasharray: '5,5',
    },
  });
});

const nodeTypes = {
  person: PersonNode,
};

export default function App() {
  const [nodeState, , onNodesChange] = useNodesState(nodes);
  const [edgeState, setEdges, onEdgesChange] = useEdgesState(edges);

  const onConnect = useCallback(
    (params: Edge | Connection) =>
      setEdges((eds) =>
        addEdge(params, eds).map((edge, i, arr) =>
          i === arr.length - 1 ? { ...edge, style: { stroke: 'black' } } : edge
        )
      ),
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
        fitView
      >
        <Controls />
        <MiniMap />
        <Background variant={BackgroundVariant.Lines} gap={12} size={1} />
      </ReactFlow>
    </div>
  );
}