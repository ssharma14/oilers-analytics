import { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import type { Shot } from '../../types/hockey';
import { nhlToSvg, getShotColor, getShotRadius, RINK } from '../../utils/rinkCoordinates';
import { estimateXG, formatPercent } from '../../utils/statsCalculations';

interface ShotMapProps {
  shots: Shot[];
  title?: string;
  showHalfRink?: boolean;
}

export function ShotMap({ shots, title = 'Shot Map', showHalfRink = true }: ShotMapProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const width = showHalfRink ? RINK.SVG_WIDTH / 2 : RINK.SVG_WIDTH;
    const height = RINK.SVG_HEIGHT;
    const margin = { top: 20, right: 20, bottom: 20, left: 20 };

    // Set viewBox for responsiveness
    svg.attr('viewBox', `0 0 ${width + margin.left + margin.right} ${height + margin.top + margin.bottom}`);

    const g = svg.append('g').attr('transform', `translate(${margin.left}, ${margin.top})`);

    // Draw rink background
    g.append('rect')
      .attr('width', width)
      .attr('height', height)
      .attr('fill', '#1a1a2e')
      .attr('rx', 20);

    // Draw rink markings
    drawRinkMarkings(g, width, height, showHalfRink);

    // Normalize shots to offensive zone if showing half rink
    const normalizedShots = shots.map(shot => {
      if (showHalfRink) {
        // Flip shots to right side (offensive zone)
        const x = shot.x < 0 ? -shot.x : shot.x;
        const y = shot.x < 0 ? -shot.y : shot.y;
        return { ...shot, x, y };
      }
      return shot;
    });

    // Filter to only show shots in offensive zone for half rink
    const visibleShots = showHalfRink
      ? normalizedShots.filter(s => s.x >= 0)
      : normalizedShots;

    // Create tooltip
    const tooltip = d3.select('body')
      .append('div')
      .attr('class', 'shot-tooltip')
      .style('position', 'absolute')
      .style('visibility', 'hidden')
      .style('background', 'rgba(0, 0, 0, 0.9)')
      .style('border', '1px solid #FF4C00')
      .style('border-radius', '8px')
      .style('padding', '12px')
      .style('color', 'white')
      .style('font-size', '12px')
      .style('pointer-events', 'none')
      .style('z-index', '1000');

    // Draw shots
    g.selectAll('.shot')
      .data(visibleShots)
      .enter()
      .append('circle')
      .attr('class', 'shot')
      .attr('cx', d => {
        if (showHalfRink) {
          // Map x from 0-100 to 0-width
          return (d.x / 100) * width;
        }
        const { x } = nhlToSvg(d.x, d.y);
        return x;
      })
      .attr('cy', d => {
        // Map y from -42.5 to 42.5 to 0-height
        const { y } = nhlToSvg(0, d.y);
        return y;
      })
      .attr('r', 0)
      .attr('fill', d => getShotColor(d.type))
      .attr('opacity', 0.8)
      .attr('stroke', d => d.type === 'goal' ? '#fff' : 'none')
      .attr('stroke-width', 2)
      .style('cursor', 'pointer')
      .on('mouseover', function (_event, d) {
        const xG = estimateXG(d.x, d.y, d.shotType);
        tooltip
          .style('visibility', 'visible')
          .html(`
            <div style="font-weight: bold; color: #FF4C00; margin-bottom: 4px;">
              ${d.shooterName || 'Unknown'}
            </div>
            <div>Type: <strong>${formatShotType(d.type)}</strong></div>
            <div>Period: ${d.period}</div>
            <div>Time: ${d.time}</div>
            ${d.shotType ? `<div>Shot: ${d.shotType}</div>` : ''}
            <div style="margin-top: 4px; color: #FF4C00;">
              xG: ${formatPercent(xG * 100)}
            </div>
          `);

        d3.select(this)
          .transition()
          .duration(150)
          .attr('r', getShotRadius(d.type) * 1.5)
          .attr('opacity', 1);
      })
      .on('mousemove', function (event) {
        tooltip
          .style('top', (event.pageY - 10) + 'px')
          .style('left', (event.pageX + 10) + 'px');
      })
      .on('mouseout', function (_event, d) {
        tooltip.style('visibility', 'hidden');
        d3.select(this)
          .transition()
          .duration(150)
          .attr('r', getShotRadius(d.type))
          .attr('opacity', 0.8);
      })
      .transition()
      .duration(500)
      .delay((_, i) => i * 20)
      .attr('r', d => getShotRadius(d.type));

    // Cleanup tooltip on unmount
    return () => {
      tooltip.remove();
    };
  }, [shots, showHalfRink]);

  return (
    <div className="chart-container">
      <h3 className="text-lg font-semibold mb-4 text-oilers-orange">{title}</h3>
      <svg ref={svgRef} className="w-full h-auto" />
      <div className="flex justify-center gap-6 mt-4 text-sm">
        <LegendItem color="var(--color-chart-goal)" label="Goal" />
        <LegendItem color="var(--color-chart-shot)" label="Shot on Goal" />
        <LegendItem color="var(--color-chart-miss)" label="Missed" />
        <LegendItem color="var(--color-chart-block)" label="Blocked" />
      </div>
    </div>
  );
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <div
        className="w-3 h-3 rounded-full"
        style={{ backgroundColor: color }}
      />
      <span className="text-gray-400">{label}</span>
    </div>
  );
}

function formatShotType(type: string): string {
  switch (type) {
    case 'goal':
      return 'GOAL';
    case 'shot-on-goal':
      return 'Shot on Goal';
    case 'missed-shot':
      return 'Missed Shot';
    case 'blocked-shot':
      return 'Blocked Shot';
    default:
      return type;
  }
}

function drawRinkMarkings(
  g: d3.Selection<SVGGElement, unknown, null, undefined>,
  width: number,
  height: number,
  isHalfRink: boolean
) {
  const strokeColor = '#3b4a6b';
  const redLineColor = '#c53030';
  const blueLineColor = '#2b6cb0';

  // Goal line (red)
  const goalLineX = isHalfRink ? width * 0.89 : RINK.SVG_WIDTH * 0.945;
  g.append('line')
    .attr('x1', goalLineX)
    .attr('y1', 0)
    .attr('x2', goalLineX)
    .attr('y2', height)
    .attr('stroke', redLineColor)
    .attr('stroke-width', 2);

  // Blue line
  const blueLineX = isHalfRink ? width * 0.25 : RINK.SVG_WIDTH * 0.625;
  g.append('line')
    .attr('x1', blueLineX)
    .attr('y1', 0)
    .attr('x2', blueLineX)
    .attr('y2', height)
    .attr('stroke', blueLineColor)
    .attr('stroke-width', 3);

  // Goal crease (semi-circle)
  const creaseX = isHalfRink ? width * 0.89 : RINK.SVG_WIDTH * 0.945;
  const creaseRadius = 25;
  g.append('path')
    .attr('d', `M ${creaseX},${height / 2 - creaseRadius} A ${creaseRadius},${creaseRadius} 0 0,0 ${creaseX},${height / 2 + creaseRadius}`)
    .attr('fill', 'rgba(59, 130, 246, 0.2)')
    .attr('stroke', blueLineColor)
    .attr('stroke-width', 2);

  // Goal net (rectangle)
  const netWidth = 8;
  const netHeight = 30;
  g.append('rect')
    .attr('x', creaseX)
    .attr('y', height / 2 - netHeight / 2)
    .attr('width', netWidth)
    .attr('height', netHeight)
    .attr('fill', 'none')
    .attr('stroke', redLineColor)
    .attr('stroke-width', 2);

  // Face-off circles
  const faceOffY = [height * 0.25, height * 0.75];
  const faceOffX = isHalfRink ? width * 0.65 : RINK.SVG_WIDTH * 0.825;
  const circleRadius = 35;

  faceOffY.forEach(y => {
    g.append('circle')
      .attr('cx', faceOffX)
      .attr('cy', y)
      .attr('r', circleRadius)
      .attr('fill', 'none')
      .attr('stroke', redLineColor)
      .attr('stroke-width', 1.5);

    // Face-off dot
    g.append('circle')
      .attr('cx', faceOffX)
      .attr('cy', y)
      .attr('r', 4)
      .attr('fill', redLineColor);
  });

  // Center face-off dot (only for full rink)
  if (!isHalfRink) {
    g.append('circle')
      .attr('cx', width / 2)
      .attr('cy', height / 2)
      .attr('r', 5)
      .attr('fill', blueLineColor);
  }

  // Rink outline
  g.append('rect')
    .attr('width', width)
    .attr('height', height)
    .attr('fill', 'none')
    .attr('stroke', strokeColor)
    .attr('stroke-width', 2)
    .attr('rx', 20);
}

export default ShotMap;
