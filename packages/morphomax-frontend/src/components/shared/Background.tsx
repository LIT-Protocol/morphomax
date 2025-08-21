import React, { useEffect, useRef } from 'react';

interface TetheredFlowProps {
  isActive: boolean;
  className?: string;
}

// Node class matching original design
class Node {
  x: number;
  y: number;
  originX: number;
  originY: number;
  size: number;
  type: string;
  speed: number;
  direction: number;
  angle: number;
  connections: Array<{ to: number; distance: number; opacity: number }>;
  opacity: number;
  phase: number;
  flowOffset: number;
  pulseSpeed: number;
  moveRange: number;
  shapeType: string;
  rotation: number;
  rotationSpeed: number;

  constructor(x: number, y: number, size: number, type: string, isActive: boolean) {
    this.x = x;
    this.y = y;
    this.originX = x;
    this.originY = y;
    this.size = size;
    this.type = type;
    this.speed = Math.random() * 0.01 + 0.005;
    this.direction = Math.random() * Math.PI * 2;
    this.angle = Math.random() * Math.PI * 2;
    this.connections = [];
    this.opacity = isActive ? Math.random() * 0.6 + 0.3 : Math.random() * 0.3 + 0.1;
    this.phase = Math.random() * Math.PI * 2;
    this.flowOffset = Math.random() * 100;
    this.pulseSpeed = isActive ? Math.random() * 0.03 + 0.01 : Math.random() * 0.002 + 0.001;
    this.moveRange = isActive ? Math.random() * 30 + 20 : Math.random() * 2 + 1;
    this.shapeType = Math.random() > 0.6 ? 'rect' : 'line';
    this.rotation = Math.random() * Math.PI;
    this.rotationSpeed = isActive ? (Math.random() - 0.5) * 0.01 : (Math.random() - 0.5) * 0.001;
  }

  update(time: number, isActive: boolean) {
    if (!isActive) {
      const noiseX = Math.sin(time * this.speed * 0.1 + this.phase) * this.moveRange;
      const noiseY = Math.cos(time * this.speed * 0.1 + this.phase) * this.moveRange;
      
      if (this.type === 'vibe') {
        this.x = this.originX + Math.sin(time * 0.003) * 2;
        this.y = this.originY + Math.cos(time * 0.004) * 2;
        this.size = 6 + Math.sin(time * 0.005 + this.phase) * 0.3;
      } else {
        this.x = this.originX + noiseX;
        this.y = this.originY + noiseY;
      }
      
      this.rotation += this.rotationSpeed;
      return;
    }
    
    const noiseX = Math.sin(time * this.speed + this.phase) * this.moveRange;
    const noiseY = Math.cos(time * this.speed * 0.7 + this.phase) * this.moveRange;
    
    if (this.type === 'heaven') {
      this.x = this.originX + noiseX;
      this.y = this.originY + noiseY * 0.7;
    } else if (this.type === 'earth') {
      this.x = this.originX + noiseX * 0.6 + Math.sin(time * 0.02 + this.flowOffset) * 10;
      this.y = this.originY + noiseY * 0.8;
    } else if (this.type === 'vibe') {
      this.x = this.originX + Math.sin(time * 0.03) * 20;
      this.y = this.originY + Math.cos(time * 0.04) * 20;
      this.size = 6 + Math.sin(time * 0.05 + this.phase) * 2;
    }
    
    this.rotation += this.rotationSpeed;
  }
  
  draw(ctx: CanvasRenderingContext2D, time: number, isActive: boolean) {
    ctx.save();
    ctx.translate(this.x, this.y);
    
    if (isActive) {
      if (this.type === 'heaven') {
        ctx.fillStyle = `rgba(217, 119, 6, ${this.opacity})`;
        ctx.shadowBlur = 2;
        ctx.shadowColor = 'rgba(217, 119, 6, 0.3)';
      } else if (this.type === 'earth') {
        ctx.fillStyle = `rgba(194, 65, 12, ${this.opacity})`;
        ctx.shadowBlur = 1;
        ctx.shadowColor = 'rgba(194, 65, 12, 0.2)';
      } else {
        ctx.fillStyle = `rgba(234, 88, 12, ${this.opacity + 0.2})`;
        ctx.shadowBlur = 3;
        ctx.shadowColor = 'rgba(234, 88, 12, 0.4)';
      }
    } else {
      if (this.type === 'heaven') {
        ctx.fillStyle = `rgba(120, 113, 108, ${this.opacity * 0.4})`;
      } else if (this.type === 'earth') {
        ctx.fillStyle = `rgba(87, 83, 78, ${this.opacity * 0.5})`;
      } else {
        ctx.fillStyle = `rgba(68, 64, 60, ${this.opacity + 0.1})`;
      }
    }
    
    ctx.rotate(this.rotation);
    
    if (this.shapeType === 'rect') {
      const pulseSize = this.size * (1 + Math.sin(time * this.pulseSpeed) * 0.2);
      ctx.fillRect(-pulseSize/2, -pulseSize/2, pulseSize, pulseSize);
    } else {
      const pulseLength = this.size * 2 * (1 + Math.sin(time * this.pulseSpeed) * 0.2);
      ctx.fillRect(-pulseLength/2, -1, pulseLength, 2);
    }
    
    ctx.shadowBlur = 0;
    ctx.shadowColor = 'transparent';
    ctx.restore();
  }
}

const TetheredFlow: React.FC<TetheredFlowProps> = ({ 
  isActive, 
  className = ''
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    let time = 0;
    let animationFrame: number;
    
    let nodes: Node[] = [];
    
    // Function to get current background color based on theme
    const getBgColor = () => {
      const isDark = document.documentElement.classList.contains('dark');
      return isDark ? '#0a0a0a' : '#FFFFFF';
    };
    
    // Initialize nodes in concentric circles pattern from original
    const initNodes = () => {
      const width = canvas.width;
      const height = canvas.height;
      const centerX = width * 0.5;
      const centerY = height * 0.5;
      
      nodes = [];
      
      // Calculate distance to screen edges (diagonal to corners)
      const edgeDistance = Math.sqrt(width * width + height * height) * 0.5;
      
      // Scale node count based on screen size (more nodes on larger screens)
      const screenArea = width * height;
      const baseArea = 800 * 600; // Reference screen size
      const scaleFactor = Math.sqrt(screenArea / baseArea);
      
      // Base node counts scaled by screen size
      const layers = [
        { distance: edgeDistance * 1.0, count: Math.floor(60 * scaleFactor), type: 'heaven' },      // At edge
        { distance: edgeDistance * 0.9, count: Math.floor(54 * scaleFactor), type: 'heaven' },      // Near edge
        { distance: edgeDistance * 0.8, count: Math.floor(48 * scaleFactor), type: 'heaven' },      // Moving inward
        { distance: edgeDistance * 0.7, count: Math.floor(42 * scaleFactor), type: 'heaven' },      
        { distance: edgeDistance * 0.6, count: Math.floor(36 * scaleFactor), type: 'heaven' },      
        { distance: edgeDistance * 0.5, count: Math.floor(30 * scaleFactor), type: 'heaven' },      
        { distance: edgeDistance * 0.4, count: Math.floor(24 * scaleFactor), type: 'earth' },       
        { distance: edgeDistance * 0.3, count: Math.floor(18 * scaleFactor), type: 'earth' },       
        { distance: edgeDistance * 0.2, count: Math.floor(12 * scaleFactor), type: 'earth' },       
        { distance: edgeDistance * 0.1, count: Math.floor(6 * scaleFactor), type: 'earth' }         // Center
      ];
      
      layers.forEach(layer => {
        for (let i = 0; i < layer.count; i++) {
          const angle = (i / layer.count) * Math.PI * 2 + Math.random() * 0.3 - 0.15;
          const distance = layer.distance + Math.random() * 40 - 20;
          
          let x = centerX + Math.cos(angle) * distance;
          let y = centerY + Math.sin(angle) * distance;
          
          // Allow nodes to extend beyond screen bounds for edge effect
          x = Math.max(-100, Math.min(width + 100, x));
          y = Math.max(-100, Math.min(height + 100, y));
          
          const size = Math.random() * 3 + 2;
          nodes.push(new Node(x, y, size, layer.type, isActive));
        }
      });
    };
    
    // Create connections between nodes
    const createConnections = () => {
      for (let i = 0; i < nodes.length; i++) {
        nodes[i].connections = [];
        
        for (let j = 0; j < nodes.length; j++) {
          if (i !== j) {
            const dx = nodes[i].x - nodes[j].x;
            const dy = nodes[i].y - nodes[j].y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            const maxDistance = 120;
            
            if (distance < maxDistance) {
              nodes[i].connections.push({
                to: j,
                distance: distance,
                opacity: isActive ? (1 - (distance / maxDistance)) * 0.6 : (1 - (distance / maxDistance)) * 0.3
              });
            }
          }
        }
      }
    };
    
    // Draw all connections
    const drawConnections = () => {
      for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];
        
        for (const conn of node.connections) {
          const targetNode = nodes[conn.to];
          
          ctx.beginPath();
          ctx.moveTo(node.x, node.y);
          
          // Use bezier curves with flow
          const midX = (node.x + targetNode.x) / 2;
          const midY = (node.y + targetNode.y) / 2;
          
          const flowOffsetX = Math.sin(time * 0.02 + i * 0.1) * 10;
          const flowOffsetY = Math.cos(time * 0.02 + i * 0.1) * 10;
          
          ctx.quadraticCurveTo(
            midX + flowOffsetX,
            midY + flowOffsetY,
            targetNode.x,
            targetNode.y
          );
          
          ctx.strokeStyle = isActive 
            ? `rgba(217, 119, 6, ${Math.max(conn.opacity * 0.8, 0.3)})` 
            : `rgba(120, 113, 108, ${conn.opacity * 0.6})`;
          ctx.lineWidth = isActive ? 0.8 : 0.4;
          ctx.stroke();
        }
      }
    };
    
    // Animation loop
    const animate = () => {
      time += isActive ? 0.5 : 0.1;
      
      const currentWidth = canvas.width;
      const currentHeight = canvas.height;
      
      // Get current background color (updates with theme changes)
      ctx.fillStyle = getBgColor();
      ctx.fillRect(0, 0, currentWidth, currentHeight);
      
      // Update all nodes
      for (const node of nodes) {
        node.update(time, isActive);
      }
      
      // Recreate connections occasionally
      if (Math.floor(time) % 10 === 0) {
        createConnections();
      }
      
      // Draw connections first
      drawConnections();
      
      // Draw nodes on top
      for (const node of nodes) {
        node.draw(ctx, time, isActive);
      }
      
      animationFrame = requestAnimationFrame(animate);
    };
    
    const resizeCanvas = () => {
      const rect = container.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
      ctx.imageSmoothingEnabled = true;
      initNodes();
    };
    
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationFrame);
    };
  }, [isActive]);

  return (
    <div 
      ref={containerRef}
      className={`relative overflow-hidden ${className} bg-white dark:bg-neutral-950`}
      style={{ 
        width: '100%', 
        height: '100%'
      }}
    >
      <canvas 
        ref={canvasRef}
        style={{ width: '100%', height: '100%' }}
      />
    </div>
  );
};

// Background component that uses TetheredFlow
export const Background: React.FC = () => {
  return (
    <div className="fixed inset-0 z-0">
      <TetheredFlow isActive={true} className="w-full h-full" />
    </div>
  );
};