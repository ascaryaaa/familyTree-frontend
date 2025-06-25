import React from 'react';
import { Handle, Position } from '@xyflow/react';

export const PersonNode = ({ id, data }: { id: string; data: { label: string } }) => {
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