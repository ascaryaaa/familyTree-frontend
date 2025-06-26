import React from 'react';
import { Handle, Position } from '@xyflow/react';

export const PersonNode = ({ id, data }: { id: string; data: { label: string } }) => {
  const handleStyle = {
    width: '6px',
    height: '6px',
    borderRadius: '3px',
    backgroundColor: '#fff',
    border: '1px solid #ddd',
  };

  return (
    <div style={{ padding: '10px', border: '1px solid #ddd', borderRadius: '4px', background: 'white' }}>
      <Handle 
        type="target" 
        position={Position.Top} 
        id={`${id}-top`} 
        style={handleStyle}
      />
      <Handle 
        type="source" 
        position={Position.Bottom} 
        id={`${id}-bottom`} 
        style={handleStyle}
      />
      <Handle 
        type="target" 
        position={Position.Left} 
        id={`${id}-left`} 
        style={handleStyle}
      />
      <Handle 
        type="source" 
        position={Position.Right} 
        id={`${id}-right`} 
        style={handleStyle}
      />
      <div>{data.label}</div>
    </div>
  );
};