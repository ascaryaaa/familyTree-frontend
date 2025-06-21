'use client';

import React from 'react';
import { ReactFlow, Background, Controls, Node, Edge } from '@xyflow/react';
import '@xyflow/react/dist/style.css';

const familyData = [
  // First generation (Founders)
  { id: '1', name: 'Edward Lancaster', gender: 'male', dob: '1940-06-15', father: null, mother: null, partner: ['2'] },
  { id: '2', name: 'Beatrice Lancaster', gender: 'female', dob: '1942-03-22', father: null, mother: null, partner: ['1'] },

  // Second generation (Children of Edward & Beatrice)
  { id: '3', name: 'Thomas Lancaster', gender: 'male', dob: '1965-10-10', father: '1', mother: '2', partner: ['4'] },
  { id: '4', name: 'Eleanor Hayes', gender: 'female', dob: '1967-12-01', father: null, mother: null, partner: ['3'] },

  { id: '5', name: 'Charlotte Lancaster', gender: 'female', dob: '1968-08-25', father: '1', mother: '2', partner: ['6'] },
  { id: '6', name: 'Jonathan Clarke', gender: 'male', dob: '1966-02-18', father: null, mother: null, partner: ['5'] },

  { id: '7', name: 'Henry Lancaster', gender: 'male', dob: '1971-04-14', father: '1', mother: '2', partner: ['8'] },
  { id: '8', name: 'Vivian Brooks', gender: 'female', dob: '1973-07-09', father: null, mother: null, partner: ['7'] },

  // Third generation (Grandchildren of Edward & Beatrice)
  { id: '9', name: 'Oliver Lancaster', gender: 'male', dob: '1990-01-20', father: '3', mother: '4', partner: ['10'] },
  { id: '10', name: 'Lily Morgan', gender: 'female', dob: '1992-06-10', father: null, mother: null, partner: ['9'] },

  { id: '11', name: 'Amelia Clarke', gender: 'female', dob: '1993-03-15', father: '6', mother: '5', partner: ['12'] },
  { id: '12', name: 'Ethan Gray', gender: 'male', dob: '1991-09-02', father: null, mother: null, partner: ['11'] },

  { id: '13', name: 'Sebastian Clarke', gender: 'male', dob: '1996-11-28', father: '6', mother: '5', partner: [] },

  { id: '14', name: 'Lucas Lancaster', gender: 'male', dob: '1995-07-07', father: '7', mother: '8', partner: ['15'] },
  { id: '15', name: 'Isla Bennett', gender: 'female', dob: '1997-05-13', father: null, mother: null, partner: ['14'] },

  // Fourth generation (Great-grandchildren of Edward & Beatrice)
  { id: '16', name: 'Noah Lancaster', gender: 'male', dob: '2020-10-01', father: '9', mother: '10', partner: [] },
  { id: '17', name: 'Grace Lancaster', gender: 'female', dob: '2022-04-03', father: '9', mother: '10', partner: [] },

  { id: '18', name: 'Leo Gray', gender: 'male', dob: '2021-12-11', father: '12', mother: '11', partner: [] },

  { id: '19', name: 'Ella Lancaster', gender: 'female', dob: '2023-03-18', father: '14', mother: '15', partner: [] }
];


// Map of people for lookup
const personMap = new Map(familyData.map((p) => [p.id, p]));

// Determine generation level per person
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
familyData.forEach((person) => getGeneration(person.id));

// Group people by generation
const generations = new Map<number, string[]>();
generationMap.forEach((level, id) => {
  if (!generations.has(level)) generations.set(level, []);
  generations.get(level)!.push(id);
});

// Create nodes with vertical layout
const nodes: Node[] = [];
generations.forEach((ids, level) => {
  ids.forEach((id, index) => {
    const person = personMap.get(id)!;
    nodes.push({
      id: person.id,
      data: {
        label: `${person.name} (${person.gender === 'male' ? '♂' : '♀'})`,
      },
      position: {
        x: index * 250,
        y: level * 200, // ← this ensures vertical layout
      },
      type: 'default',
    });
  });
});

// Parent → child edges
const edges: Edge[] = [];
familyData.forEach((person) => {
  if (person.father) {
    edges.push({
      id: `e${person.father}-${person.id}`,
      source: person.father,
      target: person.id,
    });
  }
  if (person.mother) {
    edges.push({
      id: `e${person.mother}-${person.id}`,
      source: person.mother,
      target: person.id,
    });
  }
});

export default function Home() {
  return (
    <div style={{ width: '100%', height: '100vh' }}>
      <ReactFlow nodes={nodes} edges={edges} fitView>
        <Background />
        <Controls />
      </ReactFlow>
    </div>
  );
}
