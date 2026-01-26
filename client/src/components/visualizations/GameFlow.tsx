import { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import type { CorsiFlowPoint } from '../../types/hockey';

interface GameFlowProps {
  data: CorsiFlowPoint[];
  homeTeam?: string;
  awayTeam?: string;
  title?: string;
}

export function GameFlow({
  data,
  homeTeam = 'EDM',
  awayTeam = 'OPP',
  title = 'Game Flow (Corsi Differential)'
}: GameFlowProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || data.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const margin = { top: 30, right: 30, bottom: 50, left: 50 };
    const width = 800 - margin.left - margin.right;
    const height = 300 - margin.top - margin.bottom;

    svg.attr('viewBox', `0 0 ${width + margin.left + margin.right} ${height + margin.top + margin.bottom}`);

    const g = svg.append('g').attr('transform', `translate(${margin.left}, ${margin.top})`);

    // X scale (time/index)
    const xScale = d3.scaleLinear()
      .domain([0, data.length - 1])
      .range([0, width]);

    // Y scale (differential)
    const maxDiff = Math.max(
      Math.abs(d3.min(data, d => d.differential) || 0),
      Math.abs(d3.max(data, d => d.differential) || 0)
    ) + 5;

    const yScale = d3.scaleLinear()
      .domain([-maxDiff, maxDiff])
      .range([height, 0]);

    // Define gradient for area fill
    const defs = svg.append('defs');

    // Gradient for positive (home winning)
    const gradientPositive = defs.append('linearGradient')
      .attr('id', 'area-gradient-positive')
      .attr('x1', '0%').attr('y1', '0%')
      .attr('x2', '0%').attr('y2', '100%');
    gradientPositive.append('stop')
      .attr('offset', '0%')
      .attr('stop-color', '#FF4C00')
      .attr('stop-opacity', 0.6);
    gradientPositive.append('stop')
      .attr('offset', '100%')
      .attr('stop-color', '#FF4C00')
      .attr('stop-opacity', 0);

    // Gradient for negative (away winning)
    const gradientNegative = defs.append('linearGradient')
      .attr('id', 'area-gradient-negative')
      .attr('x1', '0%').attr('y1', '100%')
      .attr('x2', '0%').attr('y2', '0%');
    gradientNegative.append('stop')
      .attr('offset', '0%')
      .attr('stop-color', '#3b82f6')
      .attr('stop-opacity', 0.6);
    gradientNegative.append('stop')
      .attr('offset', '100%')
      .attr('stop-color', '#3b82f6')
      .attr('stop-opacity', 0);

    // Draw zero line
    g.append('line')
      .attr('x1', 0)
      .attr('x2', width)
      .attr('y1', yScale(0))
      .attr('y2', yScale(0))
      .attr('stroke', '#4a5568')
      .attr('stroke-width', 2)
      .attr('stroke-dasharray', '5,5');

    // Create area generators
    const areaAbove = d3.area<CorsiFlowPoint>()
      .x((_, i) => xScale(i))
      .y0(yScale(0))
      .y1(d => d.differential > 0 ? yScale(d.differential) : yScale(0))
      .curve(d3.curveMonotoneX);

    const areaBelow = d3.area<CorsiFlowPoint>()
      .x((_, i) => xScale(i))
      .y0(yScale(0))
      .y1(d => d.differential < 0 ? yScale(d.differential) : yScale(0))
      .curve(d3.curveMonotoneX);

    // Draw areas with animation
    g.append('path')
      .datum(data)
      .attr('fill', 'url(#area-gradient-positive)')
      .attr('d', areaAbove)
      .attr('opacity', 0)
      .transition()
      .duration(1000)
      .attr('opacity', 1);

    g.append('path')
      .datum(data)
      .attr('fill', 'url(#area-gradient-negative)')
      .attr('d', areaBelow)
      .attr('opacity', 0)
      .transition()
      .duration(1000)
      .attr('opacity', 1);

    // Draw line
    const line = d3.line<CorsiFlowPoint>()
      .x((_, i) => xScale(i))
      .y(d => yScale(d.differential))
      .curve(d3.curveMonotoneX);

    const path = g.append('path')
      .datum(data)
      .attr('fill', 'none')
      .attr('stroke', '#fff')
      .attr('stroke-width', 2)
      .attr('d', line);

    // Animate line drawing
    const totalLength = path.node()?.getTotalLength() || 0;
    path
      .attr('stroke-dasharray', `${totalLength} ${totalLength}`)
      .attr('stroke-dashoffset', totalLength)
      .transition()
      .duration(2000)
      .ease(d3.easeLinear)
      .attr('stroke-dashoffset', 0);

    // Period markers
    const periodsInData = [...new Set(data.map(d => d.period))].sort();
    let periodStartIndex = 0;

    periodsInData.forEach((period, idx) => {
      if (idx > 0) {
        const firstOfPeriod = data.findIndex((d, i) => i > periodStartIndex && d.period === period);
        if (firstOfPeriod > 0) {
          g.append('line')
            .attr('x1', xScale(firstOfPeriod))
            .attr('x2', xScale(firstOfPeriod))
            .attr('y1', 0)
            .attr('y2', height)
            .attr('stroke', '#6b7280')
            .attr('stroke-width', 1)
            .attr('stroke-dasharray', '3,3');

          g.append('text')
            .attr('x', xScale(firstOfPeriod))
            .attr('y', -10)
            .attr('text-anchor', 'middle')
            .attr('fill', '#9ca3af')
            .attr('font-size', '10px')
            .text(`P${period}`);

          periodStartIndex = firstOfPeriod;
        }
      }
    });

    // X axis
    g.append('g')
      .attr('transform', `translate(0, ${height})`)
      .call(d3.axisBottom(xScale).ticks(5).tickFormat(() => ''))
      .selectAll('line, path')
      .attr('stroke', '#4a5568');

    g.append('text')
      .attr('x', width / 2)
      .attr('y', height + 35)
      .attr('text-anchor', 'middle')
      .attr('fill', '#9ca3af')
      .attr('font-size', '12px')
      .text('Game Progress →');

    // Y axis
    g.append('g')
      .call(d3.axisLeft(yScale).ticks(5))
      .selectAll('line, path')
      .attr('stroke', '#4a5568');

    g.selectAll('.tick text')
      .attr('fill', '#9ca3af');

    // Y axis label
    g.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('x', -height / 2)
      .attr('y', -35)
      .attr('text-anchor', 'middle')
      .attr('fill', '#9ca3af')
      .attr('font-size', '12px')
      .text('Corsi Differential');

    // Team labels
    g.append('text')
      .attr('x', width - 10)
      .attr('y', 20)
      .attr('text-anchor', 'end')
      .attr('fill', '#FF4C00')
      .attr('font-weight', 'bold')
      .attr('font-size', '14px')
      .text(`↑ ${homeTeam}`);

    g.append('text')
      .attr('x', width - 10)
      .attr('y', height - 10)
      .attr('text-anchor', 'end')
      .attr('fill', '#3b82f6')
      .attr('font-weight', 'bold')
      .attr('font-size', '14px')
      .text(`↓ ${awayTeam}`);

    // Final differential label
    const finalDiff = data[data.length - 1]?.differential || 0;
    g.append('text')
      .attr('x', width + 10)
      .attr('y', yScale(finalDiff))
      .attr('fill', finalDiff > 0 ? '#FF4C00' : '#3b82f6')
      .attr('font-weight', 'bold')
      .attr('font-size', '14px')
      .attr('dominant-baseline', 'middle')
      .text(finalDiff > 0 ? `+${finalDiff}` : finalDiff.toString());

  }, [data, homeTeam, awayTeam]);

  return (
    <div className="chart-container">
      <h3 className="text-lg font-semibold mb-4 text-oilers-orange">{title}</h3>
      <svg ref={svgRef} className="w-full h-auto" />
      <p className="text-xs text-gray-500 mt-2 text-center">
        Corsi measures all shot attempts. Above the line = {homeTeam} controlling play.
      </p>
    </div>
  );
}

export default GameFlow;
